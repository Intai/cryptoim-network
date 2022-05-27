import React, { useCallback } from 'react'
import styled from 'styled-components'
import { LocationAction } from 'bdux-react-router'
import { getStaticUrl } from '../utils/common-util'
import * as ConversationAction from '../actions/conversation-action'

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

const ConversationDelete = ({ conversation, dispatch }) => {
  // delete the conversation and then navigate back to the conversation list.
  const handleDelete = useCallback(() => {
    dispatch(ConversationAction.remove(conversation))
    dispatch(LocationAction.replace('/conversations'))
  }, [conversation, dispatch])

  return (
    <TrashIcon
      src={getStaticUrl('/icons/trash.svg')}
      title="Delete the conversation"
      onClick={handleDelete}
    />
  )
}

export default React.memo(ConversationDelete)
