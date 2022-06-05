import React, { useCallback } from 'react'
import styled from 'styled-components'
import Audio from './audio'
import { inputBackground } from './color'
import { getStaticUrl } from '../utils/common-util'
import { getAudioFileName } from '../utils/message-util'

const AudioWrap = styled.div`
  flex: 0 0 100%;
  font-size: 0;
`

const AudioInner = styled.div`
  ${inputBackground}
  width: calc(100% - 70px);
  padding: 10px 10px 0 11px;
  box-sizing: border-box;
`

const AudioStyled = styled(Audio)`
  display: inline-block;
`

const RemoveIcon = styled.img`
  ${inputBackground}
  width: 16px;
  height: 16px;
  padding: 2px 4px 2px 10px;
  vertical-align: top;
  cursor: pointer;
`

const MessageInputAudio = ({ audio, setAudio }) => {
  const handleRemoveAudio = useCallback(() => {
    setAudio(null)
  }, [setAudio])

  return audio && (
    <AudioWrap>
      <AudioInner>
        <AudioStyled
          src={audio}
          title={getAudioFileName(new Date())}
          variant="input"
        />
        <RemoveIcon
          src={getStaticUrl('/icons/xmark.svg')}
          title="Remove the audio message"
          onClick={handleRemoveAudio}
        />
      </AudioInner>
    </AudioWrap>
  )
}

export default React.memo(MessageInputAudio)
