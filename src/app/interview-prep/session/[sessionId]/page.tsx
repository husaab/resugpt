'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { InterviewHeader } from '@/components/interview-session/InterviewHeader'
import { MicCheckPanel } from '@/components/interview-session/MicCheckPanel'
import { TranscriptPanel } from '@/components/interview-session/TranscriptPanel'
import { AudioControls } from '@/components/interview-session/AudioControls'
import { RoundScoreCard } from '@/components/interview-session/RoundScoreCard'
import { CodeEditorPanel, DEFAULT_CODE } from '@/components/interview-session/CodeEditorPanel'
import { useMicCheck } from '@/hooks/useMicCheck'
import { useRealtimeInterview } from '@/hooks/useRealtimeInterview'
import { useCodeExecution } from '@/hooks/useCodeExecution'
import {
  getInterviewSession,
  mintEphemeralToken,
  saveTranscript,
  endRound as endRoundApi,
} from '@/services/interviewSessionService'
import type { InterviewSession } from '@/types/interviewSession'
import type { InterviewPhase, EndRoundResponse } from '@/types/interviewRealtime'

const TRANSCRIPT_SAVE_INTERVAL = 30_000 // 30 seconds

export default function LiveInterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()

  // Core state
  const [phase, setPhase] = useState<InterviewPhase>('loading')
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Round tracking
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1)
  const [totalRounds, setTotalRounds] = useState(1)
  const [roundType, setRoundType] = useState('')
  const [roundTitle, setRoundTitle] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Score state (shown between rounds)
  const [roundResult, setRoundResult] = useState<EndRoundResponse['data'] | null>(null)

  // Code editor state (technical/coding rounds)
  const [code, setCode] = useState(DEFAULT_CODE.javascript)
  const [codeLanguage, setCodeLanguage] = useState('javascript')
  const [isOutputExpanded, setIsOutputExpanded] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptRef = useRef<{ role: 'interviewer' | 'candidate'; content: string; timestamp: string }[]>([])

  // Mic check
  const mic = useMicCheck()

  // Code execution (Piston API)
  const codeExec = useCodeExecution()

  // Realtime connection
  const realtime = useRealtimeInterview({
    onEndRoundCalled: (summary) => {
      handleEndRound()
    },
    onTranscriptUpdate: (exchanges) => {
      transcriptRef.current = exchanges
    },
  })

  const googleId = authSession?.user?.googleId
  const isCodingRound = ['technical', 'coding', 'live_coding'].includes(roundType)

  // ─── Transition to active once data channel is open ──

  useEffect(() => {
    if (phase === 'connecting' && realtime.connectionState === 'connected') {
      setPhase('active')
    }
  }, [phase, realtime.connectionState])

  // ─── Redirect if not authenticated ───────────────────

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/interview-prep')
    }
  }, [authStatus, router])

  // ─── Load session ────────────────────────────────────

  useEffect(() => {
    if (!googleId || !sessionId) return
    let cancelled = false

    const load = async () => {
      try {
        const res = await getInterviewSession(sessionId, googleId)
        if (cancelled) return

        if (!res.success) {
          setError('Failed to load session')
          setPhase('error')
          return
        }

        const s = res.data

        if (s.status === 'completed') {
          router.push(`/interview-prep/session/${sessionId}/results`)
          return
        }

        if (s.status !== 'in_progress') {
          setError('This session is no longer active')
          setPhase('error')
          return
        }

        setSession(s)
        setCurrentRoundNumber(s.currentRound)
        setTotalRounds(s.rounds.length)

        const currentRound = s.rounds[s.currentRound - 1]
        if (currentRound) {
          setRoundType(currentRound.type)
          setRoundTitle(currentRound.type.replace(/_/g, ' '))
        }

        setPhase('mic-check')
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load session')
        setPhase('error')
      }
    }

    load()
    return () => { cancelled = true }
  }, [googleId, sessionId, router])

  // ─── Timer ───────────────────────────────────────────

  useEffect(() => {
    if (phase === 'active') {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  // ─── Periodic transcript save ────────────────────────

  useEffect(() => {
    if (phase === 'active' && googleId) {
      saveIntervalRef.current = setInterval(() => {
        if (transcriptRef.current.length > 0) {
          saveTranscript(sessionId, googleId, currentRoundNumber, transcriptRef.current).catch(() => {
            // Non-critical — silently ignore save errors
          })
        }
      }, TRANSCRIPT_SAVE_INTERVAL)
    } else {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
        saveIntervalRef.current = null
      }
    }
    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current)
    }
  }, [phase, googleId, sessionId, currentRoundNumber])

  // ─── beforeunload warning ────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (phase === 'active' || phase === 'connecting') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  // ─── Immersive mode: hide navbar ─────────────────────

  useEffect(() => {
    document.body.classList.add('interview-immersive')
    return () => {
      document.body.classList.remove('interview-immersive')
    }
  }, [])

  // ─── Start interview (after mic check) ──────────────

  const handleStartInterview = useCallback(async () => {
    if (!googleId) return

    try {
      setPhase('connecting')
      mic.stopMicCheck()

      const tokenRes = await mintEphemeralToken(sessionId, googleId)

      if (!tokenRes.success) {
        setError('Failed to get interview token')
        setPhase('error')
        return
      }

      const { ephemeralToken, currentRound } = tokenRes.data
      setCurrentRoundNumber(currentRound.roundNumber)
      setTotalRounds(currentRound.totalRounds)
      setRoundType(currentRound.type)
      setRoundTitle(currentRound.title)

      await realtime.connect(ephemeralToken)
      // Phase transitions to 'active' via the connectionState effect below,
      // keeping the "Connecting..." spinner visible through ICE negotiation.
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start interview')
      setPhase('error')
    }
  }, [googleId, sessionId, mic, realtime])

  // ─── End round ──────────────────────────────────────

  const handleEndRound = useCallback(async () => {
    if (!googleId) return

    try {
      setPhase('round-ending')
      realtime.disconnect()

      const result = await endRoundApi(
        sessionId,
        googleId,
        currentRoundNumber,
        transcriptRef.current,
        elapsedSeconds,
        isCodingRound ? code : null,
        isCodingRound ? codeLanguage : null
      )

      if (!result.success) {
        setError('Failed to score round')
        setPhase('error')
        return
      }

      setRoundResult(result.data)

      if (result.data.hasNextRound) {
        setPhase('between-rounds')
      } else {
        setPhase('completed')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to end round')
      setPhase('error')
    }
  }, [googleId, sessionId, currentRoundNumber, elapsedSeconds, realtime, isCodingRound, code, codeLanguage])

  // ─── Next round ─────────────────────────────────────

  const handleNextRound = useCallback(async () => {
    if (!googleId || !roundResult?.nextRound) return

    try {
      setPhase('connecting')
      transcriptRef.current = []
      setCode(DEFAULT_CODE.javascript)
      setCodeLanguage('javascript')
      setIsOutputExpanded(false)

      const tokenRes = await mintEphemeralToken(sessionId, googleId)
      if (!tokenRes.success) {
        setError('Failed to get token for next round')
        setPhase('error')
        return
      }

      const { ephemeralToken, currentRound } = tokenRes.data
      setCurrentRoundNumber(currentRound.roundNumber)
      setRoundType(currentRound.type)
      setRoundTitle(currentRound.title)
      setRoundResult(null)

      await realtime.connect(ephemeralToken)
      // Phase transitions to 'active' via the connectionState effect.
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start next round')
      setPhase('error')
    }
  }, [googleId, sessionId, roundResult, realtime])

  // ─── Render ──────────────────────────────────────────

  // Loading
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-body)]">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-muted)]" />
          <div className="h-5 w-48 bg-[var(--bg-muted)] rounded mx-auto mb-2" />
          <div className="h-4 w-32 bg-[var(--bg-muted)] rounded mx-auto" />
        </div>
      </div>
    )
  }

  // Error
  if (phase === 'error') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-body)] px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error-light)] flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-[var(--error)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push('/interview-prep/history')}
            >
              Back to History
            </Button>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              <ArrowPathIcon className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Mic check
  if (phase === 'mic-check') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-body)] px-4">
        <MicCheckPanel
          hasMicPermission={mic.hasMicPermission}
          audioLevel={mic.audioLevel}
          error={mic.error}
          isConnecting={false}
          onRequestMic={mic.requestMic}
          onStartInterview={handleStartInterview}
        />
      </div>
    )
  }

  // Connecting
  if (phase === 'connecting') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-body)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 border-3 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Connecting to interviewer...</p>
        </motion.div>
      </div>
    )
  }

  // Between rounds — show score card
  if (phase === 'between-rounds' && roundResult) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-body)] px-4 overflow-y-auto py-8">
        <RoundScoreCard
          roundTitle={roundTitle}
          roundType={roundType}
          roundNumber={currentRoundNumber}
          score={roundResult.roundScore.score}
          strengths={roundResult.roundScore.strengths}
          weaknesses={roundResult.roundScore.weaknesses}
          feedback={roundResult.roundScore.feedback}
          hasNextRound={roundResult.hasNextRound}
          onNextRound={handleNextRound}
        />
      </div>
    )
  }

  // Completed — show final summary
  if (phase === 'completed' && roundResult) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-body)] px-4 overflow-y-auto py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Interview Complete
            </h2>

            {/* Last round score */}
            <div className="mb-4">
              <p className="text-sm text-[var(--text-tertiary)] mb-1">Final Round Score</p>
              <span
                className="text-4xl font-bold"
                style={{
                  color:
                    roundResult.roundScore.score >= 7
                      ? 'var(--success)'
                      : roundResult.roundScore.score >= 5
                        ? 'var(--warning)'
                        : 'var(--error)',
                }}
              >
                {roundResult.roundScore.score}/10
              </span>
            </div>

            {/* Overall score if available */}
            {roundResult.overallScore != null && (
              <div className="mb-4 p-4 bg-[var(--bg-muted)] rounded-xl">
                <p className="text-sm text-[var(--text-tertiary)] mb-1">Overall Score</p>
                <span
                  className="text-3xl font-bold"
                  style={{
                    color:
                      roundResult.overallScore >= 7
                        ? 'var(--success)'
                        : roundResult.overallScore >= 5
                          ? 'var(--warning)'
                          : 'var(--error)',
                  }}
                >
                  {roundResult.overallScore}/10
                </span>
                {roundResult.recommendation && (
                  <p className="text-sm text-[var(--text-secondary)] mt-1 capitalize">
                    {roundResult.recommendation.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push(`/interview-prep/session/${sessionId}/results`)}
            >
              View Full Results
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Active interview (also covers round-ending with overlay)
  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--bg-body)]">
      <InterviewHeader
        companyName={session?.company.name || ''}
        companyLogo={session?.company.logo || null}
        roleTitle={session?.role.title || ''}
        roundNumber={currentRoundNumber}
        totalRounds={totalRounds}
        roundType={roundType}
        roundTitle={roundTitle}
        elapsedSeconds={elapsedSeconds}
        isMuted={realtime.isMuted}
        connectionState={realtime.connectionState}
        isEndingRound={phase === 'round-ending'}
        onToggleMute={realtime.toggleMute}
        onEndRound={handleEndRound}
      />

      {isCodingRound ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-2/5 border-r border-[var(--border-color)]">
            <TranscriptPanel
              exchanges={realtime.transcript}
              aiPartialTranscript={realtime.aiPartialTranscript}
              currentSpeaker={realtime.currentSpeaker}
            />
          </div>
          <div className="w-3/5">
            <CodeEditorPanel
              language={codeLanguage}
              code={code}
              output={codeExec.output}
              isRunning={codeExec.isRunning}
              isOutputExpanded={isOutputExpanded}
              onCodeChange={setCode}
              onLanguageChange={setCodeLanguage}
              onRun={() => codeExec.runCode(codeLanguage, code)}
              onSubmit={() => {
                // Add code as a special exchange in the transcript
                transcriptRef.current = [
                  ...transcriptRef.current,
                  {
                    role: 'candidate',
                    content: `[Code Submitted — ${codeLanguage}]\n${code}`,
                    timestamp: new Date().toISOString(),
                  },
                ]
              }}
              onToggleOutput={() => setIsOutputExpanded((prev) => !prev)}
            />
          </div>
        </div>
      ) : (
        <TranscriptPanel
          exchanges={realtime.transcript}
          aiPartialTranscript={realtime.aiPartialTranscript}
          currentSpeaker={realtime.currentSpeaker}
        />
      )}

      <AudioControls
        isMuted={realtime.isMuted}
        connectionState={realtime.connectionState}
        currentSpeaker={realtime.currentSpeaker}
        onToggleMute={realtime.toggleMute}
      />

      {/* Scoring overlay */}
      {phase === 'round-ending' && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 border-3 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-medium">Scoring your round...</p>
          </motion.div>
        </div>
      )}
    </div>
  )
}
