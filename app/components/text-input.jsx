import React, { useCallback, useEffect, useState } from 'react'
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
  border-radius: 0;
`

const TextInput = React.forwardRef((props, ref) => {
  const { value: propsValue, onChange } = props
  const [value, setValue] = useState(propsValue)

  useEffect(() => {
    setValue(propsValue)
  }, [propsValue])

  const handleChange = useCallback(e => {
    setValue(e.target.value)
    if (onChange) {
      onChange(e)
    }
  }, [onChange])

  return (
    <Input
      ref={ref}
      type="text"
      {...props}
      value={value}
      onChange={handleChange}
    />
  )
})

TextInput.displayName = 'TextInput'

TextInput.defaultProps = {
  value: '',
}

export default React.memo(TextInput)
