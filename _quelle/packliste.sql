-- TPC Lager App – Update: Packlisten (ab App-Version 1.57)
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run
-- Voraussetzung: rechte.sql, materialliste.sql und protokoll.sql wurden schon ausgeführt. Nochmal ausführen schadet nicht.
--
-- Packlisten werden als PDF in der App hochgeladen und im Gerät ausgelesen. Gespeichert wird nur das Ausgelesene
-- (Auftragsnummer, Packscheinnummer, Veranstaltung, Projektleiter, Zeiten, Positionen) in docs (col 'pack'), kein PDF, keine Kundendaten.
-- Neues Recht "Packlisten": pk_s Sehen, pk_b Hochladen, pk_l Löschen (pro Titel / Extra-Rechte in der App einstellbar).
-- Die Rechte-Funktionen werden hier vollständig neu festgelegt (Stand protokoll.sql + Packlisten).

-- 1) Wer darf lesen?
create or replace function public.can_read(c text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'retour'  then app_see('ret')
      when 'defekte' then app_see('def') or d->>'by' = auth.uid()::text
      when 'infos'   then app_see('inf') or d->>'by' = auth.uid()::text
      when 'rlog'    then app_admin()
      when 'pack'    then app_see('pk')
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
      else true
    end);
$$;

-- 3) Wer darf löschen? (rlog niemand, Packlisten mit Recht pk_l)
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
      else can_write(c, i, d)
    end);
$$;

select 'Fertig: Packlisten-Rechte eingerichtet' as ergebnis;
