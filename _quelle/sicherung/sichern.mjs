// Nächtliche Sicherung der TPC Lager App (läuft im privaten GitHub-Repo „lager-sicherung“).
// Holt mit dem Sicherungs-Schlüssel (GitHub-Secret SB_BACKUP_KEY) alle Einträge aus Supabase und legt sie als Dateien ab:
//   daten/<sammlung>.json   – alle Einträge einer Sammlung (Retourscheine, Packlisten, Defekte …)
//   daten/fotos/<id>.json   – jedes Foto einzeln (git speichert unveränderte Fotos nur einmal)
//   daten/_profile.json     – Benutzer (Name, Mail, Rolle) – keine Passwörter
//   stand.json              – Zeitpunkt + Anzahl
// git hebt jede Nacht einen Stand auf → auch ältere Stände bleiben abrufbar.
// Sind es plötzlich weniger als halb so viele Einträge wie beim letzten Mal, wird trotzdem gesichert, der Lauf aber als
// Fehler markiert – GitHub schickt dann eine Mail (Warnung „Daten verschwunden?“).
import fs from "fs";
import path from "path";
const U = process.env.SB_URL || "https://whfeipnyzffrejbakweb.supabase.co";
const A = process.env.SB_ANON, K = process.env.SB_BACKUP_KEY, OUT = process.env.OUT || ".";
if (!K) { console.error("SB_BACKUP_KEY fehlt (GitHub → Settings → Secrets and variables → Actions)."); process.exit(1); }
if (!A) { console.error("SB_ANON fehlt."); process.exit(1); }
const wait = ms => new Promise(r => setTimeout(r, ms));
async function rpc(fn, body) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(`${U}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: A, Authorization: "Bearer " + A, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const t = await r.text();
      if (!r.ok) throw new Error(r.status + " " + t.slice(0, 300));
      return t ? JSON.parse(t) : null;
    } catch (e) {
      if (i >= 3 || /Schlüssel/.test(String(e))) throw e;
      console.warn(`Versuch ${i + 1} fehlgeschlagen (${e.message}) – nochmal in ${5 * (i + 1)} s`); await wait(5000 * (i + 1));
    }
  }
}
const safe = s => String(s).replace(/[^0-9A-Za-z._-]/g, "_");
const all = [];
for (let ab = 0; ; ab += 200) {
  const d = await rpc("sicherung_docs", { p_key: K, p_ab: ab, p_n: 200 });
  all.push(...d); if (d.length < 200) break;
}
const prof = await rpc("sicherung_profile", { p_key: K });
let prev = null; try { prev = JSON.parse(fs.readFileSync(path.join(OUT, "stand.json"), "utf8")); } catch (e) {}
const dir = path.join(OUT, "daten");
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(path.join(dir, "fotos"), { recursive: true });
const by = {};
for (const d of all) {
  if (d.col === "fotos") fs.writeFileSync(path.join(dir, "fotos", safe(d.id) + ".json"), JSON.stringify(d));
  else (by[d.col] = by[d.col] || []).push(d);
}
for (const [c, L] of Object.entries(by)) fs.writeFileSync(path.join(dir, safe(c) + ".json"), JSON.stringify(L, null, 1));
fs.writeFileSync(path.join(dir, "_profile.json"), JSON.stringify(prof, null, 1));
const je = {}; all.forEach(d => je[d.col] = (je[d.col] || 0) + 1);
fs.writeFileSync(path.join(OUT, "stand.json"), JSON.stringify({ zeit: new Date().toISOString(), anzahl: all.length, profile: prof.length, je }, null, 1));
await rpc("sicherung_fertig", { p_key: K, p_n: all.length });
console.log(`Gesichert: ${all.length} Einträge, ${prof.length} Benutzer.`, je);
if (prev && prev.anzahl > 50 && all.length < prev.anzahl * 0.5) {
  console.error(`WARNUNG: nur noch ${all.length} Einträge (letztes Mal ${prev.anzahl}). Daten verschwunden? Der alte Stand liegt in der git-Geschichte.`);
  process.exit(2);
}
