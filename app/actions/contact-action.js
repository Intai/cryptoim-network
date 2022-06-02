import { fromBinder, fromCallback } from 'baconjs'
import ActionTypes from './action-types'
import {
  getContact,
  setContact,
  removeContact,
} from '../utils/contact-util'

export const init = () => fromBinder(sink => (
  getContact(contact => {
    sink({
      type: ActionTypes.CONTACT_APPEND,
      contact,
    })
  })
))

export const append = pubicKey => fromCallback(callback => {
  setContact(pubicKey, contact => {
    const { err } = contact

    if (err) {
      callback({
        type: ActionTypes.CONTACT_APPEND_ERROR,
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
