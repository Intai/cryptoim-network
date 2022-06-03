import React from 'react'
import styled from 'styled-components'
import { secondaryButton } from './color'
import { fontBold, fontSans } from './typography'

const Label = styled.label`
  ${secondaryButton}
  ${fontSans}
  ${fontBold}
  display: block;
  outline: 0;
  padding: 10px;
  margin: 0 0 15px;
  width: 270px;
  max-width: calc(100vw - 30px);
  box-sizing: border-box;
  font-size: 13px;
  text-align: center;
  cursor: pointer;
`

const Input = styled.input`
  display: none;
`

const FileInput = ({ className, accept, multiple, children, onChange }) => (
  <Label className={className}>
    <Input
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={onChange}
    />
    {children}
  </Label>
)

export default React.memo(FileInput)
