import React from 'react'
import styled from 'styled-components'
import { primaryAnchor } from './color'

const Primary = styled.a`
  &:link,
  &:visited {
    ${primaryAnchor}
  }

  &:active {
    color: inherit;
  }
`

const getComponent = kind => {
  switch (kind) {
  default:
    return Primary
  }
}

const Anchor = ({ kind, ...props }) => (
  React.createElement(
    getComponent(kind),
    props
  )
)

export default React.memo(Anchor)
