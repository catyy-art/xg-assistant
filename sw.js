/* 学管助手 Service Worker：缓存页面资源，离线也能打开 */
const CACHE = "xg-assistant-v1";
const ASSETS = [
  "./",
  "./manifest.json",
  "./pwa/icon-192.png",
  "./pwa/icon-512.png",
  "./pwa/apple-touch-icon.png"
];
/* 页面文件名（中文文件名做 encodeURIComponent 匹配） */
const PAGE = "./" + encodeURIComponent("学管助手-教培管理系统.html");

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).then(() => c.add(PAGE).catch(()=>{})))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Supabase 云端请求：永远走网络，不缓存
  if (url.hostname.endsWith("supabase.co")) return;
  if (e.request.method !== "GET") return;
  // 本地资源：缓存优先，命中不了再请求网络并回填缓存
  e.respondWith(
    caches.match(e.request).then(hit => hit ||
      fetch(e.request).then(resp => {
        if (resp.ok && url.origin === location.origin) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => caches.match(PAGE))
    )
  );
});
