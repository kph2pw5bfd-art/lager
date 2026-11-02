-- TPC Lager App – Update: Push-Nachrichten aufs Handy (ab App-Version 1.107)
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run  (bei der Warnung: „Run and enable RLS“)
-- Danach die Edge Function „push“ anlegen (siehe Anleitung). Nochmal ausführen schadet nicht.
--
-- Nachrichten:  pr  = Endretoure abgeschlossen  -> „Zu prüfen“ (Standard: Titel Lagerleiter)
--               def = dringender Defekt gemeldet -> Werkstatt   (Standard: Titel Werkstatt)
--               pk  = neue Packliste hochgeladen -> Lagerarbeiter (Standard: Titel Lagerarbeiter, auch wer selbst hochlädt)
-- Die Datenbank ruft bei diesen Ereignissen die Edge Function „push“ auf; die schickt die Nachricht an alle
-- angemeldeten Handys, deren Titel das erlaubt (in „Titel und ihre Rechte“ änderbar) und die das selbst eingeschaltet haben.
-- Ein Fehler beim Benachrichtigen verhindert NIE das Speichern.
-- can_read/can_write/can_delete werden hier NICHT verändert (Stand bleibt auftraege.sql).

create extension if not exists pg_net;

-- 1) Angemeldete Handys (jeder sieht und ändert nur seine eigenen)
create table if not exists public.push_abos (
  endpoint text primary key,
  user_id uuid not null default auth.uid(),
  sub jsonb not null,
  typen jsonb not null default '{}'::jsonb,
  geraet text,
  t timestamptz not null default now()
);
alter table public.push_abos enable row level security;
drop policy if exists push_abos_eigene on public.push_abos;
create policy push_abos_eigene on public.push_abos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and app_active());
grant select, insert, update, delete on public.push_abos to authenticated;
revoke all on public.push_abos from anon;

-- 2) Interne Einstellungen (Geheimnis zwischen Datenbank und Funktion, Schlüssel der Funktion) – von außen nicht lesbar
create table if not exists public.push_cfg (k text primary key, wert text);
alter table public.push_cfg enable row level security;
revoke all on public.push_cfg from anon, authenticated;
insert into public.push_cfg (k, wert) values ('geheim', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (k) do nothing;

-- 3) Kurzname „Vorname N.“
create or replace function public.push_kurz(p text) returns text language sql immutable as $$
  select case when coalesce(trim(p), '') = '' then 'jemandem'
              when position(' ' in trim(p)) = 0 then trim(p)
              else split_part(trim(p), ' ', 1) || ' ' || left(split_part(trim(p), ' ', 2), 1) || '.' end;
$$;
create or replace function public.push_name(p_as text, p_uid text) returns text
language sql stable security definer set search_path = public as $$
  select push_kurz(coalesce(nullif(p_as, ''), (select name from profiles where id::text = p_uid)));
$$;
create or replace function public.push_tag(p_ms text) returns text language sql immutable as $$
  select case when p_ms is null or p_ms !~ '^\d+$' then '–' else
    (array['So.','Mo.','Di.','Mi.','Do.','Fr.','Sa.'])[extract(dow from to_timestamp(p_ms::bigint / 1000) at time zone 'Europe/Vienna')::int + 1]
    || ' ' || to_char(to_timestamp(p_ms::bigint / 1000) at time zone 'Europe/Vienna', 'DD.MM.') end;
$$;

-- 4) Auslöser
create or replace function public.push_ausloesen() returns trigger
language plpgsql security definer set search_path = public as $$
declare typ text; titel text; txt text; ziel text; d jsonb := new.data; o jsonb := case when tg_op = 'UPDATE' then old.data else '{}'::jsonb end;
begin
  begin
    if new.col = 'retour' and d->>'art' = 'end' and coalesce((d->>'closed')::boolean, false)
       and not (o->>'art' is not distinct from 'end' and coalesce((o->>'closed')::boolean, false)) then
      typ := 'pr'; ziel := 'pr';
      titel := 'Zu prüfen: ' || coalesce(nullif(d->>'ev', ''), 'Retourschein');
      txt := 'Endretoure von ' || push_name(d->>'closedBy_as', d->>'closedBy') || ' · Auftrag ' || coalesce(nullif(d->>'ord', ''), '–');
    elsif new.col = 'defekte' and coalesce((d->>'urg')::boolean, false) and not coalesce((d->>'done')::boolean, false)
       and not coalesce((o->>'urg')::boolean, false) then
      typ := 'def'; ziel := 'def:' || new.id;
      titel := 'Dringender Defekt: ' || coalesce(nullif(d->>'art', ''), 'Artikel');
      txt := concat_ws(' · ', 'gemeldet von ' || push_name(d->>'by_as', d->>'by'), nullif(d->>'ev', ''),
               case when coalesce(d->>'desc', '') <> '' then '„' || left(d->>'desc', 80) || '“' end);
    elsif new.col = 'pack' and tg_op = 'INSERT' then
      typ := 'pk'; ziel := 'pk:' || new.id;
      titel := 'Neue Packliste: ' || coalesce(nullif(d->>'ev', ''), 'Packliste');
      txt := 'Auftrag ' || coalesce(nullif(d->>'ord', ''), '–') || ' · herrichten ' || push_tag(d->>'db') || ' · '
             || coalesce(jsonb_array_length(case when jsonb_typeof(d->'pos') = 'array' then d->'pos' end), 0) || ' Positionen';
    end if;
    if typ is not null then
      perform net.http_post(
        url := 'https://whfeipnyzffrejbakweb.supabase.co/functions/v1/push',
        body := jsonb_build_object('typ', typ, 'titel', titel, 'text', txt, 'ziel', ziel, 'geheim', (select wert from push_cfg where k = 'geheim')),
        headers := jsonb_build_object('Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZmVpcG55emZmcmVqYmFrd2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNjE3MjUsImV4cCI6MjEwODczNzcyNX0.aUo3d2SyIzFX5-a4vQa37FxaBMBI10CzFfnF9roHl0U'));
    end if;
  exception when others then
    raise warning 'Push-Nachricht nicht ausgelöst: %', sqlerrm;   -- Speichern geht trotzdem
  end;
  return new;
end $$;
drop trigger if exists push_ausloesen on public.docs;
create trigger push_ausloesen after insert or update on public.docs for each row execute function public.push_ausloesen();
revoke all on function public.push_ausloesen() from public;

select 'Fertig: Push-Nachrichten eingerichtet. Jetzt die Edge Function „push“ anlegen (Anleitung).' as ergebnis;
