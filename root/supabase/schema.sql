-- Run in the Supabase SQL editor.
-- BEFORE going live: Authentication > Sign In / Providers > turn OFF "Allow new users to sign up".
-- Organizers are users whose app_metadata.role is 'organizer' (users cannot edit app_metadata themselves).
-- Create the account (Authentication > Users > Add user), then mark it in the SQL editor:
--   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"organizer"}' where email = 'you@example.com';
-- The role is read from the login token, so the organizer must sign in again after this.

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null check (char_length(nome) between 1 and 120),
  instagram text not null check (char_length(instagram) between 1 and 60),
  telemovel text not null check (telemovel ~ '^[0-9]{9}$'),
  qtd int not null check (qtd between 1 and 10),
  acknowledged_at timestamptz not null default now(),
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'lista_espera', 'recusado')),
  notas text check (char_length(notas) <= 1000)
);

alter table public.reservations enable row level security;

-- Public: no policy for anon, so nobody can read or write directly. The form inserts from the server with the service role key (after the Turnstile check).

-- Organizers (role in the login token): read and update. Other signed-in users see nothing.
create policy "organizers read" on public.reservations for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'organizer');
create policy "organizers update" on public.reservations for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'organizer')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'organizer');

-- Table privileges (RLS policies only filter rows; the roles still need GRANTs).
-- anon cannot insert at all (a bot could otherwise call the Supabase API directly and skip the captcha).
revoke insert on public.reservations from anon;
grant select, update on public.reservations to authenticated;

-- One row per phone. A repeat request is merged into a still-pending row (qtd added), up to 10 tickets in total.
-- A refused row is reset as a fresh request. A confirmed or waitlisted row is never touched by the public form.
-- Every rejection raises the same error, so the form cannot be used to find out which phones are registered.
-- Runs as owner because the form role cannot select; the advisory lock serialises simultaneous submits per phone.
create unique index reservations_telemovel_key on public.reservations (telemovel);

create or replace function public.merge_request_per_phone() returns trigger
language plpgsql security definer set search_path = public as $$
declare cur public.reservations;
begin
  perform pg_advisory_xact_lock(hashtext(new.telemovel));
  select * into cur from public.reservations where telemovel = new.telemovel;
  if not found then return new; end if;
  if cur.status = 'recusado' then
    update public.reservations set nome = new.nome, instagram = new.instagram, qtd = new.qtd, status = 'pendente' where id = cur.id;
  else
    if cur.status <> 'pendente' or cur.qtd + new.qtd > 10 then
      raise exception 'request rejected' using errcode = 'REJ00';
    end if;
    update public.reservations set qtd = cur.qtd + new.qtd where id = cur.id;
  end if;
  return null; -- cancel the insert; the existing row was updated
end $$;

create or replace trigger reservations_merge_request before insert on public.reservations
  for each row execute function public.merge_request_per_phone();

-- Total bracelets for the admin page: same filters as the list, no 1000-row cap. Runs as the caller, so RLS applies.
create or replace function public.reservations_bracelets(p_status text, p_q text) returns bigint
language sql stable set search_path = public as $$
  select coalesce(sum(qtd), 0) from public.reservations
  where (p_status = 'todos' or status = p_status)
    and (p_q = '' or nome ilike '%' || p_q || '%' or instagram ilike '%' || p_q || '%' or telemovel ilike '%' || p_q || '%');
$$;
grant execute on function public.reservations_bracelets(text, text) to authenticated;
revoke execute on function public.reservations_bracelets(text, text) from public, anon;

-- Request count per status for the admin tabs, in one query. Runs as the caller, so RLS applies.
create or replace function public.reservations_counts() returns table(status text, n bigint)
language sql stable set search_path = public as $$
  select status, count(*) from public.reservations group by status;
$$;
grant execute on function public.reservations_counts() to authenticated;
revoke execute on function public.reservations_counts() from public, anon;

-- Already deployed with the old public insert? Run: drop policy "public can create pending requests" on public.reservations; revoke insert on public.reservations from anon;
-- Already deployed? Re-create the three organizer policies (drop policy ... first; they now wrap auth.jwt() in a select), `create or replace function` for merge_request_per_phone, run reservations_bracelets and reservations_counts above,
-- and mark the organizer accounts (see top) BEFORE dropping the old policies, or you lock yourself out.
-- Old tables from before the merge trigger: run, in this order:
-- drop trigger if exists reservations_limit_tickets on public.reservations;
-- drop function if exists public.limit_tickets_per_phone();
-- -- merge existing duplicates (keeps the oldest row of each phone, summed qtd; check sums <= 10 first):
-- update public.reservations r set qtd = least(t.total, 10), status = 'pendente'
--   from (select telemovel, sum(qtd) total, min(created_at) first from public.reservations where status <> 'recusado' group by telemovel having count(*) > 1) t
--   where r.telemovel = t.telemovel and r.created_at = t.first;
-- delete from public.reservations r using (select telemovel, min(created_at) first from public.reservations where status <> 'recusado' group by telemovel having count(*) > 1) t
--   where r.telemovel = t.telemovel and r.created_at > t.first;
-- then run the unique index, function and trigger above (refused duplicates must be removed manually first).
