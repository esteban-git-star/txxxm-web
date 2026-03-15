self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  // Dummy fetch für PWA-Kriterien
});
