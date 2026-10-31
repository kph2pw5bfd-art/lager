-- TPC Lager App – Update: Meine Aufträge (ab App-Version 1.85)
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run
-- Voraussetzung: rechte.sql, materialliste.sql, protokoll.sql und packliste.sql wurden schon ausgeführt. Nochmal ausführen schadet nicht.
--
-- Neues Recht "Aufträge": au_s Sehen (Lager-Stand aller Aufträge, eigene oben), au_b Antworten (auf eigene Aufträge).
-- Wer au_s hat, darf Packlisten und Retourscheine LESEN (nicht herrichten, nicht hochladen, nicht ändern).
-- Antworten der Projektleiter liegen in docs (col 'plaw'): lesen dürfen Aufträge-Seher und das Lager (Packlisten),
-- schreiben nur der Projektleiter selbst (eigene Einträge) oder das Lager ("Gelesen" setzen), löschen nur Admins.
-- Die Rechte-Funktionen werden hier vollständig neu festgelegt (Stand packliste.sql + Aufträge) – ab jetzt die letzte Version.

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
      else can_write(c, i, d)
    end);
$$;

-- 4) Titel "Projektleiter" bekommt das neue Recht (Sehen + Antworten). Andere Rechte bleiben, wie sie sind.
update docs set data = jsonb_set(data, '{r}', coalesce(data->'r', '{}'::jsonb) || '{"au_s":true,"au_b":true}'::jsonb)
 where col = 'titel' and id = 'projektleiter';

select 'Fertig: Meine Aufträge eingerichtet' as ergebnis;
