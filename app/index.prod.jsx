import './settings'
import(/* webpackChunkName: "app" */ './components/app-lazy')

// register service worker for offline cache.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker').then()
  })
}
