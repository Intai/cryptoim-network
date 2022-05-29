const cacheName = 'cache-<DIGEST>'

self.addEventListener('install', event => event.waitUntil(
  // after installing a new version of cache storage.
  caches.open(cacheName)
    // cache the homepage.
    .then(cache => cache.add('/'))
    // activate straight away.
    .then(() => self.skipWaiting()),
))

self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(names => Promise.all(
    names.map(name => {
      if (cacheName !== name) {
        // delete old caches.
        return caches.delete(name)
      }
    }),
  ))
    // start using this version of cache.
    .then(() => self.clients.claim()),
))

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET'
    || !/^https?:\/\/([^.]+\.)?cyphrim.com/i.test(request.url)) {
    return
  }

  return event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response
        }

        return fetch(event.request, { mode: 'no-cors' }).then(response => {
          if (response && response.status === 200) {
            const cloned = response.clone()
            caches.open(cacheName)
              .then(cache => {
                cache.put(event.request, cloned)
              })
          }
          return response
        })
      }),
  )
})

self.addEventListener('notificationclick', event => {
  const { notification } = event
  const url = `/conversation/${notification.tag}`

  // close the notification.
  notification.close()
  // search through tabs.
  event.waitUntil(self.clients.matchAll({ type: 'window' })
    .then(clientList => {
      // if there is at least one tab.
      if (clientList.length > 0) {
        // bring the first tab into focus and navigate to the conversation.
        const client = clientList[0]
        client.focus()
        client.navigate(url)
      } else {
        // open the conversation in a new tab.
        self.clients.openWindow(url)
      }
    })
  )
})
