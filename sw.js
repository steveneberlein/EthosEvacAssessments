/* Offline support: keeps the app shell and fonts cached so the tool opens with no signal. */
const CACHE='evac-assessment-v1';
const SHELL=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  const isFont=url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
  if(url.origin!==location.origin&&!isFont)return;
  // Stale-while-revalidate: answer from cache instantly, refresh in the background when online.
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(req,{ignoreSearch:true})||(req.mode==='navigate'?await c.match('index.html'):undefined);
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(()=>hit);
    return hit||net;
  }));
});
