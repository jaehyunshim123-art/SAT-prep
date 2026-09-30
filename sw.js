// SatWizz service worker: shows "Lock In" push notifications and opens the
// app when one is tapped. It doesn't cache anything.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "SatWizz";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "Time to practice.",
      icon: "icons/icon-192.png",
      badge: "icons/badge-96.png",
      tag: data.tag || "satwizz",
      renotify: true,
      data: { url: data.url || "./" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if (w.url.startsWith(self.registration.scope) && "focus" in w) return w.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
