// Supabase Edge Function „push“ – verschickt Push-Nachrichten der TPC Lager App (ab 1.107).
// Anlegen: Supabase → Edge Functions → Deploy a new function → Via Editor → Name „push“ → diesen Text einfügen → Deploy.
// Braucht KEINE eigenen Geheimnisse: SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY stellt Supabase selbst bereit,
// die Schlüssel für Web-Push (VAPID) erzeugt die Funktion beim ersten Aufruf und legt sie in public.push_cfg ab.
//   GET            → { key }            öffentlicher Schlüssel für das Anmelden am Handy
//   POST {geheim, typ, titel, text, ziel}  von der Datenbank (push.sql) → an alle passenden Handys
//   POST {test:true} mit Anmeldung        → Test-Nachricht an die eigenen Handys
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const DEF = { pr: ["lagerleiter"], def: ["werkstatt"], pk: ["lagerarbeiter"] }; // Standard, wenn beim Titel nichts eingestellt ist
const antwort = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { ...CORS, "Content-Type": "application/json" } });

async function cfg(k) { const { data } = await sb.from("push_cfg").select("wert").eq("k", k).maybeSingle(); return data ? data.wert : null; }
let vapidPub = null;
async function vapid() {
  if (vapidPub) return vapidPub;
  let pub = await cfg("vapid_public"), priv = await cfg("vapid_private");
  if (!pub || !priv) {
    const k = webpush.generateVAPIDKeys();
    await sb.from("push_cfg").upsert([{ k: "vapid_public", wert: k.publicKey }, { k: "vapid_private", wert: k.privateKey }], { onConflict: "k", ignoreDuplicates: true });
    pub = await cfg("vapid_public"); priv = await cfg("vapid_private");   // falls gleichzeitig schon jemand erzeugt hat
  }
  webpush.setVapidDetails("mailto:lager@thepowercompany.at", pub, priv);
  vapidPub = pub; return pub;
}
// Wer darf diese Art Nachricht bekommen? Admin immer (wenn selbst eingeschaltet), sonst nach Titel
async function erlaubt(typ) {
  const [pr, ro, ti] = await Promise.all([
    sb.from("profiles").select("id,role,active"),
    sb.from("docs").select("id,data").eq("col", "rolle"),
    sb.from("docs").select("id,data").eq("col", "titel")]);
  const T = {}, R = {}; (ti.data || []).forEach(t => T[t.id] = t.data || {}); (ro.data || []).forEach(r => R[r.id] = r.data || {});
  const ok = new Set();
  (pr.data || []).forEach(p => {
    if (!p.active) return;
    if (p.role === "admin") { ok.add(p.id); return; }
    const t = (R[p.id] || {}).t; if (!t) return;
    const pu = (T[t] || {}).push, on = pu && typeof pu[typ] === "boolean" ? pu[typ] : (DEF[typ] || []).includes(t);
    if (on) ok.add(p.id);
  });
  return ok;
}
async function senden(abos, nachricht) {
  let n = 0;
  for (const a of abos) {
    try { await webpush.sendNotification(a.sub, JSON.stringify(nachricht), { TTL: 86400, urgency: "high" }); n++; }
    catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) await sb.from("push_abos").delete().eq("endpoint", a.endpoint); // Handy abgemeldet
      else console.error("Senden fehlgeschlagen", e && e.statusCode, e && e.body);
    }
  }
  return n;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const key = await vapid();
    if (req.method === "GET") return antwort({ key });
    const b = await req.json().catch(() => ({}));
    if (b.test) {
      const tok = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: { user } } = await sb.auth.getUser(tok);
      if (!user) return antwort({ fehler: "nicht angemeldet" }, 401);
      const { data } = await sb.from("push_abos").select("endpoint,sub").eq("user_id", user.id);
      const n = await senden(data || [], { t: "TPC Lager – Test", b: "So sehen Nachrichten der Lager App aus.", g: "" });
      return antwort({ ok: true, gesendet: n });
    }
    if (!b.geheim || b.geheim !== await cfg("geheim")) return antwort({ fehler: "nicht erlaubt" }, 403);
    if (!["pr", "def", "pk"].includes(b.typ)) return antwort({ fehler: "unbekannte Art" }, 400);
    const ok = await erlaubt(b.typ);
    const { data } = await sb.from("push_abos").select("endpoint,sub,typen,user_id");
    const abos = (data || []).filter(a => a.typen && a.typen[b.typ] === true && ok.has(a.user_id));
    const n = await senden(abos, { t: b.titel || "TPC Lager", b: b.text || "", g: b.ziel || "", tag: b.typ + ":" + (b.ziel || "") + ":" + (b.titel || "") });
    return antwort({ ok: true, gesendet: n });
  } catch (e) {
    console.error(e);
    return antwort({ fehler: String(e && e.message || e) }, 500);
  }
});
