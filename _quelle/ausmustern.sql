-- TPC Lager App – Update: Push-Nachricht „Ausgemustert“ (ab App-Version 1.185)
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run. Nochmal ausführen schadet nicht.
-- Voraussetzung: push.sql wurde schon ausgeführt (2.11.).
-- Ändert nur die Auslöse-Funktion: wird ein Defekt als „nicht reparierbar – ausgemustert“ markiert, bekommen die Empfänger
-- von „Aufträge zu prüfen“ (Titel Lagerleiter) eine Nachricht „Ausgemustert: … · in epirent austragen“.
-- Die Edge Function „push“ muss NICHT geändert werden (gleiche Art „pr“, Ziel „fma“ öffnet „Noch auszutragen“).

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
    elsif new.col = 'defekte' and coalesce(d->'aus'->>'t', '') <> '' and coalesce(o->'aus'->>'t', '') = '' then
      -- 1.185: Defekt nicht reparierbar → ausgemustert: an die Empfänger von „Aufträge zu prüfen“ (Lagerleitung)
      typ := 'pr'; ziel := 'fma';
      titel := 'Ausgemustert: ' || coalesce(nullif(d->>'art', ''), 'Artikel');
      txt := concat_ws(' · ', 'in epirent austragen', coalesce(nullif(d->'aus'->>'n', ''), '1') || ' Stk',
               'von ' || push_name(d->'aus'->>'by_as', d->'aus'->>'by'),
               case when coalesce(d->'aus'->>'why', '') <> '' then '„' || left(d->'aus'->>'why', 80) || '“' end);
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
select 'Fertig: Push bei Ausmustern eingerichtet' as ergebnis;
