import React from 'react'
import styled from 'styled-components'
import Audio from './audio'
import { getAudioFileName } from '../utils/message-util'

const AudioStyled = styled(Audio)`
  margin-bottom: 10px;
`

const MessageAudio = ({ audio, timestamp }) => audio && (
  <AudioStyled
    src={audio}
    title={getAudioFileName(new Date(timestamp))}
  />
)

export default React.memo(MessageAudio)
