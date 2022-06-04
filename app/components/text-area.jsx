import { F, omit } from 'ramda'
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'
import { inputBackground } from './color'
import { fontSans, fontNormal } from './typography'

const TextAreaStyled = styled.textarea`
  ${inputBackground}
  ${fontSans}
  ${fontNormal}
  display: block;
  border: 0;
  outline: 0;
  height: 20px;
  padding: 12px 10px 10px 10px;
  margin: 0 0 15px;
  width: 270px;
  max-width: calc(100vw - 30px);
  border-radius: 0;
  resize: none;

  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior: none;
  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
`

const onEnterKeyDown = e => e.which === 13 && !e.shiftKey

const adjustHeight = (node, value) => {
  const { style } = node

  if (value === '') {
    style.height = ''
  } else {
    // one pixel to shrink the height.
    style.height = '1px'
    style.height = `${node.scrollHeight - 19}px`
  }
}

const TextArea = React.forwardRef((props, ref) => {
  const {
    value: propsValue,
    shouldSubmitOnKeyDown,
    shouldClearOnKeyDown,
    onChange,
    onSubmit,
  } = props
  const [value, setValue] = useState(propsValue)
  const textAreaRef = useRef()

  useEffect(() => {
    setValue(propsValue)
  }, [propsValue])

  useEffect(() => {
    const { current: node } = textAreaRef
    if (node) {
      adjustHeight(node, value)
    }
  })

  useImperativeHandle(ref, () => ({
    clear: () => setValue(''),
    focus: () => textAreaRef.current?.focus(),
  }), [])

  const handleChange = useCallback(e => {
    setValue(e.target.value)
    onChange(e)
  }, [onChange])

  const handleKeyDown = useCallback(e => {
    // when to submit the text area.
    if (shouldSubmitOnKeyDown(e)) {
      onSubmit(e)
      e.preventDefault()
    }
    // clear the text area when pressing down certain keys.
    if (shouldClearOnKeyDown(e)) {
      setValue('')
    }
  }, [onSubmit, shouldClearOnKeyDown, shouldSubmitOnKeyDown])

  return (
    <TextAreaStyled
      ref={textAreaRef}
      {...omit(['onSubmit'], props)}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
})

TextArea.displayName = 'TextArea'

TextArea.defaultProps = {
  value: '',
  shouldSubmitOnKeyDown: onEnterKeyDown,
  shouldClearOnKeyDown: onEnterKeyDown,
  onChange: F,
  onSubmit: F,
}

export default React.memo(TextArea)
