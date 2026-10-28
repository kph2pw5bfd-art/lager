-- TPC Lager App – Update: Titel und Rechte (ab App-Version 1.39)
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run
-- Einmal ausführen genügt. Nochmal ausführen schadet nicht.

-- 1) Hat der angemeldete Benutzer ein Recht? ---------------------------------
--    Rechte kommen vom Titel (docs: col 'titel', data.r) und von Extra-Rechten
--    der Person (docs: col 'rolle', id = Benutzer-ID, data.t = Titel, data.x).
--    Der Administrator hat immer alle Rechte.
create or replace function public.app_right(k text) returns boolean
language sql stable security definer set search_path = public as $$
  select app_admin() or (app_active() and exists(
    select 1 from docs r
    where r.col = 'rolle' and r.id = auth.uid()::text and (
      coalesce(r.data->'x'->>k, '') = 'true'
      or exists(select 1 from docs t
                where t.col = 'titel' and t.id = r.data->>'t'
                  and coalesce(t.data->'r'->>k, '') = 'true'))));
$$;

-- Sehen darf auch, wer bearbeiten oder löschen darf
create or replace function public.app_see(a text) returns boolean
language sql stable security definer set search_path = public as $$
  select app_right(a || '_s') or app_right(a || '_b') or app_right(a || '_l');
$$;

-- 2) Wer darf lesen? ----------------------------------------------------------
create or replace function public.can_read(c text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'retour'  then app_see('ret')
      when 'defekte' then app_see('def') or d->>'by' = auth.uid()::text
      when 'infos'   then app_see('inf') or d->>'by' = auth.uid()::text
      else true
    end);
$$;

-- 3) Wer darf anlegen und ändern? ---------------------------------------------
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
      else true
    end);
$$;

-- 4) Wer darf löschen? (neu, eigene Regel) -----------------------------------
create or replace function public.can_delete(c text, i text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'retour'  then app_right('ret_l')
      when 'defekte' then app_right('def_l')
      when 'infos'   then app_right('inf_l')
      else can_write(c, i, d)
    end);
$$;

drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete to authenticated
  using (can_delete(col, id, data));

-- 5) Benutzer freigeben/sperren: Admin oder Recht „Benutzer freigeben/sperren“.
--    Zum Admin machen kann nur der Admin.
create or replace function public.admin_set_user(p_id uuid, p_active boolean, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_id = auth.uid() then raise exception 'Das eigene Konto kann nicht geändert werden'; end if;
  if p_role not in ('admin','user') then raise exception 'Ungültige Rolle'; end if;
  if not app_admin() then
    if not app_right('v_user') then raise exception 'Keine Berechtigung'; end if;
    if p_role <> 'user' or exists(select 1 from profiles where id = p_id and role = 'admin') then
      raise exception 'Das kann nur der Administrator ändern';
    end if;
  end if;
  update profiles set active = p_active, role = p_role where id = p_id;
end $$;

-- 6) Standard-Titel anlegen (vorhandene bleiben unverändert) ------------------
insert into docs (col, id, data) values
 ('titel','chef',          '{"name":"Chef","o":1,"r":{"def_s":true,"def_b":true,"def_l":true,"ret_s":true,"ret_b":true,"ret_l":true,"inf_s":true,"inf_b":true,"inf_l":true,"v_user":true,"v_rights":true,"v_app":true}}'),
 ('titel','lagerleiter',   '{"name":"Lagerleiter","o":2,"r":{"def_s":true,"def_b":true,"def_l":true,"ret_s":true,"ret_b":true,"ret_l":true,"inf_s":true,"inf_b":true,"inf_l":true,"v_user":true,"v_rights":true,"v_app":true}}'),
 ('titel','lagerarbeiter', '{"name":"Lagerarbeiter","o":3,"r":{"ret_s":true,"ret_b":true,"inf_s":true,"inf_b":true}}'),
 ('titel','werkstatt',     '{"name":"Werkstatt","o":4,"r":{"def_s":true,"def_b":true}}'),
 ('titel','monteur',       '{"name":"Monteur","o":5,"r":{}}'),
 ('titel','projektleiter', '{"name":"Projektleiter","o":6,"r":{"ret_s":true}}'),
 ('titel','lehrling',      '{"name":"Lehrling","o":7,"r":{}}')
on conflict (col, id) do nothing;

-- 7) Bisherige Häkchen übernehmen, damit niemand Rechte verliert --------------
--    Werkstatt -> Extra-Rechte Defekte (sehen, bearbeiten)
--    Lager     -> Extra-Rechte Retourscheine (sehen, bearbeiten, löschen)
insert into docs (col, id, data)
  select 'rolle', w.id, '{"t":"","x":{"def_s":true,"def_b":true}}'::jsonb
  from docs w where w.col = 'werkstatt'
on conflict (col, id) do update
  set data = docs.data || jsonb_build_object('x', coalesce(docs.data->'x','{}'::jsonb) || (excluded.data->'x'));

insert into docs (col, id, data)
  select 'rolle', l.id, '{"t":"","x":{"ret_s":true,"ret_b":true,"ret_l":true}}'::jsonb
  from docs l where l.col = 'lager'
on conflict (col, id) do update
  set data = docs.data || jsonb_build_object('x', coalesce(docs.data->'x','{}'::jsonb) || (excluded.data->'x'));

-- 8) Rechte für angemeldete Benutzer ----------------------------------------
grant execute on function public.app_right(text) to authenticated;
grant execute on function public.app_see(text) to authenticated;
grant execute on function public.can_delete(text,text,jsonb) to authenticated;
grant execute on function public.admin_set_user(uuid,boolean,text) to authenticated;

select 'Fertig: Titel und Rechte sind eingerichtet.' as ergebnis;
