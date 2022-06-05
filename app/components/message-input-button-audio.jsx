import { inc } from 'ramda'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import RootPortal from './root-portal'
import Button from './button'
import { fontSans, fontBold } from './typography'
import { primaryBackground, inputBackground } from './color'
import { canUseUserMedia, getStaticUrl } from '../utils/common-util'

const AudioWrap = styled.div`
  ${inputBackground}
  flex: 0 0 auto;
  margin: 0 0 30px 0;
  display: flex;
  align-items: end;
`

const AudioIcon = styled.img`
  height: 18px;
  padding: 12px 10px 12px 10px;
  transition: transform linear 100ms;
  vertical-align: top;
  cursor: pointer;

  &:hover {
    transform: scale(1.3);
  }
`

const Modal = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  justify-content: center;
  align-items: center;
`

const Recording = styled.div`
  ${fontSans}
  ${primaryBackground}
  max-width: 100vw;
  width: 300px;
  padding: 15px 15px 0 15px;
  box-sizing: border-box;
`

const Countdown = styled.div`
  position: relative;
  font-size: 100px;
  text-align: center;
  margin-bottom: -5px;
`

const opacityAnimation = keyframes`
  0%, 100%  { opacity: 0.1; }
  50% { opacity: 0.5; }
`

const CountdownIcon = styled.img`
  position: absolute;
  top: -5px;
  left: 0;
  height: 70px;
  opacity: 0.1;
  animation: ${opacityAnimation} 3s infinite;
`

const CountdownNumber = styled.span`
  ${fontBold}
`

const CountdownUnit = styled.span`
  font-size: 70px;
`

const StopButton = styled(Button)`
  margin-top: 25px;
  max-width: 100%;
`

const createRecorder = () => {
  let mediaStream
  let mediaRecorder

  return {
    start: async () => {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(mediaStream)

      return new Promise(resolve => {
        const audioChunks = []
        const handleData = event => {
          // accumulate audio chunks.
          audioChunks.push(event.data)
        }

        const handleStop = () => {
          // create blob from the audio chunks.
          const blob = new Blob(audioChunks, { type : 'audio/mp4;codecs="mp4a.ad"' })
          // generate data url for the blob.
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)

          // clean up event handlers.
          mediaRecorder.removeEventListener('dataavailable', handleData)
          mediaRecorder.removeEventListener('stop', handleStop)
        }

        // start recording.
        mediaRecorder.addEventListener('dataavailable', handleData)
        mediaRecorder.addEventListener('stop', handleStop)
        mediaRecorder.start()
      })
    },
    stop: () => {
      try {
        mediaRecorder?.stop()
        mediaStream?.getAudioTracks().forEach(track => track.stop())
      } catch (e) {
        // doesn't matter if already stopped.
      }
    },
  }
}

const getCountdown = startTimestamp => (
  startTimestamp > 0
    ? 20 - parseInt((Date.now() - startTimestamp) / 1000, 10)
    : 0
)

const MessageInputButtonAudio = ({ setAudio, textAreaRef }) => {
  const recorder = useMemo(() => createRecorder(), [])
  const [error, setError] = useState()
  const [startTimestamp, setStartTimestamp] = useState(0)
  const countdown = getCountdown(startTimestamp)
  const [, forceUpdate] = useState(0)
  const interval = useRef()

  const handleStart = useCallback(() => {
    // start recording.
    recorder.start()
      // return data url when stopped.
      .then(setAudio)
      // permission declined.
      .catch(setError)

    // start counting down.
    setStartTimestamp(Date.now())
    clearInterval(interval.current)
    interval.current = setInterval(() => {
      forceUpdate(inc)
    }, 1000)
  }, [recorder, setAudio])

  const handleStop = useCallback(() => {
    // finish recording.
    recorder.stop()
    // continue typing the text message.
    textAreaRef.current?.focus()

    // close the modal.
    setStartTimestamp(0)
    clearInterval(interval.current)
  }, [recorder, textAreaRef])

  useEffect(() => {
    // stop at the end of countdown.
    if (countdown < 0) {
      handleStop()
    }
  }, [countdown, handleStop])

  return canUseUserMedia() && (
    <AudioWrap>
      <AudioIcon
        src={getStaticUrl('/icons/microphone.svg')}
        title="Attach audio message"
        onClick={handleStart}
      />
      {startTimestamp > 0 && (
        <RootPortal>
          <Modal>
            <Recording>
              {error && 'Please grant permission to access microphone.'}
              {!error && (
                <Countdown>
                  <CountdownIcon src={getStaticUrl('/icons/waveform.svg')} />
                  <CountdownNumber>{Math.max(countdown, 0)}</CountdownNumber>
                  <CountdownUnit>s</CountdownUnit>
                </Countdown>
              )}

              <StopButton
                type="button"
                kind="secondary"
                onClick={handleStop}
              >
                {error ? 'Close' : 'Finish'}
              </StopButton>
            </Recording>
          </Modal>
        </RootPortal>
      )}
    </AudioWrap>
  )
}

export default React.memo(MessageInputButtonAudio)
