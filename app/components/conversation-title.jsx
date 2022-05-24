import { clamp, find, propEq } from 'ramda'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import styled from 'styled-components'
import { LocationAction } from 'bdux-react-router'
import { inputBackground } from './color'
import { fontSmall } from './typography'
import { useResponsive } from '../hooks/responsive'
import { getStaticUrl } from '../utils/common-util'
import { getContactName } from '../utils/contact-util'
import { getGroupName } from '../utils/conversation-util'

const GroupIcon = styled.img`
  height: 14px;
  width: 18px;
  vertical-align: top;
  margin: 3px 10px 0 0;
  transition: transform linear 100ms;
`

const GearIcon = styled.img`
  height: 16px;
  vertical-align: top;
  margin: 3px 0 0 10px;
  transition: transform linear 100ms;
`

const InfoIcon = styled.img`
  height: 16px;
  width: 16px;
`

const InfoTooltip = styled.div`
  ${fontSmall}
  ${inputBackground}
  color: #000;
  position: fixed;
  top: 50px;
  left: 200%;
  visibility: hidden;
  white-space: nowrap;
  padding: 10px;
  pointer-events: none;
`

const InfoContainer = styled.div`
  display: inline-block;
  vertical-align: top;
  margin: 3px 0 0 10px;
  position: relative;

  &:hover >${InfoTooltip} {
    visibility: visible;
  }
`

const Title = styled.div`
  ${({ isGroupAdmin }) => isGroupAdmin && `
    cursor: pointer;

    &:hover >${GearIcon} {
      transform: scale(1.3);
    }
  `}
`

const TitleText = styled.div`
  display: inline-block;
  max-width: calc(100% - 28px - 26px);
  overflow: hidden;
  text-overflow: ellipsis;
`

const getInfoTooltip = admin => {
  const name = admin?.name
  return `Only ${name ? `${name} `: ''}can edit the group`
}

const ConversationTitle = ({
  conversation,
  contacts,
  contact,
  login,
  dispatch,
}) => {
  const { uuid, conversePub, adminPub } = conversation
  const { pair: { pub: loginPub } } = login
  const isGroupChat = !!conversation.memberPubs
  const isAdmin = conversation.adminPub === loginPub
  const isGroupAdmin = isGroupChat && isAdmin
  const infoIconRef = useRef()
  const infoTooltipRef = useRef()

  const admin = useMemo(() => (
    find(propEq('pub', adminPub), contacts)
  ), [adminPub, contacts])

  // re-render when resizing.
  useResponsive()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const { current: infoIcon } = infoIconRef
    const { current: infoTooltip } = infoTooltipRef
    if (infoIcon && infoTooltip) {
      const rectIcon = infoIcon.getBoundingClientRect()
      const rectTooltip = infoTooltip.getBoundingClientRect()
      const middle = rectIcon.left + rectIcon.width / 2
      const left = middle - rectTooltip.width / 2
      const max = window.innerWidth - rectTooltip.width - 10
      infoTooltip.style.left = `${clamp(10, max, left)}px`
    }
  })

  // navigate to edit group name and members.
  const handleEditGroup = useCallback(() => {
    if (isGroupChat && isAdmin) {
      dispatch(LocationAction.push(`/group/${uuid}`))
    }
  }, [uuid, dispatch, isAdmin, isGroupChat])

  return (
    <Title
      isGroupAdmin={isGroupAdmin}
      onClick={handleEditGroup}
    >
      {isGroupChat && (
        <GroupIcon
          src={getStaticUrl('/icons/user-group.svg')}
          alt="Group"
        />
      )}
      <TitleText>
        {getContactName(contact)
          || getGroupName(login, contacts, conversation)
          || conversePub}
      </TitleText>
      {isGroupAdmin && (
        <GearIcon
          src={getStaticUrl('/icons/gear.svg')}
          title="Group settings"
        />
      )}
      {isGroupChat && !isAdmin && (
        <InfoContainer>
          <InfoIcon
            ref={infoIconRef}
            src={getStaticUrl('/icons/circle-info.svg')}
            alt="Only admin can edit the group"
          />
          <InfoTooltip ref={infoTooltipRef}>
            {getInfoTooltip(admin)}
          </InfoTooltip>
        </InfoContainer>
      )}
    </Title>
  )
}

export default React.memo(ConversationTitle)
