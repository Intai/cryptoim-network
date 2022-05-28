import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { LocationAction } from 'bdux-react-router'
import RootPortal from './root-portal'
import Button from './button'
import { fontSans } from './typography'
import { primaryBackground } from './color'
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

const Modal = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  justify-content: center;
  align-items: center;
`

const Confirmation = styled.div`
  ${fontSans}
  ${primaryBackground}
  max-width: 100vw;
  width: 300px;
  padding: 15px 15px 0 15px;
  box-sizing: border-box;
`

const ConfirmButton = styled(Button)`
  margin-top: 25px;
  max-width: 100%;
`

const CancelButton = styled(Button)`
  max-width: 100%;
`

const ConversationDelete = ({ conversation, login, dispatch }) => {
  const { pair: { pub: loginPub } } = login
  const isAdmin = conversation?.adminPub === loginPub
  const [isConfirming, setIsConfirming] = useState(false)

  const handleDelete = useCallback(() => {
    setIsConfirming(true)
  }, [])

  const handleCancelDelete = useCallback(() => {
    setIsConfirming(false)
  }, [])

  // delete the conversation and then navigate back to the conversation list.
  const handleConfirmDelete = useCallback(() => {
    dispatch(ConversationAction.remove(conversation))
    dispatch(LocationAction.replace('/conversations'))
  }, [conversation, dispatch])

  return (
    <>
      <TrashIcon
        src={getStaticUrl('/icons/trash.svg')}
        title="Delete the conversation"
        onClick={isAdmin ? handleDelete : handleConfirmDelete}
      />
      {isConfirming && (
        <RootPortal>
          <Modal>
            <Confirmation>
              {'Are you sure you want to delete the group chat? '}
              {'You are the admin of the group which will be abandoned.'}

              <ConfirmButton
                type="button"
                kind="primary"
                onClick={handleConfirmDelete}
              >
                {'Delete'}
              </ConfirmButton>
              <CancelButton
                type="button"
                kind="secondary"
                onClick={handleCancelDelete}
              >
                {'Cancel'}
              </CancelButton>
            </Confirmation>
          </Modal>
        </RootPortal>
      )}
    </>
  )
}

export default React.memo(ConversationDelete)
