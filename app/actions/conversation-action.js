import {
  fromBinder,
  mergeAll,
  once,
} from 'baconjs'
import ActionTypes from './action-types'
import { appendConversationMessage } from './message-action'
import { Sea } from '../utils/gun-util'
import {
  getConversation,
  updateConversation,
  removeConversation,
  createGroup,
  updateGroup,
  getRemovedRequests,
  getConversationMessage,
  getMyMessage,
  sendMessageToUser,
  sendNextMessageToUser,
} from '../utils/conversation-util'

export const init = () => mergeAll(
  once({
    type: ActionTypes.CONVERSATION_INIT,
  }),

  fromBinder(sink => (
    getRemovedRequests(uuids => {
      sink({
        type: ActionTypes.REQUEST_REMOVED,
        uuids,
      })
    })
  )),

  fromBinder(sink => (
    getConversation(conversation => {
      sink({
        type: ActionTypes.CONVERSATION_APPEND,
        conversation,
      })
    })
  )),

  fromBinder(sink => (
    getConversationMessage(appendConversationMessage(sink))
  )),

  fromBinder(sink => (
    getMyMessage(message => {
      const { type } = message.content
      if (type === 'request') {
        sink({
          type: ActionTypes.REQUEST_APPEND,
          message,
        })
      }
    })
  ))
)

export const remove = conversation => {
  if (conversation) {
    removeConversation(conversation)
    return {
      type: ActionTypes.CONVERSATION_DELETE,
      conversation,
    }
  }
}

export const selectConversation = (conversation, timestamp) => conversation && ({
  type: ActionTypes.CONVERSATION_SELECT,
  conversation,
  timestamp,
})

export const deselectConversation = () => ({
  type: ActionTypes.CONVERSATION_SELECT,
  conversation: null,
})

export const updateLastTimestamp = (conversation, lastTimestamp) => {
  // update the conversation's lastTimestamp,
  // so we can figure out which messages are new.
  updateConversation(conversation.uuid, { lastTimestamp })
}

export const updateGroupConversation = (conversation, update) => {
  // update the group conversation e.g groupPair.
  if (conversation.memberPubs) {
    updateConversation(conversation.uuid, update)
  }
}

export const updateGroupName = (conversation, name) => {
  // update the group name.
  if (conversation.memberPubs) {
    updateGroup(conversation.groupPair, { name })
  }
}

export const renewGroupMembers = ({
  conversation,
  nextPair,
  memberPubs,
  addedPubs,
  removedPubs,
  remainingPubs,
  loginPub,
  text,
}) => {
  const { conversePub, groupPair } = conversation

  const sendRequests = targetPair => {
    // send group requests to new members.
    addedPubs.map(userPub => {
      sendMessageToUser(userPub, conversePub, {
        type: 'request',
        adminPub: loginPub,
        memberPubs,
        nextPair: targetPair,
        text,
      })
    })
  }

  if (removedPubs.length > 0) {
    // generate a new pair to exclude removed members.
    Sea.pair().then(renewPair => {
      // update the existing group.
      updateGroup(groupPair, { memberPubs }, group => {
        // and create a new group for the new pair.
        createGroup(renewPair, group)
      })
      // send the new pair to remaining members.
      remainingPubs.concat(loginPub).forEach(userPub => {
        sendNextMessageToUser(nextPair, userPub, conversePub, {
          type: 'renewGroup',
          renewPair,
        })
      })
      // send requests to new members.
      sendRequests(renewPair)
    })
  } else {
    // if there is no one removed,
    // simply update the existing group.
    updateGroup(groupPair, { memberPubs })
    // send requests to new members.
    sendRequests(groupPair)
  }
}
