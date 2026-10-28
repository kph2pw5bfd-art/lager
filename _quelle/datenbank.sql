-- TPC Lager App – Datenbank einrichten
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run

-- 1) Benutzer-Profile -------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  email text,
  role text not null default 'user' check (role in ('admin','user')),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) Alle App-Daten (Listen, Defekte, Nachrichten, Retourscheine, Fotos …) --
create table if not exists public.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
alter table public.docs replica identity full;

-- 3) Hilfsfunktionen für die Berechtigungen --------------------------------
create or replace function public.app_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and active);
$$;

create or replace function public.app_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and active and role = 'admin');
$$;

create or replace function public.app_has(c text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from docs where col = c and id = auth.uid()::text);
$$;

-- Wer darf eine Sammlung lesen?
create or replace function public.can_read(c text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'retour' then app_admin() or app_has('lager')
      when 'infos'  then app_admin() or d->>'by' = auth.uid()::text
      else true
    end);
$$;

-- Wer darf in eine Sammlung schreiben?
create or replace function public.can_write(c text, i text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select app_active() and (
    case c
      when 'artikel'   then app_admin()
      when 'rkat'      then app_admin()
      when 'werkstatt' then app_admin()
      when 'lager'     then app_admin()
      when 'retour'    then app_admin() or app_has('lager')
      when 'users'     then i = auth.uid()::text
      when 'infos'     then app_admin() or d->>'by' = auth.uid()::text
      else true
    end);
$$;

-- 4) Zugriffsregeln (Row Level Security) -----------------------------------
alter table public.profiles enable row level security;
alter table public.docs enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or app_active());

drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to authenticated
  using (can_read(col, data));

drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated
  with check (can_write(col, id, data));

drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated
  using (can_write(col, id, data)) with check (can_write(col, id, data));

drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete to authenticated
  using (can_write(col, id, data));

-- 5) Felder eines Eintrags ändern (für die App) -----------------------------
create or replace function public.doc_update(p_col text, p_id text, p_patch jsonb) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare r jsonb;
begin
  update docs set data = data || p_patch, updated_at = now()
    where col = p_col and id = p_id returning data into r;
  if r is null then raise exception 'Eintrag nicht gefunden'; end if;
  return r;
end $$;

-- 6) Neues Konto -> Profil anlegen. Das allererste Konto wird Administrator. -
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare first boolean;
begin
  select not exists(select 1 from profiles) into first;
  insert into profiles (id, name, email, role, active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),
    new.email,
    case when first then 'admin' else 'user' end,
    first
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7) Admin: Kollegen freigeben, sperren, zum Admin machen -------------------
create or replace function public.admin_set_user(p_id uuid, p_active boolean, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not app_admin() then raise exception 'Nur für Administratoren'; end if;
  if p_id = auth.uid() then raise exception 'Das eigene Konto kann nicht geändert werden'; end if;
  if p_role not in ('admin','user') then raise exception 'Ungültige Rolle'; end if;
  update profiles set active = p_active, role = p_role where id = p_id;
end $$;

-- Eigenen Namen ändern
create or replace function public.set_my_name(p_name text) returns void
language sql security definer set search_path = public as $$
  update profiles set name = left(trim(p_name), 60) where id = auth.uid() and trim(p_name) <> '';
$$;

-- 8) Live-Aktualisierung einschalten ----------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.docs; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end;
end $$;

-- 9) Rechte für angemeldete Benutzer ----------------------------------------
revoke all on public.profiles from anon;
revoke all on public.docs from anon;
grant select on public.profiles to authenticated;
revoke insert, update, delete on public.profiles from authenticated;
grant select, insert, update, delete on public.docs to authenticated;
grant execute on function public.doc_update(text,text,jsonb) to authenticated;
grant execute on function public.admin_set_user(uuid,boolean,text) to authenticated;
grant execute on function public.set_my_name(text) to authenticated;

-- Danach für Titel und Rechte zusätzlich rechte.sql ausführen (ab App-Version 1.39).
