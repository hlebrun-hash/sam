// Kill-switch : ce projet n'utilise pas de service worker.
// Un ancien service worker (d'un autre projet lancé sur localhost:3000) peut rester
// installé dans le navigateur et servir de vieux chunks JS en cache, ce qui provoque
// « TypeError: Cannot read properties of undefined (reading 'call') ».
// Ce fichier remplace l'ancien worker, vide ses caches, se désinstalle et recharge les onglets.
self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: "window" })
      clients.forEach((client) => client.navigate(client.url))
    })()
  )
})
