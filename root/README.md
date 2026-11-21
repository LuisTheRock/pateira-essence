# ESSENCE – NYE 2026/27 pre-reservations

Landing page for the ESSENCE New Year's Eve event (Pateira de Fermentelos) with a public pre-reservation form and a protected admin area for the organizers. Texts shown to visitors are in Portuguese.

**Stack:** Next.js 16 (App Router, server actions), React 19, Tailwind 4, Supabase (Postgres + Auth). No other backend.

## Quick start

```bash
cp .env.example .env     # fill in the two Supabase values (Project Settings > API)
npm install
npm run dev              # http://localhost:3000
```

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key. Safe in the browser: access is enforced by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (service role) key, **server only**. Used for the one insert from the public form. Never expose it or prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (captcha on the public form). Without the secret the check is skipped in dev and rejects everyone in production. |

Scripts: `npm run dev`, `build`, `start`, `lint`, `test` (unit tests for `lib/validate.ts`).

## How it works

| Route | What it is |
|---|---|
| `/` | Public landing page, countdown, privacy notice and the pre-reservation form. No cookies. |
| `/auth` | Organizer login (email + password, Supabase Auth). |
| `/admin` | Organizer-only list of requests: status tabs with counts, search, pagination (25 per page), total bracelets, edit data, change status, internal notes. |

Flow:

1. A visitor submits the form. `submitReservation` (`app/actions.ts`) validates with `lib/validate.ts` (a hidden `website` field is a honeypot) and inserts from the server with the service role key (anon cannot insert, so the captcha cannot be skipped).
2. The database trigger merges repeats per phone (see below).
3. An organizer logs in at `/auth`, then manages requests in `/admin`.

Statuses: `pendente` (default), `confirmado`, `lista_espera`, `recusado`.

### Code map

| File | Role |
|---|---|
| `app/page.tsx` | Landing page and privacy notice text |
| `app/reservation-form.tsx`, `quantity.tsx` | Public form (client) |
| `app/actions.ts` | Server actions: `submitReservation`, `login`, `logout`, `updateReservation` (status + notes), `updateReservationInfo` (data) |
| `app/admin/page.tsx` | Admin list; runs 3 queries per load: list page, bracelet total, counts per status |
| `app/auth/*` | Login page and form |
| `app/ui.ts` | Shared styles and the `STATUSES` map |
| `lib/validate.ts` | Form validation shared by the public form and the admin edit dialog |
| `lib/supabase.ts` | Server-side Supabase client (cookie based) |
| `proxy.ts` | Refreshes the session and redirects logged-out visitors from `/admin` to `/auth` |
| `supabase/schema.sql` | Whole database setup |
| `supabase/test.sql` | Tests for the merge trigger |

## Database (Supabase)

Everything lives in `supabase/schema.sql`: one table, `public.reservations`, with row-level security.

**Table:** `id`, `created_at`, `nome` (1–120 chars), `instagram` (1–60), `telemovel` (exactly 9 digits, **unique**), `qtd` (1–10), `acknowledged_at`, `status`, `notas` (≤1000).

**Access rules**

| Who | Can |
|---|---|
| Visitors (`anon`) | Nothing: no read, no insert. The server inserts for them (only `nome`, `instagram`, `telemovel`, `qtd`, so always `pendente` with no notes). |
| Organizers (`authenticated` with `app_metadata.role = 'organizer'`) | Read and update. |
| Any other signed-in user | See nothing (RLS returns zero rows, no error). |

**Trigger `merge_request_per_phone`** (before insert, security definer): one row per phone.
- Phone not seen: normal insert.
- Existing `pendente` row: `qtd` is added to it, up to 10 in total.
- Existing `recusado` row: reset to a fresh `pendente` request with the new `qtd`.
- Existing `confirmado` / `lista_espera` row, or total over 10: rejected with the generic error `REJ00`. The same error for every case, so the form can't be used to find out which phones are registered.
- An advisory lock per phone serialises simultaneous submits.

**Functions** (execute granted to `authenticated` only; they run as the caller so RLS applies)
- `reservations_counts()` returns the number of requests per status (admin tabs).
- `reservations_bracelets(status, q)` returns total bracelets for the current filter, with no 1000-row cap.

Policies wrap `auth.jwt()` as `(select auth.jwt())` so it is evaluated once per query, not once per row.

### Set up from scratch

1. Authentication > Sign In / Providers: turn **OFF** "Allow new users to sign up" (do this before going live).
2. SQL editor: run `supabase/schema.sql`, then optionally `supabase/test.sql` (it rolls back and leaves no data).
3. Create the first organizer (see below).

### Reset the database

This deletes all reservations. Export first (Table Editor > reservations > Export CSV).

```sql
drop table if exists public.reservations cascade;  -- also drops its policies, index and trigger
drop function if exists public.merge_request_per_phone();
drop function if exists public.reservations_bracelets(text, text);
drop function if exists public.reservations_counts();
```

Then run `schema.sql` again. Organizer accounts live in `auth.users` and are not affected.

### Updating an existing database

`create policy` can't be re-run, so drop the three policies first, then re-run the policy statements. For functions use `create or replace` (`merge_request_per_phone`) or run the new `create function` blocks (`reservations_bracelets`, `reservations_counts`). Mark the organizer accounts **before** dropping the old policies, or you lock yourself out. Migration notes for databases from before the merge trigger are at the bottom of `schema.sql`.

## Managing organizers

Organizers are normal Supabase Auth users that carry `role: organizer` in `app_metadata`. Users cannot edit `app_metadata` themselves, and there is no sign-up page.

**Add an organizer**
1. Authentication > Users > Add user > Create new user. Enter email and password and tick "Auto Confirm User".
2. In the SQL editor:
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"organizer"}'
   where email = 'their@email.com';
   ```
3. Check with `select email, raw_app_meta_data from auth.users;`. The role is read from the login token, so if they were already signed in they must **log out and back in**.

**Remove access**
- Delete the user in Authentication > Users, or remove only the role:
  ```sql
  update auth.users set raw_app_meta_data = raw_app_meta_data - 'role' where email = 'their@email.com';
  ```
- A removed role takes effect when their current token expires (about an hour by default) or they sign in again.

A user without the role can log in but sees an empty admin page.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Admin shows "Sem pedidos" and all counts are 0 although rows exist | The account has no `organizer` role, or the session is old. Add the role and sign in again. |
| Counts are 0 but the list works | `reservations_counts` is missing. Run its block from `schema.sql`. |
| A request is on the page but not in the tab | The default tab is "Pendente". Use "Todos". |
| Public form says it couldn't register the request | Repeat phone that is already confirmed/waitlisted, total over 10, or a database error. Intentionally not specific. |
| "Esse telemóvel já tem outro pedido." in the admin edit dialog | The phone is unique. Another request already uses it. |

## Data retention

Per the privacy notice, data is kept until 30 days after the event, then deleted or anonymised by the organizers. This is **manual**: nothing deletes it automatically.

## Deploy

Any Next.js host (e.g. Vercel). Set the two `NEXT_PUBLIC_SUPABASE_*` variables in the host's environment. Check Next.js 16 specifics in `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).
