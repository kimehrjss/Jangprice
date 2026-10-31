// 앱 화면은 캐시해 두고(오프라인에서도 열림), 데이터는 항상 최신을 먼저 시도한다.
const SHELL = "jangprice-shell-v1";
const DATA = "jangprice-data";
const SHELL_FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/data/")) {
    // 네트워크 우선 → 실패하면 마지막으로 받은 데이터
    const key = url.origin + url.pathname;
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(DATA).then(c => c.put(key, copy)); }
      return r;
    }).catch(() => caches.match(key).then(r => r || new Response("null", {headers: {"Content-Type": "application/json"}}))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
