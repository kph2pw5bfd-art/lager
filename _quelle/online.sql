-- TPC Lager App – Update: Wer ist online? (ab App-Version 1.171)
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run. Nochmal ausführen schadet nicht.
-- Voraussetzung: auftraege.sql wurde schon ausgeführt.
--
-- Jedes Gerät schreibt, solange die App offen ist, etwa jede Minute einen Eintrag in docs (col 'online'):
-- Gerät, Bereich in der App, Zeit. LESEN darf das nur der Admin (Benutzerverwaltung),
-- SCHREIBEN jeder nur seinen eigenen Eintrag, LÖSCHEN nur der Admin.
-- Die Rechte-Funktionen werden hier vollständig neu festgelegt (Stand auftraege.sql + online) – ab jetzt die letzte Version.

-- 1) Wer darf lesen?
create or replace function public.can_read(c text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'retour'  then app_see('ret') or app_see('au')
      when 'defekte' then app_see('def') or d->>'by' = auth.uid()::text
      when 'infos'   then app_see('inf') or d->>'by' = auth.uid()::text
      when 'rlog'    then app_admin()
      when 'pack'    then app_see('pk') or app_see('au')
      when 'plaw'    then app_see('au') or app_see('pk') or app_right('jv_s')
      when 'online'  then app_admin() or d->>'u' = auth.uid()::text
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
      when 'pack'      then app_right('pk_b')
      when 'plaw'      then (app_right('au_b') and d->>'by' = auth.uid()::text) or app_see('pk')
      when 'online'    then d->>'u' = auth.uid()::text and split_part(i, '_', 1) = auth.uid()::text
      else true
    end);
$$;

-- 3) Wer darf löschen? (rlog niemand, Packlisten mit Recht pk_l, Antworten nur Admin)
create or replace function public.can_delete(c text, i text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'retour'  then app_right('ret_l')
      when 'defekte' then app_right('def_l')
      when 'infos'   then app_right('inf_l')
      when 'lists'   then app_right('mat_l')
      when 'rlog'    then false
      when 'pack'    then app_right('pk_l')
      when 'plaw'    then app_admin()
      when 'online'  then app_admin()
      else can_write(c, i, d)
    end);
$$;

select 'Fertig: Wer ist online eingerichtet' as ergebnis;
