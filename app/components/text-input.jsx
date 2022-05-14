import React from 'react'
import styled from 'styled-components'
import { inputBackground } from './color'
import { fontSans, fontNormal } from './typography'

const Input = styled.input`
  ${inputBackground}
  ${fontSans}
  ${fontNormal}
  display: block;
  border: 0;
  outline: 0;
  padding: 10px;
  margin: 0 0 15px;
  width: 270px;
  max-width: calc(100vw - 30px);
  box-sizing: border-box;
`

const TextInput = props => (
  <Input
    type="text"
    {...props}
  />
)

export default React.memo(TextInput)
