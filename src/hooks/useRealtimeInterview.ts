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

  // Audio recording refs
  const userRecorderRef = useRef<MediaRecorder | null>(null)
  const aiRecorderRef = useRef<MediaRecorder | null>(null)
  const userChunksRef = useRef<Blob[]>([])
  const aiChunksRef = useRef<Blob[]>([])

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

      // 2. Set up remote audio playback + recording
      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      audioElRef.current = audioEl

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0]

        // Start recording AI audio
        try {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
              ? 'audio/webm'
              : ''

          if (mimeType) {
            const aiRecorder = new MediaRecorder(e.streams[0], { mimeType })
            aiChunksRef.current = []
            aiRecorder.ondataavailable = (ev) => {
              if (ev.data.size > 0) aiChunksRef.current.push(ev.data)
            }
            aiRecorder.onerror = (ev) => console.warn('[Audio] AI recorder error:', ev)
            aiRecorder.start(1000)
            aiRecorderRef.current = aiRecorder
            console.info('[Audio] AI recorder started, mimeType:', mimeType)
          } else {
            console.warn('[Audio] No supported mimeType for AI audio recording')
          }
        } catch (err) {
          console.warn('[Audio] Failed to start AI recorder:', err)
        }
      }

      // 3. Add local audio track + start recording user audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : ''

        if (mimeType) {
          const userRecorder = new MediaRecorder(stream, { mimeType })
          userChunksRef.current = []
          userRecorder.ondataavailable = (ev) => {
            if (ev.data.size > 0) userChunksRef.current.push(ev.data)
          }
          userRecorder.onerror = (ev) => console.warn('[Audio] User recorder error:', ev)
          userRecorder.start(1000)
          userRecorderRef.current = userRecorder
          console.info('[Audio] User recorder started, mimeType:', mimeType)
        } else {
          console.warn('[Audio] No supported mimeType for user audio recording')
        }
      } catch (err) {
        console.warn('[Audio] Failed to start user recorder:', err)
      }

      // 4. Create data channel for events
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.onopen = () => {
        setConnectionState('connected')

        // Prompt the model to start its greeting immediately.
        // Without this, the Realtime API waits for user speech (VAD) before responding.
        dc.send(JSON.stringify({ type: 'response.create' }))
      }

      dc.onclose = () => {
        setConnectionState('disconnected')
      }

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as RealtimeDataChannelEvent
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
        throw new Error(`WebRTC negotiation failed: ${sdpResponse.status}`)
      }

      const answerSdp = await sdpResponse.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
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
        setError(event.error?.message || 'Realtime session error')
        break
      }
    }
  }, [])

  /**
   * Stop audio recorders and return the accumulated blobs.
   * Must be called BEFORE disconnect() to capture the final audio chunks.
   */
  const stopRecording = useCallback((): Promise<{
    userAudio: Blob | null
    aiAudio: Blob | null
  }> => {
    console.info('[Audio] stopRecording called. User recorder state:', userRecorderRef.current?.state ?? 'null',
      '| AI recorder state:', aiRecorderRef.current?.state ?? 'null',
      '| User chunks:', userChunksRef.current.length,
      '| AI chunks:', aiChunksRef.current.length)

    return new Promise((resolve) => {
      let pending = 0
      const tryResolve = () => {
        if (--pending <= 0) {
          const userAudio = userChunksRef.current.length
            ? new Blob(userChunksRef.current, { type: 'audio/webm' })
            : null
          const aiAudio = aiChunksRef.current.length
            ? new Blob(aiChunksRef.current, { type: 'audio/webm' })
            : null

          console.info('[Audio] Recording stopped. User blob:',
            userAudio ? `${(userAudio.size / 1024).toFixed(1)}KB` : 'null',
            '| AI blob:',
            aiAudio ? `${(aiAudio.size / 1024).toFixed(1)}KB` : 'null')

          resolve({ userAudio, aiAudio })
        }
      }

      if (userRecorderRef.current?.state === 'recording') {
        pending++
        userRecorderRef.current.onstop = tryResolve
        userRecorderRef.current.stop()
      }
      if (aiRecorderRef.current?.state === 'recording') {
        pending++
        aiRecorderRef.current.onstop = tryResolve
        aiRecorderRef.current.stop()
      }
      // If neither was recording, resolve immediately
      if (pending === 0) {
        console.warn('[Audio] Neither recorder was in recording state — no audio captured')
        resolve({ userAudio: null, aiAudio: null })
      }
    })
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
    // Clear recorder refs
    userRecorderRef.current = null
    aiRecorderRef.current = null
    userChunksRef.current = []
    aiChunksRef.current = []

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

  const sendCodeContext = useCallback((snapshot: CodeContextSnapshot, triggerResponse = false) => {
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

    // Nudge the AI to respond to the code update — without this,
    // semantic_vad never triggers on text-only conversation items.
    if (triggerResponse) {
      dc.send(JSON.stringify({ type: 'response.create' }))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recorders if still running
      if (userRecorderRef.current?.state === 'recording') {
        userRecorderRef.current.stop()
      }
      if (aiRecorderRef.current?.state === 'recording') {
        aiRecorderRef.current.stop()
      }
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
    stopRecording,
  }
}
