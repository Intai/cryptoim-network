import React, { useCallback } from 'react'
import styled from 'styled-components'
import { useBdux } from 'bdux/hook'
import { LocationAction } from 'bdux-react-router'
import { fontLarge } from './typography'
import { getStaticUrl } from '../utils/common-util'

const Container = styled.div`
  flex: 0 0 auto;
  display: flex;
`

const BackAnchor = styled.a`
  flex: 0 0 auto;
`

const BackIcon = styled.img`
  height: 20px;
  padding: 25px 10px 15px 20px;
  vertical-align: top;
  cursor: pointer;
  transform-origin: 25px 35px;
  transition: transform linear 100ms;

  &:hover {
    transform: scale(1.3);
  }
`

const Title = styled.div`
  ${fontLarge}
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 24px 15px 15px 5px;
`

const Menu = styled.div`
  flex: 0 0 auto;
`

const PanelHeader = props => {
  const { href, children } = props
  const hasChildren = Array.isArray(children)
  const title = hasChildren ? children[0] : children
  const menu = hasChildren ? children[1] : null
  const { dispatch } = useBdux(props)

  const handleShowConversations = useCallback(e => {
    dispatch(LocationAction.push(e.currentTarget.href))
    e.preventDefault()
  }, [dispatch])

  return (
    <Container>
      <BackAnchor
        href={href || '/conversations'}
        onClick={handleShowConversations}
      >
        <BackIcon src={getStaticUrl('/icons/angle-left.svg')} />
      </BackAnchor>
      <Title>{title}</Title>
      <Menu>{menu}</Menu>
    </Container>
  )
}

export default React.memo(PanelHeader)
