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
import { InterviewNavbar } from '@/components/interview-session/InterviewNavbar'
import { MediaCheckPanel } from '@/components/interview-session/MediaCheckPanel'
import { TranscriptPanel } from '@/components/interview-session/TranscriptPanel'
import { AudioControls } from '@/components/interview-session/AudioControls'
import { RoundScoreCard } from '@/components/interview-session/RoundScoreCard'
import { CodeEditorPanel, DEFAULT_CODE } from '@/components/interview-session/CodeEditorPanel'
import { CodingInterviewLayout } from '@/components/interview-session/CodingInterviewLayout'
import { TimePressureToast } from '@/components/interview-session/TimePressureToast'
import { InterviewerOrb } from '@/components/interview-session/InterviewerOrb'
import { CameraPreview } from '@/components/interview-session/CameraPreview'
import type { TimePressureAlert, TimePressureAlertLevel } from '@/components/interview-session/TimePressureToast'
import { useMicCheck } from '@/hooks/useMicCheck'
import { useCameraCheck } from '@/hooks/useCameraCheck'
import { useScreenCheck } from '@/hooks/useScreenCheck'
import { useRealtimeInterview } from '@/hooks/useRealtimeInterview'
import { useCodeObserver } from '@/hooks/useCodeObserver'
import { useCodeExecution } from '@/hooks/useCodeExecution'
import { useTestRunner } from '@/hooks/useTestRunner'
import {
  getInterviewSession,
  mintEphemeralToken,
  saveTranscript,
  endRound as endRoundApi,
  saveCodeSnapshots,
  uploadRoundAudio,
} from '@/services/interviewSessionService'
import type { InterviewSession, TimePressureConfig } from '@/types/interviewSession'
import type { InterviewPhase, EndRoundResponse, CodeContextSnapshot } from '@/types/interviewRealtime'
import type { CodingProblemFrontend } from '@/types/codingProblem'

const TRANSCRIPT_SAVE_INTERVAL = 30_000 // 30 seconds
const CODE_RESPONSE_INTERVAL_MS = 45_000 // 45 seconds between proactive AI comments on code

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

  // Time pressure
  const [timePressure, setTimePressure] = useState<TimePressureConfig | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isGracePeriod, setIsGracePeriod] = useState(false)
  const questionTimeAlertSentRef = useRef(false)
  const roundWarningRef = useRef(false)
  const autoEndFiredRef = useRef(false)
  const questionWarningSentRef = useRef(false)
  const questionAlertResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Time pressure toasts
  const [timePressureAlerts, setTimePressureAlerts] = useState<TimePressureAlert[]>([])
  const alertIdRef = useRef(0)
  const pushAlert = useCallback((message: string, level: TimePressureAlertLevel) => {
    const id = ++alertIdRef.current
    setTimePressureAlerts((prev) => [...prev, { id, message, level }])
  }, [])
  const dismissAlert = useCallback((id: number) => {
    setTimePressureAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // Score state (shown between rounds)
  const [roundResult, setRoundResult] = useState<EndRoundResponse['data'] | null>(null)

  // Code editor state (technical/coding rounds)
  const [code, setCode] = useState(DEFAULT_CODE.python)
  const [codeLanguage, setCodeLanguage] = useState('python')
  const [isOutputExpanded, setIsOutputExpanded] = useState(false)

  // Coding problem state (CodeSignal-style rounds)
  const [codingProblem, setCodingProblem] = useState<CodingProblemFrontend | null>(null)
  const [lastSubmitResults, setLastSubmitResults] = useState<{ passed: number; total: number } | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptRef = useRef<{ role: 'interviewer' | 'candidate'; content: string; timestamp: string }[]>([])
  const lastCodeResponseTriggerRef = useRef<number>(0)
  const pendingSnapshotRef = useRef<CodeContextSnapshot | null>(null)
  const snapshotQueueRef = useRef<Array<{ code: string; language: string; capturedAt: string }>>([])

  const googleId = authSession?.user?.googleId
  const isCodingRound = ['technical', 'coding', 'live_coding'].includes(roundType)
  const hasCodingProblem = codingProblem !== null
  const isTimePressured = timePressure?.enabled === true
  const displaySeconds = isTimePressured
    ? Math.max(0, timePressure.roundDurationSeconds - elapsedSeconds)
    : elapsedSeconds
  const perQuestionSeconds = isTimePressured && questionCount > 0
    ? Math.floor(timePressure.roundDurationSeconds / questionCount)
    : null

  // Camera & screen enabled toggles
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [screenEnabled, setScreenEnabled] = useState(true)

  // Mic check
  const mic = useMicCheck()

  // Camera check
  const camera = useCameraCheck()

  // Screen check
  const screenCheck = useScreenCheck()

  // Code execution (Piston API — for free-form coding rounds without structured problems)
  const codeExec = useCodeExecution()

  // Test runner (for CodeSignal-style rounds with structured problems)
  const testRunner = useTestRunner({
    sessionId,
    googleId: googleId || '',
    roundNumber: currentRoundNumber,
  })

  // Realtime connection
  const realtime = useRealtimeInterview({
    onEndRoundCalled: () => {
      handleEndRound()
    },
    onTranscriptUpdate: (exchanges) => {
      transcriptRef.current = exchanges
    },
  })

  // Code observer — sends code snapshots to the AI during coding rounds
  const sendSnapshot = useCallback((snapshot: CodeContextSnapshot) => {
    const now = Date.now()
    const elapsed = now - lastCodeResponseTriggerRef.current
    const shouldTrigger = snapshot.isFirstSnapshot || elapsed >= CODE_RESPONSE_INTERVAL_MS

    realtime.sendCodeContext(snapshot, shouldTrigger)
    if (shouldTrigger) lastCodeResponseTriggerRef.current = now
  }, [realtime])

  const handleCodeSnapshot = useCallback((snapshot: CodeContextSnapshot) => {
    // Queue snapshot for persistence (saved at round end)
    snapshotQueueRef.current.push({
      code: snapshot.code,
      language: snapshot.language,
      capturedAt: new Date().toISOString(),
    })

    if (realtime.currentSpeaker !== null) {
      pendingSnapshotRef.current = snapshot // queue instead of dropping
      return
    }
    sendSnapshot(snapshot)
  }, [realtime.currentSpeaker, sendSnapshot])

  // Flush queued snapshot when speaking stops
  useEffect(() => {
    if (realtime.currentSpeaker === null && pendingSnapshotRef.current) {
      const snapshot = pendingSnapshotRef.current
      pendingSnapshotRef.current = null
      sendSnapshot(snapshot)
    }
  }, [realtime.currentSpeaker, sendSnapshot])

  useCodeObserver({
    code,
    language: codeLanguage,
    enabled: phase === 'active' && isCodingRound,
    onCodeSnapshot: handleCodeSnapshot,
    debounceMs: 6000,
    starterCode: codingProblem?.starterCode?.[codeLanguage] || DEFAULT_CODE[codeLanguage],
  })

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

          // Load coding problem if present
          if (currentRound.codingProblem) {
            setCodingProblem(currentRound.codingProblem)
            // Set starter code for the default language (Python)
            const starterCode = currentRound.codingProblem.starterCode
            if (starterCode?.python) {
              setCode(starterCode.python)
              setCodeLanguage('python')
            }
          }
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
      setIsGracePeriod(false)
      questionTimeAlertSentRef.current = false
      questionWarningSentRef.current = false
      roundWarningRef.current = false
      autoEndFiredRef.current = false
      setTimePressureAlerts([])
      if (questionAlertResetTimerRef.current) {
        clearTimeout(questionAlertResetTimerRef.current)
        questionAlertResetTimerRef.current = null
      }
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
      if (phase === 'active' || phase === 'connecting' || phase === 'round-ending') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  // ─── Immersive mode: hide root navbar ────────────────

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

      // Capture time pressure config
      if (currentRound.timePressure?.enabled) {
        setTimePressure(currentRound.timePressure)
        setQuestionCount(currentRound.questionCount)
        setCurrentQuestionIndex(0)
      } else {
        setTimePressure(null)
      }

      // Pass camera/screen streams to the realtime hook for recording
      const streams = {
        camera: cameraEnabled ? camera.cameraStreamRef.current : null,
        screen: screenEnabled ? screenCheck.screenStreamRef.current : null,
      }

      await realtime.connect(ephemeralToken, streams)
      // Phase transitions to 'active' via the connectionState effect below,
      // keeping the "Connecting..." spinner visible through ICE negotiation.
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start interview')
      setPhase('error')
    }
  }, [googleId, sessionId, mic, camera, screenCheck, cameraEnabled, screenEnabled, realtime])

  // ─── End round ──────────────────────────────────────

  const handleEndRound = useCallback(async (testResultsOverride?: { passed: number; total: number } | null) => {
    if (!googleId) return

    try {
      setPhase('round-ending')

      // Stop audio recording BEFORE disconnecting (captures final chunks)
      const audioBlobs = await realtime.stopRecording()
      realtime.disconnect()

      const result = await endRoundApi(
        sessionId,
        googleId,
        currentRoundNumber,
        transcriptRef.current,
        elapsedSeconds,
        isCodingRound ? code : null,
        isCodingRound ? codeLanguage : null,
        testResultsOverride !== undefined ? testResultsOverride : lastSubmitResults
      )

      if (!result.success) {
        setError('Failed to score round')
        setPhase('error')
        return
      }

      // Upload audio/video recordings (non-critical, fire-and-forget)
      if (audioBlobs.userAudio || audioBlobs.aiAudio || audioBlobs.cameraVideo || audioBlobs.screenVideo) {
        console.info('[Media] Uploading — user audio:', audioBlobs.userAudio?.size, 'bytes, ai audio:', audioBlobs.aiAudio?.size,
          'bytes, camera:', audioBlobs.cameraVideo?.size, 'bytes, screen:', audioBlobs.screenVideo?.size, 'bytes')
        uploadRoundAudio(sessionId, googleId, currentRoundNumber, audioBlobs.userAudio, audioBlobs.aiAudio, audioBlobs.cameraVideo, audioBlobs.screenVideo)
          .then((res) => console.info('[Media] Upload result:', res))
          .catch((err) => console.error('[Media] Upload failed:', err))
      } else {
        console.warn('[Media] No media blobs to upload')
      }

      // Save code snapshots (non-critical, fire-and-forget)
      if (snapshotQueueRef.current.length > 0) {
        const snapshots = [...snapshotQueueRef.current]
        snapshotQueueRef.current = []
        saveCodeSnapshots(sessionId, googleId, currentRoundNumber, snapshots)
          .catch(() => {})
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
  }, [googleId, sessionId, currentRoundNumber, elapsedSeconds, realtime, isCodingRound, code, codeLanguage, lastSubmitResults])

  // ─── Time pressure triggers ────────────────────────

  useEffect(() => {
    if (!isTimePressured || phase !== 'active' || !timePressure) return

    const totalAllowed = timePressure.roundDurationSeconds
    const graceEnd = totalAllowed + timePressure.graceSeconds

    // Per-question time alert
    if (perQuestionSeconds && questionCount > 0) {
      const currentQuestionDeadline = perQuestionSeconds * (currentQuestionIndex + 1)
      const questionWarningPoint = perQuestionSeconds * currentQuestionIndex + Math.floor(perQuestionSeconds * 0.75)

      // Warn when 75% of question time has passed (only if question is long enough)
      if (perQuestionSeconds >= 20 && elapsedSeconds >= questionWarningPoint && elapsedSeconds < currentQuestionDeadline && !questionWarningSentRef.current) {
        questionWarningSentRef.current = true
        const secsLeft = currentQuestionDeadline - elapsedSeconds
        pushAlert(`${secsLeft}s left on this question`, 'warning')
      }

      if (elapsedSeconds >= currentQuestionDeadline && !questionTimeAlertSentRef.current) {
        questionTimeAlertSentRef.current = true

        if (currentQuestionIndex < questionCount - 1) {
          realtime.sendTimeAlert(
            `[TIME ALERT] The candidate's time for question ${currentQuestionIndex + 1} is up. Say something like "Sorry, we're short on time here — let's skip to the next question" and immediately ask question ${currentQuestionIndex + 2}.`
          )
          pushAlert(`Moving to question ${currentQuestionIndex + 2} of ${questionCount}`, 'info')
          setCurrentQuestionIndex((prev) => prev + 1)
          // Reset for next question (tracked ref to clear on unmount)
          if (questionAlertResetTimerRef.current) clearTimeout(questionAlertResetTimerRef.current)
          questionAlertResetTimerRef.current = setTimeout(() => {
            questionTimeAlertSentRef.current = false
            questionWarningSentRef.current = false
          }, 1000)
        }
      }
    }

    // Round warning at 30 seconds before expiry (only if round is long enough and on last question or past all questions)
    const warningThreshold = Math.max(0, totalAllowed - 30)
    const onLastQuestionOrPast = !perQuestionSeconds || currentQuestionIndex >= questionCount - 1
    if (warningThreshold > 0 && onLastQuestionOrPast && elapsedSeconds >= warningThreshold && elapsedSeconds < totalAllowed && !roundWarningRef.current) {
      roundWarningRef.current = true
      realtime.sendTimeAlert(
        '[TIME ALERT] Only 30 seconds remain in this round. Start wrapping up — ask one final quick follow-up or begin your closing remarks. Do NOT call end_round yet.'
      )
      pushAlert('Hurry up! 30 seconds left', 'warning')
    }

    // Round expiry: enter grace period
    if (elapsedSeconds >= totalAllowed && !isGracePeriod) {
      setIsGracePeriod(true)
      realtime.sendTimeAlert(
        '[TIME ALERT] Time is up for this round. The system will end the round automatically in 30 seconds. Say a brief closing remark like "Alright, that\'s all the time we have — thanks for your answers." Do NOT call end_round — the system handles it.'
      )
      pushAlert("Time's up!", 'critical')
    }

    // Grace period expired: auto-end (guarded to fire only once)
    if (elapsedSeconds >= graceEnd && !autoEndFiredRef.current) {
      autoEndFiredRef.current = true
      handleEndRound()
    }
  }, [elapsedSeconds, isTimePressured, phase, timePressure, perQuestionSeconds, questionCount, currentQuestionIndex, isGracePeriod, realtime, handleEndRound, pushAlert])

  // ─── Next round ─────────────────────────────────────

  const handleNextRound = useCallback(async () => {
    if (!googleId || !roundResult?.nextRound) return

    try {
      setPhase('connecting')
      transcriptRef.current = []
      snapshotQueueRef.current = []
      setCode(DEFAULT_CODE.python)
      setCodeLanguage('python')
      setIsOutputExpanded(false)
      setCodingProblem(null)
      setLastSubmitResults(null)
      testRunner.clearResults()
      setElapsedSeconds(0)
      setCurrentQuestionIndex(0)
      setIsGracePeriod(false)
      questionTimeAlertSentRef.current = false
      questionWarningSentRef.current = false
      roundWarningRef.current = false
      autoEndFiredRef.current = false
      setTimePressureAlerts([])
      if (questionAlertResetTimerRef.current) {
        clearTimeout(questionAlertResetTimerRef.current)
        questionAlertResetTimerRef.current = null
      }

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

      // Capture time pressure config for next round
      if (currentRound.timePressure?.enabled) {
        setTimePressure(currentRound.timePressure)
        setQuestionCount(currentRound.questionCount)
      } else {
        setTimePressure(null)
      }

      // Check if next round has a coding problem
      if (session) {
        const nextSessionRound = session.rounds[currentRound.roundNumber - 1]
        if (nextSessionRound?.codingProblem) {
          setCodingProblem(nextSessionRound.codingProblem)
          const starterCode = nextSessionRound.codingProblem.starterCode
          if (starterCode?.python) {
            setCode(starterCode.python)
            setCodeLanguage('python')
          }
        }
      }

      await realtime.connect(ephemeralToken)
      // Phase transitions to 'active' via the connectionState effect.
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start next round')
      setPhase('error')
    }
  }, [googleId, sessionId, roundResult, realtime, session])

  // ─── Render ──────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--bg-body)]">
      {/* Always-visible interview navbar */}
      <InterviewNavbar
        phase={phase}
        companyName={session?.company.name}
        companyLogo={session?.company.logo}
        roleTitle={session?.role.title}
        roundNumber={currentRoundNumber}
        totalRounds={totalRounds}
        roundType={roundType}
        roundTitle={roundTitle}
        elapsedSeconds={elapsedSeconds}
        isMuted={realtime.isMuted}
        connectionState={realtime.connectionState}
        isEndingRound={phase === 'round-ending'}
        onToggleMute={realtime.toggleMute}
        onEndRound={() => handleEndRound()}
        isTimePressured={isTimePressured}
        displaySeconds={displaySeconds}
        isGracePeriod={isGracePeriod}
        timePressureConfig={timePressure}
      />

      {/* ── Phase content ───────────────────────────────── */}

      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-muted)]" />
            <div className="h-5 w-48 bg-[var(--bg-muted)] rounded mx-auto mb-2" />
            <div className="h-4 w-32 bg-[var(--bg-muted)] rounded mx-auto" />
          </div>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="flex-1 flex items-center justify-center px-4">
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
      )}

      {/* Media check (mic + camera + screen) */}
      {phase === 'mic-check' && (
        <div className="flex-1 flex items-center justify-center px-4">
          <MediaCheckPanel
            hasMicPermission={mic.hasMicPermission}
            audioLevel={mic.audioLevel}
            micError={mic.error}
            onRequestMic={mic.requestMic}
            hasCameraPermission={camera.hasCameraPermission}
            cameraStreamRef={camera.cameraStreamRef}
            cameraEnabled={cameraEnabled}
            cameraError={camera.error}
            onRequestCamera={camera.requestCamera}
            onToggleCameraEnabled={() => setCameraEnabled((prev) => !prev)}
            hasScreenPermission={screenCheck.hasScreenPermission}
            screenEnabled={screenEnabled}
            screenError={screenCheck.error}
            isScreenSupported={screenCheck.isSupported}
            onRequestScreen={screenCheck.requestScreen}
            onToggleScreenEnabled={() => setScreenEnabled((prev) => !prev)}
            isConnecting={false}
            onStartInterview={handleStartInterview}
          />
        </div>
      )}

      {/* Connecting */}
      {phase === 'connecting' && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 border-3 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--text-secondary)]">Connecting to interviewer...</p>
          </motion.div>
        </div>
      )}

      {/* Between rounds — score card */}
      {phase === 'between-rounds' && roundResult && (
        <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto py-8">
          <RoundScoreCard
            roundTitle={roundTitle}
            roundType={roundType}
            roundNumber={currentRoundNumber}
            score={roundResult.roundScore.score}
            strengths={roundResult.roundScore.strengths}
            weaknesses={roundResult.roundScore.weaknesses}
            feedback={roundResult.roundScore.feedback}
            hasNextRound={roundResult.hasNextRound}
            testResults={lastSubmitResults}
            onNextRound={handleNextRound}
          />
        </div>
      )}

      {/* Completed — final summary */}
      {phase === 'completed' && roundResult && (
        <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto py-8">
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
      )}

      {/* Active interview (also covers round-ending with overlay) */}
      {(phase === 'active' || phase === 'round-ending') && (
        <>
          {hasCodingProblem ? (
            /* CodeSignal-style layout: Problem+Chat | Editor | Tests */
            <CodingInterviewLayout
              problem={codingProblem}
              exchanges={realtime.transcript}
              aiPartialTranscript={realtime.aiPartialTranscript}
              userPartialTranscript={realtime.userPartialTranscript}
              currentSpeaker={realtime.currentSpeaker}
              language={codeLanguage}
              code={code}
              onCodeChange={setCode}
              onLanguageChange={(lang) => {
                setCodeLanguage(lang)
                // Swap to starter code for new language if code is still default
                if (codingProblem.starterCode?.[lang]) {
                  const currentDefault = codingProblem.starterCode?.[codeLanguage] || DEFAULT_CODE[codeLanguage]
                  if (!code || code === currentDefault) {
                    setCode(codingProblem.starterCode[lang])
                  }
                }
              }}
              testResults={testRunner.testResults}
              isRunningTests={testRunner.isRunning}
              isSubmittingTests={testRunner.isSubmitting}
              onRunTests={() => testRunner.runVisibleTests(codeLanguage, code)}
              onSubmitTests={async () => {
                const results = await testRunner.submitAllTests(codeLanguage, code)
                setLastSubmitResults(results)
                // Add code submission to transcript
                transcriptRef.current = [
                  ...transcriptRef.current,
                  {
                    role: 'candidate',
                    content: `[Code Submitted — ${codeLanguage}] ${results.passed}/${results.total} tests passed`,
                    timestamp: new Date().toISOString(),
                  },
                ]
                // Auto-end the round — pass results directly to avoid stale closure
                handleEndRound(results)
              }}
            />
          ) : isCodingRound ? (
            /* Legacy free-form coding layout (no structured problem) */
            <div className="flex-1 flex overflow-hidden">
              <div className="w-2/5 border-r border-[var(--border-color)]">
                <TranscriptPanel
                  exchanges={realtime.transcript}
                  aiPartialTranscript={realtime.aiPartialTranscript}
                  userPartialTranscript={realtime.userPartialTranscript}
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
            /* Behavioral layout — full-width transcript */
            <TranscriptPanel
              exchanges={realtime.transcript}
              aiPartialTranscript={realtime.aiPartialTranscript}
              userPartialTranscript={realtime.userPartialTranscript}
              currentSpeaker={realtime.currentSpeaker}
            />
          )}

          {/* Interviewer orb + camera preview (floating, top-right corner) */}
          <div className="absolute top-16 right-4 z-30 flex flex-col items-center gap-3 p-4 rounded-2xl bg-[var(--bg-elevated)]/80 backdrop-blur-md border border-[var(--border-color)] shadow-lg">
            <InterviewerOrb currentSpeaker={realtime.currentSpeaker} size={120} />
            <CameraPreview
              cameraStreamRef={realtime.cameraStreamRef}
              isCameraOff={realtime.isCameraOff}
              onToggleCamera={realtime.toggleCamera}
            />
          </div>

          <AudioControls
            isMuted={realtime.isMuted}
            connectionState={realtime.connectionState}
            currentSpeaker={realtime.currentSpeaker}
            onToggleMute={realtime.toggleMute}
            isCameraOff={realtime.isCameraOff}
            hasCamera={!!realtime.cameraStreamRef.current}
            onToggleCamera={realtime.toggleCamera}
          />

          {/* Time pressure notifications */}
          {isTimePressured && timePressureAlerts.length > 0 && (
            <TimePressureToast
              alerts={timePressureAlerts}
              onDismiss={dismissAlert}
            />
          )}

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
        </>
      )}
    </div>
  )
}
