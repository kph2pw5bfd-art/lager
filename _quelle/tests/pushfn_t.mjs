// Test 1.107: Logik der Edge Function „push“ mit Attrappen (Supabase-Tabellen, web-push, Deno)
import fs from "fs";
const SP = process.env.SP || "/tmp", src = fs.readFileSync("/home/claude/gh/push/index.ts", "utf8")
  .replace('import webpush from "npm:web-push@3.6.7";', 'const webpush = globalThis.__wp;')
  .replace('import { createClient } from "npm:@supabase/supabase-js@2";', 'const createClient = globalThis.__cc;');
const A = "a", L = "l", W = "w", X = "x";
const DB = {
  push_cfg: [{ k: "geheim", wert: "G" }],
  profiles: [{ id: A, role: "admin", active: true }, { id: L, role: "user", active: true }, { id: W, role: "user", active: true }, { id: X, role: "user", active: false }],
  docs: [{ col: "rolle", id: L, data: { t: "lagerleiter" } }, { col: "rolle", id: W, data: { t: "werkstatt" } }, { col: "rolle", id: X, data: { t: "lagerleiter" } },
    { col: "titel", id: "werkstatt", data: { push: { pk: true } } }],
  push_abos: [
    { endpoint: "eL", user_id: L, sub: { endpoint: "eL" }, typen: { pr: true } },
    { endpoint: "eL2", user_id: L, sub: { endpoint: "eL2" }, typen: { pr: false } },
    { endpoint: "eW", user_id: W, sub: { endpoint: "eW" }, typen: { def: true, pk: true, pr: true } },
    { endpoint: "eA", user_id: A, sub: { endpoint: "eA" }, typen: { pk: true } },
    { endpoint: "eX", user_id: X, sub: { endpoint: "eX" }, typen: { pr: true } },
    { endpoint: "tot", user_id: L, sub: { endpoint: "tot" }, typen: { pr: true } }]
};
function Q(t) { this.t = t; this.f = []; this.op = "select"; }
Q.prototype.select = function () { return this; };
Q.prototype.eq = function (k, v) { this.f.push(r => r[k] === v); return this; };
Q.prototype.maybeSingle = function () { this.one = 1; return this; };
Q.prototype.delete = function () { this.op = "del"; return this; };
Q.prototype.upsert = function (rows, o) { rows.forEach(r => { if (!DB[this.t].some(x => x.k === r.k)) DB[this.t].push(r); }); this.op = "noop"; return this; };
Q.prototype.then = function (res) { const rows = DB[this.t].filter(r => this.f.every(f => f(r)));
  if (this.op === "del") { DB[this.t] = DB[this.t].filter(r => !rows.includes(r)); return Promise.resolve({ data: null }).then(res); }
  return Promise.resolve({ data: this.one ? rows[0] || null : rows }).then(res); };
globalThis.__cc = () => ({ from: t => new Q(t), auth: { getUser: async tok => ({ data: { user: tok === "TOKEN_L" ? { id: L } : null } }) } });
const sent = [];
globalThis.__wp = { generateVAPIDKeys: () => ({ publicKey: "PUB", privateKey: "PRIV" }), setVapidDetails() {},
  sendNotification: async (sub, body) => { if (sub.endpoint === "tot") { const e = new Error("gone"); e.statusCode = 410; throw e; } sent.push([sub.endpoint, JSON.parse(body)]); } };
let handler; globalThis.Deno = { env: { get: k => k }, serve: f => { handler = f; } };
fs.writeFileSync(SP + "/fn_run.mjs", src); await import(SP + "/fn_run.mjs?" + Date.now());
const call = async (method, body, auth) => { const r = await handler(new Request("https://x/functions/v1/push", { method, headers: { "Content-Type": "application/json", ...(auth ? { Authorization: "Bearer " + auth } : {}) }, body: body ? JSON.stringify(body) : undefined })); return [r.status, await r.json()]; };
let bad = 0; const ok = (c, m, x) => { console.log((c ? "OK   " : "FEHLER") + " " + m + (x !== undefined ? ": " + JSON.stringify(x) : "")); if (!c) bad++; };
let [st, j] = await call("GET"); ok(st === 200 && j.key === "PUB", "GET liefert Schlüssel (beim ersten Mal erzeugt)", j);
ok(DB.push_cfg.some(r => r.k === "vapid_private"), "privater Schlüssel in push_cfg gespeichert");
[st, j] = await call("POST", { geheim: "falsch", typ: "pr", titel: "x" }); ok(st === 403 && !sent.length, "falsches Geheimnis abgelehnt");
[st, j] = await call("POST", { geheim: "G", typ: "pr", titel: "Zu prüfen: Messe Linz", text: "Endretoure", ziel: "pr" });
ok(JSON.stringify(sent.map(s => s[0])) === JSON.stringify(["eL"]), "Zu prüfen nur an Lagerleitung (eingeschaltet, aktiv); Werkstatt nicht erlaubt", sent.map(s => s[0]));
ok(sent[0][1].t === "Zu prüfen: Messe Linz" && sent[0][1].g === "pr", "Inhalt der Nachricht", sent[0][1]);
ok(!DB.push_abos.some(a => a.endpoint === "tot"), "abgemeldetes Handy (410) wird gelöscht");
sent.length = 0; await call("POST", { geheim: "G", typ: "pk", titel: "Neue Packliste: Gala", ziel: "pk:1" });
ok(JSON.stringify(sent.map(s => s[0]).sort()) === JSON.stringify(["eA", "eW"]), "Packliste: Admin (selbst eingeschaltet) + Werkstatt (Titel erlaubt es per Einstellung)", sent.map(s => s[0]));
sent.length = 0; await call("POST", { geheim: "G", typ: "def", titel: "Dringender Defekt" });
ok(JSON.stringify(sent.map(s => s[0])) === JSON.stringify(["eW"]), "Defekt an Werkstatt (Standard)", sent.map(s => s[0]));
sent.length = 0; [st, j] = await call("POST", { test: true }, "TOKEN_L"); ok(j.gesendet === 2 && sent.every(s => /^eL/.test(s[0])), "Test-Nachricht an alle eigenen Handys", sent.map(s => s[0]));
[st, j] = await call("POST", { test: true }, "fremd"); ok(st === 401, "Test ohne Anmeldung abgelehnt");
console.log("FEHLER GESAMT:", bad);
