import { filter, find, prop, propEq } from 'ramda'
import {
  combineAsArray,
  combineTemplate,
  End,
  fromArray,
  fromBinder,
  fromCallback,
  fromPromise,
  mergeAll,
  never,
  once,
} from 'baconjs'
import { LocationAction } from 'bdux-react-router'
import ActionTypes from './action-types'
import { Sea } from '../utils/gun-util'
import {
  createConversation,
  removeRequest,
  sendNextMessage,
  sendMessageToUser,
} from '../utils/conversation-util'

export const updateRequestRemoved = () => ({
  type: ActionTypes.REQUEST_REMOVED_UPDATE,
})

export const sendRequest = (userPub, text) => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_SEND_REQUEST,
    userPub,
  }),

  fromCallback(callback => {
    const content = {
      type: 'request',
      text,
    }
    sendMessageToUser(userPub, userPub, content, ({ message, err }) => {
      if (err) {
        callback({
          type: ActionTypes.CONVERSATION_SEND_REQUEST_ERROR,
          userPub,
          err,
        })
      } else {
        // create a conversation after successfully sent the request.
        createConversation(message, conversation => {
          // and then navigate to the conversation.
          callback(LocationAction.push(`/conversation/${conversation.uuid}`))
        })
      }
    })
  })
)

export const acceptRequest = message => (
  fromBinder(sink => {
    // mark the request as processed.
    removeRequest(message)
    // create a conversation when accepting the request.
    createConversation(message, conversation => {
      // remove the request from request list store.
      sink({
        type: ActionTypes.REQUEST_ACCEPT,
        message,
      })
      // and then navigate to the conversation.
      sink(LocationAction.push(`/conversation/${conversation.uuid}`))
      sink(new End())
    })
  })
)

export const declineRequest = message => {
  // mark the request as processed.
  removeRequest(message)
  // remove the request from request list store.
  return {
    type: ActionTypes.REQUEST_DECLINE,
    message,
  }
}

export const amendRequest = (nextPair, conversePub, request) => {
  // mark the request as processed.
  removeRequest(request)
  // send a message in the conversation to amend the next pair.
  sendNextMessage(nextPair, conversePub, {
    type: 'amendRequest',
    nextPair: request.nextPair,
  })
  // remove the request from request list store.
  return {
    type: ActionTypes.REQUEST_ACCEPT,
    message: request,
  }
}

const filterRequestError = filter(
  propEq('type', ActionTypes.CONVERSATION_SEND_REQUEST_ERROR)
)

const findRequestSuccess = find(
  propEq('type', ActionTypes.CONVERSATION_SEND_REQUEST_SUCCESS)
)

export const sendGroupRequests = (userPubs, loginPub, text) => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_SEND_GROUP_REQUESTS,
    userPubs,
  }),

  combineTemplate({
    // generate pairs for the group conversation.
    nextPair: fromPromise(Sea.pair()),
    conversePub: fromPromise(Sea.pair()).map(prop('pub')),
  })
    .flatMap(({ nextPair, conversePub }) => (
      // combine to wait for all group requests to finish.
      combineAsArray(userPubs.map(userPub => (
        fromCallback(callback => {
          const content = {
            type: 'request',
            adminPub: loginPub,
            memberPubs: [loginPub].concat(userPubs),
            nextPair,
            text,
          }
          // send group request one by one.
          sendMessageToUser(userPub, conversePub, content, ({ message, err }) => {
            if (err) {
              callback({
                type: ActionTypes.CONVERSATION_SEND_REQUEST_ERROR,
                userPub,
                err,
              })
            } else {
              callback({
                type: ActionTypes.CONVERSATION_SEND_REQUEST_SUCCESS,
                message,
              })
            }
          })
        })
      )))
    ))
    .flatMap(actions => {
      const errorActions = filterRequestError(actions)
      const successAction = findRequestSuccess(actions)

      // pass on error actions.
      const errorStream = errorActions.legnth > 0 && fromArray(errorActions)
      // if there is at least one group request was successful.
      const successStream = successAction && fromCallback(callback => {
        // create a conversation after successfully sent at least one request.
        createConversation(successAction.message, conversation => {
          // and then navigate to the conversation.
          callback(LocationAction.push(`/conversation/${conversation.uuid}`))
        })
      })

      if (successStream) {
        return !errorStream
          ? successStream
          : errorStream.merge(successStream)
      } else {
        return errorStream || never()
      }
    })
)
