// ===== 観戦くん Service Worker =====
// このVERSIONを上げると、次回オンライン起動時に
// アプリ画面に「新しいバージョンがあります」ボタンが出ます。
// （更新は入力者がボタンを押したときだけ適用されます）
const VERSION = '2.0.0';
const CACHE = 'kansenkun-' + VERSION;
const ASSETS = ['./', './index.html'];

// インストール：アプリ本体をキャッシュ（最新を取得）
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then((cache) =>
            cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))
        )
    );
});

// 有効化：古いバージョンのキャッシュを削除
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// 取得：同一オリジンはキャッシュ優先（安定・オフライン対応）。
// 外部（Googleフォント等）は素通し。
self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;
    if (new URL(req.url).origin !== self.location.origin) return;
    e.respondWith(
        caches.match(req).then((hit) =>
            hit || fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(req, copy));
                return res;
            }).catch(() => caches.match('./index.html'))
        )
    );
});

// 更新ボタンからの合図で、待機中の新バージョンを即有効化
self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
