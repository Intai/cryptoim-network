import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { secondaryBorder } from './color'
import { getStaticUrl } from '../utils/common-util'

const Input = styled.input`
  display: none;
`

const CheckboxWrap = styled.div`
  ${secondaryBorder}
  border-width: 1px;
  border-style: solid;
  width: 18px;
  height: 18px;
  cursor: pointer;

  &:hover {
    background: rgba(255,255,255,0.1);
  }
`

const CheckIcon = styled.img`
  margin: 3px 4px 4px 4px;
`

const Checkbox = (props, ref) => {
  const { name, value, checked: propsChecked, onChange, className } = props
  const [checked, setChecked] = useState(propsChecked)

  useEffect(() => {
    setChecked(propsChecked)
  }, [propsChecked])

  const handleChange = useCallback(e => {
    setChecked(e.target.checked)
    if (onChange) {
      onChange(e)
    }
  }, [onChange])

  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={className}>
      <Input
        ref={ref}
        type="checkbox"
        name={name}
        value={value}
        checked={checked || false}
        onChange={handleChange}
      />
      <CheckboxWrap>
        {!!checked && (
          <CheckIcon
            src={getStaticUrl('/icons/check.svg')}
            alt="Tick the checkbox"
          />
        )}
      </CheckboxWrap>
    </label>
  )
}

export default React.memo(React.forwardRef(Checkbox))
