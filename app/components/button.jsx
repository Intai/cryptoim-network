import React from 'react'
import styled from 'styled-components'
import { primaryButton, secondaryButton } from './color'
import { fontBold } from './typography'

const Primary = styled.button`
  ${primaryButton}
  ${fontBold}
  display: block;
  border: 0;
  outline: 0;
  padding: 10px;
  margin: 0 0 15px;
  width: 270px;
  max-width: calc(100vw - 30px);
  box-sizing: border-box;
  cursor: pointer;
`

const Secondary = styled.button`
  ${secondaryButton}
  ${fontBold}
  display: block;
  outline: 0;
  padding: 10px;
  margin: 0 0 15px;
  width: 270px;
  max-width: calc(100vw - 30px);
  box-sizing: border-box;
  cursor: pointer;
`

const getComponent = kind => {
  switch (kind) {
  case 'secondary':
    return Secondary
  default:
    return Primary
  }
}

const Button = ({ kind, ...props }) => (
  React.createElement(
    getComponent(kind),
    props
  )
)

export default React.memo(Button)
