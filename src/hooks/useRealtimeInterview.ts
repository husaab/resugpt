'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type {
  RealtimeConnectionState,
  CurrentSpeaker,
  UseRealtimeInterviewOptions,
  UseRealtimeInterviewReturn,
  RealtimeDataChannelEvent,
  CodeContextSnapshot,
  Exchange,
} from '@/types/interviewRealtime'

const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls'

export function useRealtimeInterview(
  options?: UseRealtimeInterviewOptions
): UseRealtimeInterviewReturn {
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<Exchange[]>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<CurrentSpeaker>(null)
  const [aiPartialTranscript, setAiPartialTranscript] = useState('')
  const [userPartialTranscript, setUserPartialTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Track partial text per item_id to handle streaming
  const aiPartialRef = useRef('')
  const userPartialRef = useRef('')

  const connect = useCallback(async (ephemeralToken: string) => {
    try {
      setConnectionState('connecting')
      setError(null)
      setTranscript([])
      setAiPartialTranscript('')
      setUserPartialTranscript('')
      aiPartialRef.current = ''
      userPartialRef.current = ''

      // 1. Create peer connection
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // 2. Set up remote audio playback
      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      audioElRef.current = audioEl

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0]
      }

      // 3. Add local audio track
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      // 4. Create data channel for events
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.onopen = () => {
        console.log('[Realtime] Data channel opened')
        setConnectionState('connected')

        // Prompt the model to start its greeting immediately.
        // Without this, the Realtime API waits for user speech (VAD) before responding.
        dc.send(JSON.stringify({ type: 'response.create' }))
        console.log('[Realtime] Sent response.create')
      }

      dc.onclose = () => {
        setConnectionState('disconnected')
      }

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as RealtimeDataChannelEvent
          console.log('[Realtime] Event:', event.type, event)
          handleDataChannelEvent(event)
        } catch {
          // Ignore unparseable events
        }
      }

      // 5. Create SDP offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 6. Send SDP offer to OpenAI Realtime GA endpoint
      const sdpResponse = await fetch(REALTIME_CALLS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      })

      if (!sdpResponse.ok) {
        const errBody = await sdpResponse.text()
        console.error('[Realtime] SDP negotiation failed:', sdpResponse.status, errBody)
        throw new Error(`WebRTC negotiation failed: ${sdpResponse.status}`)
      }

      console.log('[Realtime] SDP exchange successful')
      const answerSdp = await sdpResponse.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('[Realtime] Connection state:', pc.connectionState)
        switch (pc.connectionState) {
          case 'connected':
            setConnectionState('connected')
            break
          case 'disconnected':
          case 'failed':
            setConnectionState('disconnected')
            break
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect'
      setError(message)
      setConnectionState('error')
    }
  }, [])

  const handleDataChannelEvent = useCallback((event: RealtimeDataChannelEvent) => {
    switch (event.type) {
      // User's speech streaming (real-time partial transcript)
      case 'conversation.item.input_audio_transcription.delta': {
        userPartialRef.current += event.delta
        setUserPartialTranscript(userPartialRef.current)
        break
      }

      // User's speech transcribed (final)
      case 'conversation.item.input_audio_transcription.completed': {
        if (event.transcript?.trim()) {
          const exchange: Exchange = {
            role: 'candidate',
            content: event.transcript.trim(),
            timestamp: new Date().toISOString(),
          }
          setTranscript((prev) => {
            const next = [...prev, exchange]
            optionsRef.current?.onTranscriptUpdate?.(next)
            return next
          })
        }
        userPartialRef.current = ''
        setUserPartialTranscript('')
        break
      }

      // AI response streaming (GA event name)
      case 'response.output_audio_transcript.delta': {
        aiPartialRef.current += event.delta
        setAiPartialTranscript(aiPartialRef.current)
        setCurrentSpeaker('interviewer')
        break
      }

      // AI response complete (GA event name)
      case 'response.output_audio_transcript.done': {
        if (event.transcript?.trim()) {
          const exchange: Exchange = {
            role: 'interviewer',
            content: event.transcript.trim(),
            timestamp: new Date().toISOString(),
          }
          setTranscript((prev) => {
            const next = [...prev, exchange]
            optionsRef.current?.onTranscriptUpdate?.(next)
            return next
          })
        }
        aiPartialRef.current = ''
        setAiPartialTranscript('')
        setCurrentSpeaker(null)
        break
      }

      // Function call (e.g., end_round)
      case 'response.function_call_arguments.done': {
        if (event.name === 'end_round') {
          let summary = ''
          try {
            const args = JSON.parse(event.arguments)
            summary = args.summary || ''
          } catch {
            // ignore parse error
          }

          // Acknowledge the function call so the model knows it was handled
          const ackEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: event.call_id,
              output: JSON.stringify({ status: 'acknowledged' }),
            },
          }
          dcRef.current?.send(JSON.stringify(ackEvent))

          optionsRef.current?.onEndRoundCalled?.(summary)
        }
        break
      }

      // User starts speaking
      case 'input_audio_buffer.speech_started': {
        setCurrentSpeaker('candidate')
        break
      }

      // User stops speaking
      case 'input_audio_buffer.speech_stopped': {
        setCurrentSpeaker(null)
        break
      }

      // Error from the realtime session
      case 'error': {
        console.error('[Realtime] ERROR details:', JSON.stringify(event, null, 2))
        setError(event.error?.message || 'Realtime session error')
        break
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    if (dcRef.current) {
      dcRef.current.close()
      dcRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null
      audioElRef.current = null
    }
    setConnectionState('disconnected')
    setCurrentSpeaker(null)
    setAiPartialTranscript('')
    setUserPartialTranscript('')
    aiPartialRef.current = ''
    userPartialRef.current = ''
  }, [])

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return

    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) return

    audioTrack.enabled = !audioTrack.enabled
    setIsMuted(!audioTrack.enabled)
  }, [])

  const sendCodeContext = useCallback((snapshot: CodeContextSnapshot) => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') return

    // Truncate very long code to avoid hitting token limits
    const MAX_CODE_LENGTH = 15_000
    let codeText = snapshot.code
    if (codeText.length > MAX_CODE_LENGTH) {
      codeText = codeText.slice(0, MAX_CODE_LENGTH) + '\n// ... (code truncated)'
    }

    const preamble = snapshot.isFirstSnapshot
      ? `[CODE UPDATE] The candidate's current code (${snapshot.language}):`
      : `[CODE UPDATE] The candidate has updated their code (${snapshot.language}):`

    dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: `${preamble}\n\`\`\`${snapshot.language}\n${codeText}\n\`\`\`` }],
      },
    }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dcRef.current?.close()
      pcRef.current?.close()
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      if (audioElRef.current) audioElRef.current.srcObject = null
    }
  }, [])

  return {
    connectionState,
    isMuted,
    transcript,
    currentSpeaker,
    aiPartialTranscript,
    userPartialTranscript,
    error,
    connect,
    disconnect,
    toggleMute,
    sendCodeContext,
  }
}
