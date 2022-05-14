import React from 'react'
import { useParams } from 'react-router'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import ConversationListItem from './conversation-list-item'
import { fontLarge } from './typography'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'

const Title = styled.div`
  ${fontLarge}
  margin: 15px 20px;
`

const useBdux = createUseBdux({
  contactList: ContactListStore,
  conversationList: ConversationListStore,
})

const ConversationList = (props) => {
  const { converseUuid } = useParams()
  const { state: { contactList, conversationList }, dispatch } = useBdux(props)
  const { contacts } = contactList
  const { conversations } = conversationList

  return conversations.length > 0 && (
    <>
      <Title>Conversations</Title>
      <ul>
        {conversations.map(conversation => (
          <ConversationListItem
            key={conversation.conversePub}
            contacts={contacts}
            conversation={conversation}
            isSelected={converseUuid === conversation.uuid}
            dispatch={dispatch}
          />
        ))}
      </ul>
    </>
  )
}

export default React.memo(ConversationList)
