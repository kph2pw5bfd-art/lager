-- TPC Lager App – Update: Recht „Materialliste“ (ab App-Version 1.44)
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run
-- Voraussetzung: rechte.sql wurde schon ausgeführt. Nochmal ausführen schadet nicht.

-- 1) Anlegen und ändern: Eine abgeschlossene Materialliste (chk = true) darf nur ändern,
--    wer „Materialliste – Abschließen / Wieder öffnen“ darf. Abschließen ebenso.
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
      else true
    end);
$$;

-- 2) Löschen: Materialliste nur mit „Materialliste – Löschen“
create or replace function public.can_delete(c text, i text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'retour'  then app_right('ret_l')
      when 'defekte' then app_right('def_l')
      when 'infos'   then app_right('inf_l')
      when 'lists'   then app_right('mat_l')
      else can_write(c, i, d)
    end);
$$;

-- 3) Startwerte (nur beim ersten Ausführen):
--    Wer bisher Materiallisten prüfen durfte (Defekte – Bearbeiten), darf jetzt abschließen.
--    Chef und Lagerleiter dürfen zusätzlich löschen, Lagerarbeiter abschließen.
do $$
begin
  if not exists (select 1 from docs where col = 'meta' and id = 'rechte_materialliste') then
    update docs set data = jsonb_set(data, '{r,mat_b}', 'true')
      where col = 'titel' and (data->'r'->>'def_b' = 'true' or id in ('chef','lagerleiter','lagerarbeiter'));
    update docs set data = jsonb_set(data, '{r,mat_l}', 'true')
      where col = 'titel' and id in ('chef','lagerleiter');
    update docs set data = jsonb_set(data, '{x,mat_b}', 'true')
      where col = 'rolle' and data->'x'->>'def_b' = 'true';
    insert into docs (col, id, data) values ('meta', 'rechte_materialliste', '{"version":"1.44"}');
  end if;
end $$;

select 'Fertig: Recht Materialliste ist eingerichtet.' as ergebnis;
