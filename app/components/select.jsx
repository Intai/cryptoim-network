import styled from 'styled-components'
import { inputBackground } from './color'
import { fontSans, fontNormal } from './typography'

const Select = styled.select`
  ${inputBackground}
  ${fontSans}
  ${fontNormal}
  display: block;
  border: 0;
  outline: 0;
  padding: 10px 35px 10px 10px;
  margin: 0 0 15px;
  width: 270px;
  max-width: calc(100vw - 30px);
  box-sizing: border-box;

  -webkit-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, gray 50%), linear-gradient(135deg, gray 50%, transparent 50%), linear-gradient(to right, #ccc, #ccc);
  background-position: calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px), calc(100% - 2.5em) 0.5em;
  background-size: 5px 5px, 5px 5px, 1px 1.5em;
  background-repeat: no-repeat;
`

export default Select
