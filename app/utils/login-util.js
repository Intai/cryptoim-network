import { gun } from './gun-util'
import Sea from 'gun/sea'

export const authUser = gun.user()
let authPair

gun.on('auth', ack => {
  authPair = ack.sea
})

export const getAuthPair = () => authPair

export const hasUser = (alias, cb) => {
  gun.get(`~@${alias}`).once(data => {
    cb(!!data)
  })
}

export const recall = (cb) => {
  authUser.recall({ sessionStorage: true })

  if (authUser.is) {
    authUser.once(data => {
      if (data) {
        const { alias, name } = data
        cb({
          alias: alias || authUser.is.alias || null,
          name: name || null,
          pair: authPair,
        })
      } else {
        cb({
          alias: authUser.is.alias,
          name: null,
          pair: authPair,
        })
      }
    })
  } else {
    cb({
      err: 'Wrong user or password.',
    })
  }
}

export const authorise = (alias, password, cb) => {
  authUser.auth(alias, password, ({ err }) => {
    if (err) {
      cb({ err })
    } else {
      recall(cb)
    }
  })
}

export const authoriseQrCode = (pair, cb) => {
  authUser.auth(pair, ({ err }) => {
    if (err) {
      cb({ err })
    } else {
      recall(cb)
    }
  })
}

export const create = (alias, password, cb) => {
  authUser.create(alias, password, ({ err }) => {
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
    authUser.auth(pair, ({ err }) => {
      if (err) {
        cb({ err })
      } else {
        authUser.get('pub').put(pair.pub)
        authUser.get('epub').put(pair.epub)
        authUser.get('name').put('Anonymous')
        recall(cb)
      }
    })
  })
}

export const setUserName = name => {
  authUser
    .get('name')
    .put(name)
}

export const leave = () => {
  authUser.leave()
}
