import { once } from 'ramda'
import { getGun, Sea } from './gun-util'

export const getAuthPair = (() => {
  let authPair
  const subscribe = once(() => {
    getGun().on('auth', ack => {
      authPair = ack.sea
    })
  })

  return () => {
    subscribe()
    return authPair
  }
})()

export const getAuthUser = once(() => {
  getAuthPair()
  return getGun().user()
})

export const hasUser = (alias, cb) => {
  getGun().get(`~@${alias}`).once(data => {
    cb(!!data)
  })
}

export const recall = (cb) => {
  getAuthUser().recall({ sessionStorage: true })

  if (getAuthUser().is) {
    getAuthUser().once(data => {
      if (data) {
        const { alias, name } = data
        cb({
          alias: alias || getAuthUser().is.alias || null,
          name: name || null,
          pair: getAuthPair(),
        })
      } else {
        cb({
          alias: getAuthUser().is.alias,
          name: null,
          pair: getAuthPair(),
        })
      }

      // tell server not to render the login page.
      document.cookie = 'recall=true;'
    })
  } else {
    cb({
      err: 'Wrong user or password.',
    })

    // tell server to start rendering the login page.
    document.cookie = ''
  }
}

export const authorise = (alias, password, cb) => {
  getAuthUser().auth(alias, password, ({ err }) => {
    if (err) {
      cb({ err })
    } else {
      recall(cb)
    }
  })
}

export const authoriseQrCode = (pair, cb) => {
  getAuthUser().auth(pair, ({ err }) => {
    if (err) {
      cb({ err })
    } else {
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

export const setUserName = name => {
  getAuthUser()
    .get('name')
    .put(name)
}

export const leave = () => {
  getAuthUser()
    .leave()

  // tell server to start rendering the login page.
  document.cookie = ''
}
