import { identity, memoizeWith, pick } from 'ramda'
import { v4 as uuidv4 } from 'uuid'
import { gun } from './gun-util'
import Sea from 'gun/sea'
import { authUser, getAuthPair } from './login-util'

const uuidCache = {}
const nameCache = {}

const cleanContact = pick([
  'alias',
  'name',
  'epub',
  'pub',
])

// memoize because only need to subscrube to each contact once.
const updateContact = memoizeWith(identity, (pub, cb) => {
  gun.user(pub).get('name').on(name => {
    if (nameCache[pub] !== name) {
      nameCache[pub] = name
      setContact(pub, data => {
        if (!data.err) {
          cb(data)
        }
      })
    }
  })
})

export const getContact = cb => {
  // get contact when created or updated.
  authUser
    .get('contacts')
    .map()
    .on(encrypted => {
      if (encrypted) {
        Sea.decrypt(encrypted, getAuthPair()).then(contact => {
          if (contact) {
            const { uuid, pub, name } = contact
            uuidCache[pub] = uuid
            nameCache[pub] = name
            cb(contact)
            updateContact(pub, cb)
          }
        })
      }
    })
}

export const setContact = (pub, cb) => {
  gun.user(pub).once(data => {
    if (!data) {
      cb({ err: 'Invalid invite URL.' })
    } else {
      const uuid = uuidCache[pub] || uuidv4()
      uuidCache[pub] = uuid
      nameCache[pub] = data.name
      const contact = {
        ...cleanContact(data),
        uuid,
      }

      Sea.encrypt(contact, getAuthPair()).then(encrypted => {
        authUser
          .get('contacts')
          .get(`contact-${uuid}`)
          .put(encrypted)

        cb(contact)
      })
    }
  })
}

export const removeContact = contact => {
  authUser
    .get('contacts')
    .get(`contact-${contact.uuid}`)
    .put(null)
}
