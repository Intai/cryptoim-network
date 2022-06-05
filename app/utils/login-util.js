import { juxt, once, test, T } from 'ramda'
import { getLocalStorage, jsonParse } from './common-util'
import { Sea, getGun, gunOnce } from './gun-util'

export const getAuthPair = (() => {
  let authPair
  let callbacks = []

  const subscribe = once(() => {
    getGun().on('auth', ack => {
      authPair = ack.sea

      // keep the auth pair in local storage.
      const storage = getLocalStorage()
      if (storage.setItem) {
        storage.setItem('pair', JSON.stringify(authPair))
      }

      // if there is a queue waiting for the pair,
      // trigger all the callback functions.
      if (callbacks.length > 0) {
        juxt(callbacks)(authPair)
        callbacks = []
      }
    })
  })

  return cb => {
    subscribe()

    if (cb) {
      if (authPair) {
        cb(authPair)
      } else {
        // if we don't have the pair yet,
        // queue up and wait for the auth event.
        callbacks.push(cb)
      }
    }
    return authPair
  }
})()

export const getAuthUser = once(() => {
  getAuthPair()
  return getGun().user()
})

export const hasUser = (alias, cb) => {
  getGun().get(`~@${alias}`).on(gunOnce(T, data => {
    cb(!!data)
  }))
}

export const recall = cb => {
  // custom implementation instead of recall({ sessionStorage: true })
  // because safari clears session storage when navigating by address bar.
  const storage = getLocalStorage()
  if (storage.pair) {
    getAuthUser().auth(jsonParse(storage.pair))
  }

  if (getAuthUser().is) {
    getAuthUser().on(gunOnce(T, data => {
      getAuthPair(pair => {
        if (data) {
          const { name, auth, pub } = data
          const alias = data.alias || getAuthUser().is.alias || null
          cb({
            alias,
            name: name || null,
            auth,
            pair,
          })

          // if there is no name specified,
          // and alias is just the public key.
          if (!name && alias && alias === pub) {
            getAuthUser().get('name').put('Anonymous')
          }
        } else {
          cb({
            alias: getAuthUser().is.alias,
            name: null,
            auth: null,
            pair,
          })
        }
      })

      // tell server not to render the login page.
      document.cookie = 'recall=true;'
    }))
  } else {
    cb({
      err: 'Wrong user or password.',
    })

    // tell server to start rendering the login page.
    document.cookie = ''
  }
}

export const authorise = (alias, password, cb, iteration = 0) => {
  getAuthUser().auth(alias, password, ack => {
    const { err } = ack

    if (err) {
      // workaround bug in user.auth. please remove the iteration if fixed.
      if (iteration <= 0 && /Wrong user or password/i.test(err)) {
        authorise(alias, password, cb, iteration + 1)
      } else {
        cb({ err })
      }
    } else {
      recall(cb)
    }
  })
}

export const authoriseQrCode = (pair, cb) => {
  getAuthUser().auth(pair, ack => {
    const { err } = ack

    if (err) {
      cb({ err })
    } else {
      getAuthUser().get('pub').put(pair.pub)
      getAuthUser().get('epub').put(pair.epub)
      recall(cb)
    }
  })
}

export const create = (alias, password, cb) => {
  getAuthUser().create(alias, password, ({ err }) => {
    if (err) {
      if (/User already created/i.test(err)) {
        authorise(alias, password, cb)
      } else {
        cb({ err })
      }
    } else {
      authorise(alias, password, cb)
    }
  })
}

export const createAnonymous = cb => {
  Sea.pair().then(pair => {
    getAuthUser().auth(pair, ({ err }) => {
      if (err) {
        cb({ err })
      } else {
        getAuthUser().get('pub').put(pair.pub)
        getAuthUser().get('epub').put(pair.epub)
        getAuthUser().get('name').put('Anonymous')
        recall(cb)
      }
    })
  })
}

export const setPassword = (password, cb) => {
  getAuthUser().auth(getAuthPair(), ({ err }) => {
    if (err) {
      cb({ err })
    } else {
      recall(cb)
    }
  }, {
    change: password,
  })
}

export const setUserName = name => {
  getAuthUser()
    .get('name')
    .put(name)
}

export const leave = () => {
  getAuthUser()
    .leave()

  // clear auth pair from local storage.
  const storage = getLocalStorage()
  if (storage.removeItem) {
    storage.removeItem('pair')
  }

  // tell server to start rendering the login page.
  document.cookie = ''
}

export const getRequestMessage = ({ alias, name, pair: { pub } }) => (
  `From ${name || alias || pub}`
)

export const getGroupRequestMessage = ({ alias, name, pair: { pub } }, names) => {
  const loginName = name || alias || pub
  const memberNames = [loginName, ...names]
  return `Group chat ${memberNames.join(', ')}`
}

export const isStrongPassword = test(/(?=^.{8,}$)(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
