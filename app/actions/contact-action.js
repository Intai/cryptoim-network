import { fromBinder, fromCallback, mergeAll, once } from 'baconjs'
import ActionTypes from './action-types'
import {
  getContact,
  setContact,
  removeContact,
} from '../utils/contact-util'

export const init = () => mergeAll(
  once({
    type: ActionTypes.CONTACT_INIT,
  }),

  fromBinder(sink => (
    getContact(contact => {
      sink({
        type: ActionTypes.CONTACT_APPEND,
        contact,
      })
    })
  ))
)

export const invite = pubicKey => fromCallback(callback => {
  setContact(pubicKey, contact => {
    const { err } = contact

    if (err) {
      callback({
        type: ActionTypes.CONTACT_INVITE_ERROR,
        pub: pubicKey,
        err,
      })
    } else {
      callback({
        type: ActionTypes.CONTACT_APPEND,
        contact,
      })
    }
  })
})

export const remove = contact => {
  removeContact(contact)
  return {
    type: ActionTypes.CONTACT_DELETE,
    pub: contact.pub,
  }
}

export const clearError = () => ({
  type: ActionTypes.CONTACT_CLEAR_INVITE_ERROR,
})
