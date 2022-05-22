import { sort } from 'ramda'
import React, { useMemo } from 'react'
import { useParams } from 'react-router'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import ConversationListItem from './conversation-list-item'
import { fontLarge } from './typography'
import LoginStore from '../stores/login-store'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'
import MessageListStore from '../stores/message-list-store'

const Title = styled.div`
  ${fontLarge}
  margin: 15px 20px;
`

const compareConversations = (a, b) => (
  (b.lastTimestamp || 0) - (a.lastTimestamp || 0)
)

const useBdux = createUseBdux({
  login: LoginStore,
  contactList: ContactListStore,
  conversationList: ConversationListStore,
  messageList: MessageListStore,
})

const ConversationList = (props) => {
  const { converseUuid } = useParams()
  const { state: { login, contactList, conversationList, messageList }, dispatch } = useBdux(props)
  const { contacts } = contactList
  const { conversations } = conversationList
  const { messages } = messageList

  const sortedConversations = useMemo(() => (
    sort(compareConversations, conversations)
  ), [conversations])

  return conversations.length > 0 && (
    <>
      <Title>Conversations</Title>
      <ul>
        {sortedConversations.map(conversation => (
          <ConversationListItem
            key={conversation.conversePub}
            login={login}
            contacts={contacts}
            conversation={conversation}
            messages={messages}
            isSelected={converseUuid === conversation.uuid}
            dispatch={dispatch}
          />
        ))}
      </ul>
    </>
  )
}

export default React.memo(ConversationList)
