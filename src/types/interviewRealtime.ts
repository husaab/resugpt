/**
 * Types for the OpenAI Realtime Voice interview feature
 */

import type { SessionRound, Exchange, TimePressureConfig } from './interviewSession'

// ─── Connection & Phase States ──────────────────────────

export type RealtimeConnectionState =
  | 'idle'
  | 'requesting-mic'
  | 'mic-check'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

export type InterviewPhase =
  | 'loading'
  | 'mic-check'
  | 'connecting'
  | 'active'
  | 'round-ending'
  | 'between-rounds'
  | 'completed'
  | 'error'

// ─── API Response Types ─────────────────────────────────

export interface MintTokenResponse {
  success: boolean
  data: {
    ephemeralToken: string
    expiresAt: string
    currentRound: {
      roundNumber: number
      type: string
      title: string
      totalRounds: number
      questionCount: number
      timePressure?: TimePressureConfig | null
    }
  }
}

export interface EndRoundResponse {
  success: boolean
  data: {
    roundScore: {
      score: number
      strengths: string[]
      weaknesses: string[]
      feedback: string
    }
    hasNextRound: boolean
    nextRound?: {
      roundNumber: number
      type: string
      title: string
    }
    overallScore?: number
    recommendation?: string
    overallFeedback?: string
  }
}

export interface SaveTranscriptResponse {
  success: boolean
  message: string
}

// ─── Data Channel Event Types (from OpenAI Realtime API) ──

export interface TranscriptionDeltaEvent {
  type: 'conversation.item.input_audio_transcription.delta'
  item_id: string
  content_index: number
  delta: string
}

export interface TranscriptionEvent {
  type: 'conversation.item.input_audio_transcription.completed'
  item_id: string
  content_index: number
  transcript: string
}

export interface ResponseAudioTranscriptDelta {
  type: 'response.output_audio_transcript.delta'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  delta: string
}

export interface ResponseAudioTranscriptDone {
  type: 'response.output_audio_transcript.done'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  transcript: string
}

export interface FunctionCallEvent {
  type: 'response.function_call_arguments.done'
  response_id: string
  item_id: string
  output_index: number
  call_id: string
  name: string
  arguments: string
}

export interface SpeechStartedEvent {
  type: 'input_audio_buffer.speech_started'
  audio_start_ms: number
  item_id: string
}

export interface SpeechStoppedEvent {
  type: 'input_audio_buffer.speech_stopped'
  audio_end_ms: number
  item_id: string
}

export interface RealtimeErrorEvent {
  type: 'error'
  error: {
    type: string
    code: string
    message: string
  }
}

export type RealtimeDataChannelEvent =
  | TranscriptionDeltaEvent
  | TranscriptionEvent
  | ResponseAudioTranscriptDelta
  | ResponseAudioTranscriptDone
  | FunctionCallEvent
  | SpeechStartedEvent
  | SpeechStoppedEvent
  | RealtimeErrorEvent

// ─── Hook Return Types ──────────────────────────────────

export type CurrentSpeaker = 'interviewer' | 'candidate' | null

export interface UseRealtimeInterviewOptions {
  onEndRoundCalled?: (summary: string) => void
  onTranscriptUpdate?: (exchanges: Exchange[]) => void
}

export interface CodeContextSnapshot {
  code: string
  language: string
  isFirstSnapshot: boolean
}

export interface MediaStreams {
  camera?: MediaStream | null
  screen?: MediaStream | null
}

export interface StopRecordingResult {
  userAudio: Blob | null
  aiAudio: Blob | null
  cameraVideo: Blob | null
  screenVideo: Blob | null
}

export interface UseRealtimeInterviewReturn {
  connectionState: RealtimeConnectionState
  isMuted: boolean
  isCameraOff: boolean
  transcript: Exchange[]
  currentSpeaker: CurrentSpeaker
  aiPartialTranscript: string
  userPartialTranscript: string
  error: string | null
  cameraStreamRef: React.RefObject<MediaStream | null>
  connect: (token: string, streams?: MediaStreams) => Promise<void>
  disconnect: () => void
  toggleMute: () => void
  toggleCamera: () => void
  sendCodeContext: (snapshot: CodeContextSnapshot, triggerResponse?: boolean) => void
  stopRecording: () => Promise<StopRecordingResult>
  sendTimeAlert: (message: string) => void
}

export interface UseMicCheckReturn {
  hasMicPermission: boolean
  audioLevel: number
  isChecking: boolean
  error: string | null
  requestMic: () => Promise<void>
  stopMicCheck: () => void
}

export interface UseCameraCheckReturn {
  hasCameraPermission: boolean
  cameraStreamRef: React.RefObject<MediaStream | null>
  error: string | null
  isRequesting: boolean
  requestCamera: () => Promise<void>
  stopCameraCheck: () => void
}

export interface UseScreenCheckReturn {
  hasScreenPermission: boolean
  screenStreamRef: React.RefObject<MediaStream | null>
  error: string | null
  isRequesting: boolean
  isSupported: boolean
  requestScreen: () => Promise<void>
  stopScreenCheck: () => void
}

// ─── Re-exports for convenience ─────────────────────────

export type { SessionRound, Exchange }
