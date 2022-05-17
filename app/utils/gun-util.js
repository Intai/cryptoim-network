import { once } from 'ramda'
import { canUseDOM, getGunUrl } from './common-util'

let Sea
let getGun

// in browser,
// initialise gun here with indexedDB.
if (canUseDOM()) {
  const Gun = require('gun/gun')
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
  // on server, gun will be initialised with express in server.prod.js
  const Gun = require('gun')
  require('gun/sea')

  Sea = Gun.SEA
  getGun = () => process.gun
}

export {
  Sea,
  getGun,
}
