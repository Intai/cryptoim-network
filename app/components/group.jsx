import { filter, find, last, pipe, prop, propEq, sortBy } from 'ramda'
import React, { useCallback, useMemo } from 'react'
import { useParams } from 'react-router'
import { LocationAction } from 'bdux-react-router'
import styled from 'styled-components'
import { createUseBdux } from 'bdux/hook'
import PanelHeader from './panel-header'
import TextInput from './text-input'
import ContactList from './contact-list'
import { fontLarge } from './typography'
import { getStaticUrl } from '../utils/common-util'
import { getGroupDefaultName, getGroupName } from '../utils/conversation-util'
import * as ConversationAction from '../actions/conversation-action'
import LoginStore from '../stores/login-store'
import ContactListStore from '../stores/contact-list-store'
import ConversationListStore from '../stores/conversation-list-store'
import MessageListStore from '../stores/message-list-store'

const GroupIcon = styled.img`
  height: 14px;
  width: 18px;
  vertical-align: top;
  margin: 3px 10px 0 0;
`

const TitleText = styled.div`
  display: inline-block;
  max-width: calc(100% - 28px);
  overflow: hidden;
  text-overflow: ellipsis;
`

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

const GroupNameContainer = styled.div`
  max-width: calc(100% - 40px);
  width: 975px;
  padding: 0 20px;
`

const GroupNameTitle = styled.div`
  ${fontLarge}
  margin: 15px 0;
`

const sortByTimestamp = sortBy(prop('timestamp'))

const filterSortMessages = (loginPub, conversePub) => pipe(
  filter(({ conversePub: messageConversePub, fromPub }) => (
    // message from myself in the conversation,
    // or messages in a group chat.
    (conversePub === messageConversePub)
      // or from the other user.
      || (loginPub === messageConversePub && conversePub === fromPub)
  )),
  sortByTimestamp
)

const useBdux = createUseBdux({
  login: LoginStore,
  contactList: ContactListStore,
  conversationList: ConversationListStore,
  messageList: MessageListStore,
})

const Group = props => {
  const { converseUuid } = useParams()
  const { state: { login, contactList, conversationList, messageList }, dispatch } = useBdux(props)
  const { pair: { pub: loginPub } } = login
  const { contacts } = contactList
  const { conversations } = conversationList
  const { messages } = messageList

  // find the conversation by uuid in url.
  const conversation = useMemo(() => (
    find(propEq('uuid', converseUuid), conversations)
  ), [conversations, converseUuid])

  // find the last message in the conversation.
  const conversePub = conversation?.conversePub
  const lastMessage = useMemo(() => (
    last(filterSortMessages(loginPub, conversePub)(messages))
  ), [conversePub, loginPub, messages])

  // tick the current group members.
  const checkedPubs = useMemo(() => (
    conversation?.memberPubs.reduce((accum, memberPub) => {
      if (loginPub !== memberPub) {
        accum[memberPub] = true
      }
      return accum
    }, {}) || {}
  ), [conversation, loginPub])

  // delete the conversation and then navigate back to the conversation list.
  const handleDelete = useCallback(() => {
    dispatch(ConversationAction.remove(conversation))
    dispatch(LocationAction.replace('/conversations'))
  }, [conversation, dispatch])

  // handle enter and escape key for group name.
  const handleGroupNameKeyDown = useCallback(e => {
    if (e.keyCode === 13) {
      e.target.blur()
    } if (e.keyCode === 27) {
      const { target } = e
      target.value = conversation.name || ''
      target.blur()
    }
  }, [conversation])

  // handle blur to rename the group.
  const handleGroupNameBlur = useCallback(e => {
    const { value } = e.target
    if (conversation.name !== value) {
      dispatch(ConversationAction.updateGroupName(conversation, value))
    }
  }, [conversation, dispatch])

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
      <PanelHeader href={`/conversation/${converseUuid}`}>
        <>
          <GroupIcon
            src={getStaticUrl('/icons/user-group.svg')}
            alt="Group"
          />
          <TitleText>
            {getGroupName(login, contacts, conversation)
              || conversation.conversePub}
          </TitleText>
        </>
        <TrashIcon
          src={getStaticUrl('/icons/trash.svg')}
          title="Delete the conversation"
          onClick={handleDelete}
        />
      </PanelHeader>
      <GroupNameContainer>
        <GroupNameTitle>Group name</GroupNameTitle>
        <TextInput
          name="group"
          value={conversation.name}
          placeholder={getGroupDefaultName(login, contacts, conversation)}
          autoComplete="off"
          onKeyDown={handleGroupNameKeyDown}
          onBlur={handleGroupNameBlur}
        />
      </GroupNameContainer>
      <ContactList
        checkedPubs={checkedPubs}
        conversation={conversation}
        nextPair={lastMessage?.nextPair || conversation.nextPair}
      />
    </>
  )
}

export default React.memo(Group)
