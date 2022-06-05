import { inc } from 'ramda'
import React, { useCallback, useRef, useState } from 'react'
import styled from 'styled-components'
import { fontSmall } from './typography'
import { inputBackground } from './color'
import { canUseUserMedia, getStaticUrl } from '../utils/common-util'

const AudioWrap = styled.div`
  font-size: 0;
`

const PlayIcon = styled.img`
  height: 20px;
  width: 15px;
  margin-right: 5px;
  cursor: pointer;
  transition: transform linear 100ms;

  &:hover {
    transform: scale(1.3);
  }
`

const PauseIcon = styled.img`
  height: 20px;
  width: 15px;
  margin-right: 5px;
  cursor: pointer;
  transition: transform linear 100ms;

  &:hover {
    transform: scale(1.3);
  }
`

const WaveformIcon = styled.img`
  height: 30px;
  margin: -5px -4px -5px 0;
  opacity: 0.5;
`

const InfoIcon = styled.img`
  height: 16px;
  width: 16px;
`

const InfoTooltip = styled.div`
  ${fontSmall}
  ${inputBackground}
  color: #000;
  position: absolute;
  top: -2px;
  right: -60px;
  display: none;
  white-space: pre-wrap;
  padding: 10px;
  width: 152px;
  box-sizing: border-box;
  pointer-events: none;
`

const InfoContainer = styled.div`
  display: inline-block;
  vertical-align: top;
  margin: 2px 45px 0 9px;
  position: relative;

  &:hover >${InfoTooltip} {
    display: block;
  }
`

const getIconVariant = (variant) => (
  variant === 'input'
    ? '-dark'
    : ''
)

const isPlaying = ({ current: audio }) => (
  audio && !audio.paused && !audio.ended
)

const Audio = ({
  src,
  title,
  variant,
  className,
}) => {
  const iconVariant = getIconVariant(variant)
  const [, forceUpdate] = useState(0)
  const audioRef = useRef()

  const handlePlay = useCallback(() => {
    const { current: audio } = audioRef
    audio?.play()
  }, [])

  const handleStop = useCallback(() => {
    const { current: audio } = audioRef
    audio?.pause()
  }, [])

  const handleUpdate = useCallback(() => {
    forceUpdate(inc)
  }, [])

  if (!canUseUserMedia()) {
    return (
      <AudioWrap className={className}>
        <WaveformIcon src={getStaticUrl(`/icons/waveform${iconVariant}.svg`)} />
        <WaveformIcon src={getStaticUrl(`/icons/waveform${iconVariant}.svg`)} />

        <InfoContainer>
          <InfoIcon
            src={getStaticUrl('/icons/circle-info.svg')}
            alt="Audio message is not supported"
          />
          <InfoTooltip>
            {'Audio message is not supported on this device'}
          </InfoTooltip>
        </InfoContainer>
      </AudioWrap>
    )
  }

  return (
    <AudioWrap className={className}>
      <audio
        ref={audioRef}
        src={src}
        title={title}
        onPlay={handleUpdate}
        onPause={handleUpdate}
        onEnded={handleUpdate}
      />
      {isPlaying(audioRef)
        ? (
          <PauseIcon
            src={getStaticUrl(`/icons/pause${iconVariant}.svg`)}
            title="Pause the audio message"
            onClick={handleStop}
          />
        ) : (
          <PlayIcon
            src={getStaticUrl(`/icons/play${iconVariant}.svg`)}
            title="Play the audio message"
            onClick={handlePlay}
          />
        )
      }
      <WaveformIcon src={getStaticUrl(`/icons/waveform${iconVariant}.svg`)} />
      <WaveformIcon src={getStaticUrl(`/icons/waveform${iconVariant}.svg`)} />
    </AudioWrap>
  )
}

export default React.memo(Audio)
