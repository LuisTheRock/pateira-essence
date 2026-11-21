-- Run in the Supabase SQL editor AFTER schema.sql. Raises on the first failure and rolls everything back.
begin;
do $$
declare r public.reservations; failed boolean;
begin
  -- new phone: inserted as is
  insert into reservations (nome, instagram, telemovel, qtd) values ('A', 'a', '900000001', 2);
  -- repeat while pending: merged into one row, qtd added
  insert into reservations (nome, instagram, telemovel, qtd) values ('A', 'a', '900000001', 3);
  select * into r from reservations where telemovel = '900000001';
  assert (select count(*) from reservations where telemovel = '900000001') = 1, 'pending repeat must merge';
  assert r.qtd = 5, 'qtd must add up';

  -- over 10 in total: rejected, row unchanged
  failed := false;
  begin insert into reservations (nome, instagram, telemovel, qtd) values ('A', 'a', '900000001', 6);
  exception when sqlstate 'REJ00' then failed := true; end;
  assert failed, 'over 10 must be rejected';
  assert (select qtd from reservations where telemovel = '900000001') = 5, 'rejected request must not change qtd';

  -- confirmed and waitlisted rows are never touched by the public form
  foreach r.status in array array['confirmado', 'lista_espera'] loop
    update reservations set status = r.status where telemovel = '900000001';
    failed := false;
    begin insert into reservations (nome, instagram, telemovel, qtd) values ('A', 'a', '900000001', 1);
    exception when sqlstate 'REJ00' then failed := true; end;
    assert failed, r.status || ' must reject repeats';
    assert (select status from reservations where telemovel = '900000001') = r.status, r.status || ' must keep its status';
  end loop;

  -- refused: reset as a fresh pending request
  update reservations set status = 'recusado' where telemovel = '900000001';
  insert into reservations (nome, instagram, telemovel, qtd) values ('A', 'a', '900000001', 1);
  select * into r from reservations where telemovel = '900000001';
  assert r.status = 'pendente' and r.qtd = 1, 'refused row must restart as pending with the new qtd';
end $$;
rollback;
