import {
  converge,
  equals,
  find,
  findIndex,
  identity,
  insert,
  mergeDeepRight,
  pathEq,
  prop,
  propEq,
  remove,
  when,
} from 'ramda'
import { Bus } from 'baconjs'
import { createStore } from 'bdux/store'
import StoreNames from './store-names'
import { getContactName } from '../utils/contact-util'
import ActionTypes from '../actions/action-types'

const isAction = pathEq(
  ['action', 'type'],
)

const isLargerContactName = contactName => contact => (
  getContactName(contact)?.toLowerCase() > contactName
)

const insertContact = (contact, contacts) => {
  const contactName = getContactName(contact)?.toLowerCase()
  let index = findIndex(isLargerContactName(contactName), contacts)
  if (index < 0) {
    index = contacts.length
  }
  return insert(index, contact, contacts)
}

const append = (contact, contacts) => {
  const source = contacts || []
  const current = find(propEq('pub', contact.pub), source)

  if (!current) {
    return insertContact(contact, source)
  }
  if (!equals(current, contact)) {
    const index = source.indexOf(current)
    return insertContact(contact, remove(index, 1, source))
  }
  return source
}

const removePublicKey = (pub, contacts) => {
  const source = contacts || []
  const index = findIndex(propEq('pub', pub), source)
  return (index < 0)
    ? source
    : remove(index, 1, source)
}

const whenAppend = when(
  isAction(ActionTypes.CONTACT_APPEND),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { contact } }) => ({
      state: {
        contacts: append(contact, state.contacts),
        err: null,
      },
    }),
  ])
)

const whenAppendError = when(
  isAction(ActionTypes.CONTACT_APPEND_ERROR),
  converge(mergeDeepRight, [
    identity,
    ({ action: { err } }) => ({
      state: {
        err,
      },
    }),
  ])
)

const whenDelete = when(
  isAction(ActionTypes.CONTACT_DELETE),
  converge(mergeDeepRight, [
    identity,
    ({ state, action: { pub } }) => ({
      state: {
        contacts: removePublicKey(pub, state.contacts),
        err: null,
      },
    }),
  ])
)

const whenLogout = when(
  isAction(ActionTypes.LOGOUT),
  converge(mergeDeepRight, [
    identity,
    () => ({
      state: {
        contacts: [],
        err: null,
      },
    }),
  ])
)

export const getReducer = () => {
  const reducerStream = new Bus()
  return {
    input: reducerStream,
    output: reducerStream
      .map(whenAppend)
      .map(whenAppendError)
      .map(whenDelete)
      .map(whenLogout)
      .map(prop('state')),
  }
}

export default createStore(
  () => ({
    name: StoreNames.CONTACT_LIST,
    defaultValue: {
      contacts: [],
      err: null,
    },
  }),
  getReducer,
)
