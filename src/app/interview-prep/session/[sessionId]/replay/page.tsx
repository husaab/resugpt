'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AnalysisPendingBanner,
  AudioPlaybackBar,
  CodeSnapshotViewer,
  ReplayTimeline,
  RoundNavigation,
  TranscriptReplayPanel,
} from '@/components/interview-replay'
import {
  getInterviewSession,
  getAnalysis,
  getCodeSnapshots,
  getRoundAudio,
} from '@/services/interviewSessionService'
import type { InterviewSession } from '@/types/interviewSession'
import type {
  InterviewAnalysis,
  CodeSnapshot,
  RoundAudioUrls,
  MomentAnnotation,
} from '@/types/interviewAnalysis'

export default function ReplayPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()

  // Data state
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null)
  const [codeSnapshots, setCodeSnapshots] = useState<CodeSnapshot[]>([])
  const [roundAudio, setRoundAudio] = useState<RoundAudioUrls[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Playback state
  const [activeRound, setActiveRound] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)

  // Text mode animation
  const textTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const googleId = authSession?.user?.googleId

  // ─── Auth redirect ──────────────────────────────────────

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/interview-prep')
    }
  }, [authStatus, router])

  // ─── Load session data ──────────────────────────────────

  useEffect(() => {
    if (!googleId || !sessionId) return
    let cancelled = false

    const load = async () => {
      try {
        setIsLoading(true)
        const [sessionRes, analysisRes, audioRes] = await Promise.all([
          getInterviewSession(sessionId, googleId),
          getAnalysis(sessionId, googleId).catch(() => null),
          getRoundAudio(sessionId, googleId).catch(() => null),
        ])

        if (cancelled) return

        if (!sessionRes.success) {
          setError('Failed to load session')
          return
        }

        if (sessionRes.data.status !== 'completed') {
          router.push(`/interview-prep/session/${sessionId}`)
          return
        }

        setSession(sessionRes.data)
        if (analysisRes?.success) setAnalysis(analysisRes.data)
        if (audioRes?.success) setRoundAudio(audioRes.data)

        // Load code snapshots for the first round
        const firstRound = sessionRes.data.rounds[0]
        if (firstRound) {
          const isCoding = ['technical', 'coding', 'live_coding'].includes(firstRound.type)
          if (isCoding) {
            getCodeSnapshots(sessionId, googleId, 1)
              .then((res) => { if (!cancelled && res.success) setCodeSnapshots(res.data) })
              .catch(() => {})
          }
        }
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load replay')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [googleId, sessionId, router])

  // ─── Poll analysis while pending ────────────────────────

  useEffect(() => {
    if (!analysis || analysis.status === 'completed' || analysis.status === 'failed') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    if (!googleId || !sessionId) return

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getAnalysis(sessionId, googleId)
        if (res.success) setAnalysis(res.data)
      } catch { /* ignore */ }
    }, 5000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [analysis?.status, googleId, sessionId])

  // ─── Round switching ────────────────────────────────────

  const handleRoundChange = useCallback((roundNumber: number) => {
    setActiveRound(roundNumber)
    setCurrentTime(0)
    setIsPlaying(false)
    setAudioDuration(0)

    if (!googleId || !sessionId || !session) return

    const round = session.rounds[roundNumber - 1]
    if (!round) return

    const isCoding = ['technical', 'coding', 'live_coding'].includes(round.type)
    if (isCoding) {
      getCodeSnapshots(sessionId, googleId, roundNumber)
        .then((res) => { if (res.success) setCodeSnapshots(res.data) })
        .catch(() => setCodeSnapshots([]))
    } else {
      setCodeSnapshots([])
    }
  }, [googleId, sessionId, session])

  // ─── Derive current round data ──────────────────────────

  const currentRound = session?.rounds[activeRound - 1] ?? null
  const exchanges = currentRound?.exchanges ?? []
  const roundDuration = currentRound?.duration ?? 0
  const isCodingRound = currentRound ? ['technical', 'coding', 'live_coding'].includes(currentRound.type) : false

  // Filter moments for active round
  const roundMoments: MomentAnnotation[] = analysis?.status === 'completed'
    ? (analysis.moments || []).filter((m) => m.roundNumber === activeRound)
    : []

  // Audio availability for this round
  const roundAudioData = roundAudio.find((a) => a.roundNumber === activeRound)
  const hasAudio = !!(roundAudioData?.userAudioUrl || roundAudioData?.aiAudioUrl)

  // Total duration = max of audio duration, round duration, or computed from timestamps
  const totalDuration = Math.max(
    audioDuration,
    roundDuration,
    exchanges.length > 1
      ? (new Date(exchanges[exchanges.length - 1].timestamp).getTime() - new Date(exchanges[0].timestamp).getTime()) / 1000
      : 0
  ) || roundDuration || 60 // fallback

  const firstTimestamp = exchanges.length > 0 ? exchanges[0].timestamp : null

  // ─── Text mode playback (no audio — step through with timer) ──

  useEffect(() => {
    if (hasAudio || !isPlaying) {
      if (textTimerRef.current) {
        clearInterval(textTimerRef.current)
        textTimerRef.current = null
      }
      return
    }

    // Advance 1 second per real second
    textTimerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1
        if (next >= totalDuration) {
          setIsPlaying(false)
          return totalDuration
        }
        return next
      })
    }, 1000)

    return () => {
      if (textTimerRef.current) clearInterval(textTimerRef.current)
    }
  }, [hasAudio, isPlaying, totalDuration])

  // ─── Seek handler ───────────────────────────────────────

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, totalDuration)))
  }, [totalDuration])

  const handlePlayPause = useCallback(() => {
    setIsPlaying((p) => !p)
  }, [])

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleDurationResolved = useCallback((dur: number) => {
    setAudioDuration(dur)
  }, [])

  // ─── Loading ────────────────────────────────────────────

  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-5 w-40 bg-[var(--bg-muted)] rounded mb-8" />
          <div className="h-20 bg-[var(--bg-muted)] rounded-2xl mb-4" />
          <div className="h-10 bg-[var(--bg-muted)] rounded-xl mb-4" />
          <div className="h-96 bg-[var(--bg-muted)] rounded-xl" />
        </div>
      </div>
    )
  }

  // ─── Error ──────────────────────────────────────────────

  if (error || !session) {
    return (
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
            <BriefcaseIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Replay not available</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{error || 'Session not found.'}</p>
          <Link href="/interview-prep/history">
            <Button variant="primary">Back to History</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href={`/interview-prep/session/${sessionId}/results`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-color)] transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Results
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-5"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
            {session.company.logo ? (
              <img src={session.company.logo} alt={session.company.name} className="w-full h-full object-contain p-0.5" />
            ) : (
              <span className="text-sm font-bold" style={{ color: 'var(--accent-color)' }}>
                {session.company.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-[var(--text-tertiary)]">{session.company.name}</p>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              Interview Replay — {session.role.title}
            </h1>
          </div>
          {!hasAudio && (
            <Badge variant="outline" size="sm" className="ml-auto">
              Text replay
            </Badge>
          )}
        </motion.div>

        {/* Analysis banner */}
        {analysis && analysis.status !== 'completed' && (
          <div className="mb-4">
            <AnalysisPendingBanner status={analysis.status} />
          </div>
        )}

        {/* Round navigation */}
        <div className="mb-4">
          <RoundNavigation
            rounds={session.rounds}
            activeRound={activeRound}
            onRoundChange={handleRoundChange}
            roundAudio={roundAudio}
          />
        </div>

        {/* Audio playback bar (only if audio exists for this round) */}
        {hasAudio && (
          <div className="mb-3">
            <AudioPlaybackBar
              userAudioUrl={roundAudioData?.userAudioUrl ?? null}
              aiAudioUrl={roundAudioData?.aiAudioUrl ?? null}
              currentTime={currentTime}
              duration={totalDuration}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onTimeUpdate={handleTimeUpdate}
              onDurationResolved={handleDurationResolved}
            />
          </div>
        )}

        {/* Text mode play button (when no audio) */}
        {!hasAudio && exchanges.length > 0 && (
          <div className="mb-3 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
            >
              {isPlaying ? 'Pause' : 'Play'} text replay
            </Button>
            <span className="text-xs font-mono text-[var(--text-tertiary)]">
              {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
              {' / '}
              {Math.floor(totalDuration / 60)}:{Math.floor(totalDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Timeline */}
        <div className="mb-4">
          <ReplayTimeline
            exchanges={exchanges}
            moments={roundMoments}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onSeek={handleSeek}
          />
        </div>

        {/* Main content area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`flex gap-4 min-h-[500px] ${
            isCodingRound ? '' : ''
          }`}
        >
          {/* Transcript panel */}
          <div className={`${isCodingRound ? 'w-2/5' : 'w-full'} bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col`}>
            <TranscriptReplayPanel
              exchanges={exchanges}
              moments={roundMoments}
              currentTime={currentTime}
              roundStartTimestamp={firstTimestamp}
              isAudioMode={hasAudio}
            />
          </div>

          {/* Code snapshot viewer (coding rounds only) */}
          {isCodingRound && (
            <div className="w-3/5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col">
              <CodeSnapshotViewer
                snapshots={codeSnapshots}
                currentTime={currentTime}
                language={currentRound?.codeLanguage || 'python'}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
