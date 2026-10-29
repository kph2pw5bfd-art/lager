-- TPC Lager App – Update: Material-Protokoll der Retourscheine (ab App-Version 1.47)
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run
-- Voraussetzung: rechte.sql und materialliste.sql wurden schon ausgeführt. Nochmal ausführen schadet nicht.
--
-- Jede Mengen-Änderung im Retourschein wird als Zeile in docs (col 'rlog') gespeichert.
-- Schreiben: alle freigegebenen Benutzer, aber nur über die Funktion rlog_add (nur neue Zeilen).
-- Lesen: nur der Administrator. Ändern oder löschen: niemand.

-- 1) Wer darf lesen?
create or replace function public.can_read(c text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'retour'  then app_see('ret')
      when 'defekte' then app_see('def') or d->>'by' = auth.uid()::text
      when 'infos'   then app_see('inf') or d->>'by' = auth.uid()::text
      when 'rlog'    then app_admin()
      else true
    end);
$$;

-- 2) Wer darf anlegen und ändern? (rlog nie direkt)
create or replace function public.can_write(c text, i text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'artikel'   then app_right('v_app')
      when 'rkat'      then app_right('v_app')
      when 'titel'     then app_right('v_rights')
      when 'rolle'     then app_right('v_rights')
      when 'werkstatt' then app_admin()
      when 'lager'     then app_admin()
      when 'retour'    then app_right('ret_b')
      when 'users'     then i = auth.uid()::text
      when 'infos'     then app_right('inf_b') or d->>'by' = auth.uid()::text
      when 'defekte'   then app_right('def_b') or d->>'by' = auth.uid()::text
      when 'lists'     then coalesce(d->>'chk', 'false') <> 'true' or app_right('mat_b')
      when 'meta'      then app_admin()
      when 'rlog'      then false
      else true
    end);
$$;

-- 3) Wer darf löschen? (rlog niemand)
create or replace function public.can_delete(c text, i text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'retour'  then app_right('ret_l')
      when 'defekte' then app_right('def_l')
      when 'infos'   then app_right('inf_l')
      when 'lists'   then app_right('mat_l')
      when 'rlog'    then false
      else can_write(c, i, d)
    end);
$$;

-- 4) Protokoll-Zeilen anlegen (nur neue Zeilen, „by“ wird immer auf den angemeldeten Benutzer gesetzt)
create or replace function public.rlog_add(p_rows jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare r jsonb; n integer := 0; b bigint;
begin
  if not app_active() then raise exception 'Keine Berechtigung'; end if;
  -- Zeilen von vor dem Nachtrag sind dort schon enthalten -> überspringen (sonst doppelt)
  select coalesce((data->>'t')::bigint, 0) into b from docs where col = 'meta' and id = 'rlog_backfill';
  b := coalesce(b, 0);
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then raise exception 'Ungültige Daten'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    if coalesce(r->>'id','') = '' or length(r->>'id') > 60 then continue; end if;
    if coalesce((r->'d'->>'t')::bigint, 0) < b then continue; end if;
    insert into docs (col, id, data)
      values ('rlog', r->>'id', (r->'d') - 'by' || jsonb_build_object('by', auth.uid()::text))
      on conflict (col, id) do nothing;
    if found then n := n + 1; end if;
  end loop;
  return n;
end $$;
grant execute on function public.rlog_add(jsonb) to authenticated;

-- 5) Bestehende Retourscheine einmalig nachtragen (mit Anlegedatum, ohne Uhrzeit)
do $$
declare r record; it record; src jsonb; k text; tot jsonb;
begin
  if exists (select 1 from docs where col = 'meta' and id = 'rlog_backfill') then return; end if;
  for r in select id, data from docs where col = 'retour' loop
    tot := '{}'::jsonb;
    -- Grundstand + alle Anteile der Personen zusammenzählen
    for src in
      select (r.data->>'itemsJson')::jsonb where coalesce(r.data->>'itemsJson','') <> ''
      union all
      select (value #>> '{}')::jsonb from jsonb_each(r.data) where key like 'pa\_%'
    loop
      for it in select * from jsonb_each(src) loop
        k := it.key;
        if jsonb_typeof(it.value) <> 'object' then continue; end if;
        tot := jsonb_set(tot, array[k],
          coalesce(tot->k, it.value) || jsonb_build_object('q', coalesce((tot->k->>'q')::numeric, 0) + coalesce((it.value->>'q')::numeric, 0)));
      end loop;
    end loop;
    for it in select * from jsonb_each(tot) loop
      if coalesce((it.value->>'q')::numeric, 0) <= 0 then continue; end if;
      insert into docs (col, id, data) values ('rlog', 'alt_' || r.id || '_' || md5(it.key),
        jsonb_build_object(
          't', coalesce((r.data->>'t')::bigint, 0), 'nt', true, 'by', coalesce(r.data->>'by',''),
          'rid', r.id, 'ev', coalesce(r.data->>'ev',''), 'ord', coalesce(r.data->>'ord',''),
          'k', it.key, 'nr', coalesce(it.value->>'nr',''), 'name', coalesce(it.value->>'name',''),
          'g', case when it.value->>'g' = 'Händisch' then 'Manuell' else coalesce(it.value->>'g','') end,
          'd', (it.value->>'q')::numeric))
        on conflict (col, id) do nothing;
    end loop;
  end loop;
  insert into docs (col, id, data) values ('meta', 'rlog_backfill',
    jsonb_build_object('version', '1.47', 't', (extract(epoch from clock_timestamp()) * 1000)::bigint));
end $$;

select 'Fertig: Material-Protokoll ist eingerichtet. Nachgetragene Zeilen: ' ||
  (select count(*) from docs where col = 'rlog' and id like 'alt\_%') as ergebnis;
