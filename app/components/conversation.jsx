import { find, last, propEq, reduce } from 'ramda'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router'
import { LocationAction } from 'bdux-react-router'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import PanelHeader from './panel-header'
import ConversationTitle from './conversation-title'
import Anchor from './anchor'
import Message from './message'
import MessageInput from './message-input'
import { scrollbar } from './scrollbar'
import { getStaticUrl } from '../utils/common-util'
import { filterSortMessages } from '../utils/message-util'
import * as MessageAction from '../actions/message-action'
import * as ConversationAction from '../actions/conversation-action'
import LoginStore from '../stores/login-store'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'
import MessageListStore from '../stores/message-list-store'

const TrashIcon = styled.img`
  height: 14px;
  padding: 28px 20px 18px 15px;
  vertical-align: top;
  cursor: pointer;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`

const Container = styled.div`
  max-width: calc(100% - 40px);
  width: 975px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`

const LoadMoreAnchor = styled(Anchor)`
  text-align: center;
  margin-bottom: 15px;
`

const MessageList = styled.ul`
  ${scrollbar}
  flex: 1;
`

const renderMessages = (render, messages) => reduce(
  ({ elements, prev }, message) => {
    // render with the previous message.
    const element = render(message, prev)
    elements.push(element)

    return {
      elements,
      prev: message,
    }
  }, {
    elements: [],
    prev: null,
  },
  messages
).elements

const useBdux = createUseBdux({
  login: LoginStore,
  contactList: ContactListStore,
  conversationList: ConversationListStore,
  messageList: MessageListStore,
})

const Conversation = (props) => {
  const { converseUuid } = useParams()
  const { state: { login, contactList, conversationList, messageList }, dispatch } = useBdux(props)
  const { contacts } = contactList
  const { conversations } = conversationList
  const { messages } = messageList
  const expireTimeoutRef = useRef()
  const scrollbarRef = useRef()

  // find the conversation by uuid in url.
  const conversation = useMemo(() => (
    find(propEq('uuid', converseUuid), conversations)
  ), [conversations, converseUuid])

  // find the other user in the conversation.
  const conversePub = conversation?.conversePub
  const contact = useMemo(() => (
    find(propEq('pub', conversePub), contacts)
  ), [contacts, conversePub])

  // filter and sort the messages in the conversation.
  const { pair: { pub: loginPub } } = login
  const filteredMessages = useMemo(() => (
    filterSortMessages(loginPub, conversePub)(messages)
  ), [conversePub, loginPub, messages])

  // delete the conversation and then navigate back to the conversation list.
  const handleDelete = useCallback(() => {
    dispatch(ConversationAction.remove(conversation))
    dispatch(LocationAction.replace('/conversations'))
  }, [conversation, dispatch])

  // load expired messages in the conversation.
  const handleLoadMore = useCallback(e => {
    dispatch(MessageAction.getExpiredMessages(conversation))
    e.preventDefault()
  }, [conversation, dispatch])

  useEffect(() => {
    dispatch(ConversationAction.selectConversation(conversation, last(filteredMessages)?.timestamp))
  // when selecting a different conversation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation])

  useEffect(() => () => {
    dispatch(ConversationAction.deselectConversation())
  // willUnmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // expiring messages is not urgent. debounce until message list is stable.
    clearTimeout(expireTimeoutRef.current)
    expireTimeoutRef.current = setTimeout(() => {
      dispatch(MessageAction.expireConversationMessages(converseUuid, filteredMessages))
    }, 1000)

    return () => {
      // didn't get to expire messages. not a big deal.
      // let's try again when the next time the conversation is selected.
      clearTimeout(expireTimeoutRef.current)
    }
  }, [converseUuid, dispatch, filteredMessages])

  useEffect(() => {
    const { current: scrollbar } = scrollbarRef
    if (scrollbar) {
      // scroll to the bottom.
      scrollbar.scrollTop = scrollbar.scrollHeight
    }
  // either when switching between conversations,
  // or when there are new messages.
  }, [converseUuid, filteredMessages.length])

  if (!conversation) {
    // unknown conversation.
    return (
      <PanelHeader>
        {''}
        <TrashIcon
          src={getStaticUrl('/icons/trash.svg')}
          title="Delete the conversation"
          onClick={handleDelete}
        />
      </PanelHeader>
    )
  }

  return (
    <>
      <PanelHeader>
        <ConversationTitle
          conversation={conversation}
          contacts={contacts}
          contact={contact}
          login={login}
          dispatch={dispatch}
        />
        <TrashIcon
          src={getStaticUrl('/icons/trash.svg')}
          title="Delete the conversation"
          onClick={handleDelete}
        />
      </PanelHeader>
      <Container>
        {conversation.rootPair.pub !== conversation.nextPair.pub && (
          <LoadMoreAnchor
            href={`/conversation/${converseUuid}`}
            kind="subtle"
            onClick={handleLoadMore}
          >
            {'Load messages older than 90 days'}
          </LoadMoreAnchor>
        )}

        <MessageList ref={scrollbarRef}>
          {renderMessages((message, prev) => (
            <Message
              key={message.uuid}
              login={login}
              contacts={contacts}
              message={message}
              prev={prev}
            />
          ), filteredMessages)}
        </MessageList>

        <MessageInput
          conversation={conversation}
          messages={filteredMessages}
          dispatch={dispatch}
        />
      </Container>
    </>
  )
}

export default React.memo(Conversation)
