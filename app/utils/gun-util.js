import { once } from 'ramda'
import { canUseDOM, getGunUrl } from './common-util'

let Gun
let Sea
let getGun

// in browser,
// initialise gun here with indexedDB.
if (canUseDOM()) {
  Gun = require('gun/gun')
  require('gun/sea')
  // require('gun/axe')
  require('gun/lib/radix')
  require('gun/lib/radisk')
  require('gun/lib/store')
  require('gun/lib/rindexed')

  Sea = Gun.SEA
  getGun = once(() => Gun({
    peers: [getGunUrl('/gun')],
    localStorage: true,
  }))
} else {
  // on server,
  // initialise gun here to be used with express in server.prod.js
  Gun = require('gun')
  // workaround bug in rs3. please remove if fixed.
  global.Gun = Gun
  require('./gun-hack')

  Sea = Gun.SEA
  getGun = () => process.gun
}

const gunOnce = func => (...args) => {
  console.log('intai once', args)
  const ev = args[3]
  if (ev) {
    ev.off()
  }
  return func(...args)
}

export {
  Gun,
  Sea,
  getGun,
  gunOnce,
}
