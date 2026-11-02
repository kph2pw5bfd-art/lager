/* TPC Lager App – Service Worker nur für Push-Nachrichten (ab 1.107). Speichert NICHTS zwischen (kein Offline-Cache),
   damit das automatische Update beim Öffnen weiter wie bisher funktioniert. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { t: "TPC Lager", b: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.t || "TPC Lager", {
    body: d.b || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || undefined, data: { g: d.g || "" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const g = (e.notification.data || {}).g || "";
  const url = new URL("./" + (g ? "?go=" + encodeURIComponent(g) : ""), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(L => {
    for (const c of L) if (c.url.startsWith(self.registration.scope)) { c.postMessage({ go: g }); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
