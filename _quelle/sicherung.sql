-- TPC Lager App – Update: Papierkorb + Datensicherung (ab App-Version 1.102)
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run
-- Nochmal ausführen schadet nicht (der Sicherungs-Schlüssel bleibt dann gleich).
--
-- Papierkorb: JEDES Löschen in der Tabelle docs wird von der Datenbank selbst aufgefangen (egal aus welcher Stelle der App)
--   und 30 Tage in der Tabelle papierkorb aufbewahrt. Ansehen und wiederherstellen darf nur der Administrator.
-- Datensicherung: eine nächtliche Sicherung (GitHub) holt alle Daten mit einem geheimen Sicherungs-Schlüssel.
--   Der Schlüssel wird hier einmalig erzeugt und am Ende angezeigt – nur dort, nirgends sonst gespeichert (in der
--   Datenbank liegt nur sein Fingerabdruck). Er darf nur lesen, nichts ändern.
-- Die Rechte-Funktionen can_read/can_write/can_delete werden hier NICHT verändert (Stand bleibt auftraege.sql).

-- 1) Papierkorb ------------------------------------------------------------------------
create table if not exists public.papierkorb (
  nr bigserial primary key,
  col text not null,
  doc_id text not null,
  data jsonb not null,
  deleted_by uuid,
  deleted_at timestamptz not null default now()
);
create index if not exists papierkorb_doc on public.papierkorb (doc_id);
create index if not exists papierkorb_zeit on public.papierkorb (deleted_at);
alter table public.papierkorb enable row level security;
drop policy if exists papierkorb_read on public.papierkorb;
create policy papierkorb_read on public.papierkorb for select to authenticated using (app_admin());
-- keine Policies für insert/update/delete: nur die Funktionen unten schreiben hinein

create or replace function public.papierkorb_fang() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.col not in ('hord') then
    insert into papierkorb (col, doc_id, data, deleted_by) values (old.col, old.id, old.data, auth.uid());
  end if;
  delete from papierkorb where deleted_at < now() - interval '30 days';
  return old;
end $$;
drop trigger if exists papierkorb_fang on public.docs;
create trigger papierkorb_fang before delete on public.docs for each row execute function public.papierkorb_fang();

-- Liste für die App (ohne die großen Daten, nur was zum Erkennen nötig ist)
create or replace function public.papierkorb_liste() returns table (nr bigint, col text, doc_id text, info jsonb, deleted_by uuid, deleted_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.nr, p.col, p.doc_id,
    jsonb_strip_nulls(jsonb_build_object('ev', p.data->>'ev', 'ord', p.data->>'ord', 'ps', p.data->>'ps', 'name', p.data->>'name',
      'nr', p.data->>'nr', 'art', p.data->>'art', 'nm', p.data->>'nm', 'txt', left(p.data->>'txt', 80), 't', left(p.data->>'t', 80),
      'title', left(p.data->>'title', 80), 'by', p.data->>'by', 'g', p.data->>'g')),
    p.deleted_by, p.deleted_at
  from papierkorb p where app_admin() order by p.deleted_at desc;
$$;

-- Wiederherstellen: der Eintrag + alles, was im selben Zug mitgelöscht wurde (Herricht-Stand, Fotos)
create or replace function public.papierkorb_zurueck(p_nr bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r papierkorb; x papierkorb; ok int := 0; schon int := 0;
begin
  if not app_admin() then raise exception 'Nur der Administrator darf wiederherstellen'; end if;
  select * into r from papierkorb where nr = p_nr;
  if r.nr is null then raise exception 'Nicht mehr im Papierkorb'; end if;
  for x in select * from papierkorb
    where nr = r.nr or (deleted_at between r.deleted_at - interval '10 minutes' and r.deleted_at + interval '10 minutes'
      and r.col <> 'fotos' and (doc_id = r.doc_id or (col = 'fotos' and (doc_id like r.doc_id || '-%' or doc_id like r.doc_id || 'r-%'))))
    order by nr
  loop
    if exists (select 1 from docs where col = x.col and id = x.doc_id) then schon := schon + 1;
    else
      insert into docs (col, id, data, updated_at) values (x.col, x.doc_id, x.data, now());
      delete from papierkorb where nr = x.nr; ok := ok + 1;
    end if;
  end loop;
  return jsonb_build_object('ok', ok, 'schon', schon);
end $$;

-- 2) Datensicherung -------------------------------------------------------------------
create table if not exists public.sicherung (k text primary key, wert text, t timestamptz not null default now());
alter table public.sicherung enable row level security;   -- keine Policies: von außen nicht lesbar

create or replace function public.sicherung_ok(p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sicherung where k = 'schluessel' and wert = encode(sha256(convert_to(coalesce(p_key, ''), 'UTF8')), 'hex'));
$$;

-- Alle Einträge seitenweise (für die nächtliche Sicherung)
create or replace function public.sicherung_docs(p_key text, p_ab int default 0, p_n int default 200) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not sicherung_ok(p_key) then raise exception 'Falscher Sicherungs-Schlüssel'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('col', col, 'id', id, 'data', data, 'updated_at', updated_at) order by col, id)
    from (select * from docs order by col, id offset greatest(p_ab, 0) limit least(greatest(p_n, 1), 500)) s), '[]'::jsonb);
end $$;

create or replace function public.sicherung_profile(p_key text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not sicherung_ok(p_key) then raise exception 'Falscher Sicherungs-Schlüssel'; end if;
  return coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at) from profiles p), '[]'::jsonb);
end $$;

create or replace function public.sicherung_fertig(p_key text, p_n int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not sicherung_ok(p_key) then raise exception 'Falscher Sicherungs-Schlüssel'; end if;
  insert into sicherung (k, wert, t) values ('zuletzt', p_n::text, now()) on conflict (k) do update set wert = excluded.wert, t = now();
end $$;

-- Stand für die App (nur Admin): wann lief die letzte Sicherung, wie viele Einträge, wie viele gibt es jetzt
create or replace function public.sicherung_stand() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when app_admin() then jsonb_build_object(
    'schluessel', exists (select 1 from sicherung where k = 'schluessel'),
    'zuletzt', (select t from sicherung where k = 'zuletzt'),
    'n', (select wert::int from sicherung where k = 'zuletzt'),
    'jetzt', (select count(*) from docs),
    'korb', (select count(*) from papierkorb)) end;
$$;

revoke all on public.papierkorb from anon, authenticated;
grant select on public.papierkorb to authenticated;          -- lesen nur Admin (Policy oben)
revoke all on public.sicherung from anon, authenticated;
revoke all on function public.papierkorb_fang() from public;
grant execute on function public.papierkorb_liste() to authenticated;
grant execute on function public.papierkorb_zurueck(bigint) to authenticated;
grant execute on function public.sicherung_docs(text,int,int) to anon, authenticated;
grant execute on function public.sicherung_profile(text) to anon, authenticated;
grant execute on function public.sicherung_fertig(text,int) to anon, authenticated;
grant execute on function public.sicherung_stand() to authenticated;
revoke all on function public.sicherung_ok(text) from public, anon, authenticated;

-- 3) Sicherungs-Schlüssel erzeugen (nur beim ersten Mal) und anzeigen ---------------------
with neu as (select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') as k),
ins as (insert into sicherung (k, wert) select 'schluessel', encode(sha256(convert_to(k, 'UTF8')), 'hex') from neu
        where not exists (select 1 from sicherung where k = 'schluessel') returning 1)
select case when exists (select 1 from ins)
  then 'Fertig. NEUER Sicherungs-Schlüssel (bei GitHub als SB_BACKUP_KEY eintragen, NICHT in den Chat): ' || (select k from neu)
  else 'Fertig. Papierkorb und Sicherung eingerichtet. Der Sicherungs-Schlüssel existiert schon (wurde beim ersten Ausführen angezeigt).' end as ergebnis;
