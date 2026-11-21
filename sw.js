/* Service worker : garde l'appli disponible hors connexion.
   Change VERSION à chaque mise à jour pour que les téléphones récupèrent la nouvelle version. */
var VERSION = 'cuisine-eva-v2.15.3';
var SHELL = ['./', './index.html', './style.css', './app.js', './seed.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==VERSION; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req=e.request; if(req.method!=='GET') return;
  var url=new URL(req.url);
  // Fichiers de l'appli : réseau d'abord (pour avoir les mises à jour), cache si hors connexion
  if(url.origin===location.origin){
    e.respondWith(fetch(req).then(function(res){
      if(res && res.ok){ var copy=res.clone(); caches.open(VERSION).then(function(c){ c.put(req, copy); }); }
      return res;
    }).catch(function(){ return caches.match(req, {ignoreSearch:true}).then(function(r){ return r || caches.match('./index.html'); }); }));
    return;
  }
  // Polices Google : cache d'abord
  if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.match(req).then(function(r){
      return r || fetch(req).then(function(res){ var copy=res.clone(); caches.open(VERSION).then(function(c){ c.put(req, copy); }); return res; });
    }));
  }
});
