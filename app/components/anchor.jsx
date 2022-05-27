import React from 'react'
import styled from 'styled-components'
import { primaryAnchor, secondaryText } from './color'

const Primary = styled.a`
  &:link,
  &:visited {
    ${primaryAnchor}
  }

  &:active {
    color: inherit;
  }
`

const Subtle = styled.a`
  &:link,
  &:visited {
    ${secondaryText}
  }

  &:active,
  &:hover {
    color: inherit;
  }
`

const getComponent = kind => {
  switch (kind) {
  case 'subtle':
    return Subtle
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
