'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
  SparklesIcon,
  BeakerIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  listCodingProblems,
  createCodingProblem,
  deleteCodingProblem,
  enrichProblem,
  verifyCodingProblem,
} from '@/services/codingProblemsService'
import type { CodingProblemRow, CodingProblem } from '@/types/codingProblem'

const DIFFICULTY_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
}

export default function ProblemBankPage() {
  const { data: authSession } = useSession()
  const router = useRouter()
  const googleId = authSession?.user?.googleId

  const [problems, setProblems] = useState<CodingProblemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showEnrichModal, setShowEnrichModal] = useState(false)
  const [enrichText, setEnrichText] = useState('')
  const [enrichDifficulty, setEnrichDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [enrichCategory, setEnrichCategory] = useState('')
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichedProblem, setEnrichedProblem] = useState<CodingProblem | null>(null)

  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load problems
  const loadProblems = useCallback(async () => {
    if (!googleId) return
    setLoading(true)
    try {
      const res = await listCodingProblems(googleId)
      if (res.success) setProblems(res.data)
    } catch {
      setError('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }, [googleId])

  useEffect(() => {
    loadProblems()
  }, [loadProblems])

  // Enrich a question text into a structured problem
  const handleEnrich = async () => {
    if (!googleId || !enrichText.trim()) return
    setIsEnriching(true)
    try {
      const res = await enrichProblem(googleId, {
        questionText: enrichText,
        difficulty: enrichDifficulty,
        category: enrichCategory || undefined,
      })
      if (res.success) {
        setEnrichedProblem(res.data)
      }
    } catch {
      setError('Failed to enrich problem')
    } finally {
      setIsEnriching(false)
    }
  }

  // Save enriched problem
  const handleSaveEnriched = async () => {
    if (!googleId || !enrichedProblem) return
    try {
      const res = await createCodingProblem(googleId, enrichedProblem, 'enriched')
      if (res.success) {
        setShowEnrichModal(false)
        setEnrichedProblem(null)
        setEnrichText('')
        loadProblems()
      }
    } catch {
      setError('Failed to save problem')
    }
  }

  // Verify a problem
  const handleVerify = async (id: string) => {
    if (!googleId) return
    setVerifyingId(id)
    try {
      const res = await verifyCodingProblem(id, googleId)
      if (res.success) {
        loadProblems()
        if (!res.data.verified) {
          setError('Verification failed — reference solution did not pass all tests')
        }
      }
    } catch {
      setError('Verification failed')
    } finally {
      setVerifyingId(null)
    }
  }

  // Delete a problem
  const handleDelete = async (id: string) => {
    if (!googleId || !confirm('Delete this problem permanently?')) return
    setDeletingId(id)
    try {
      await deleteCodingProblem(id, googleId)
      loadProblems()
    } catch {
      setError('Failed to delete problem')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)] px-4 py-30">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Problem Bank</h1>
              <p className="text-sm text-[var(--text-tertiary)]">
                Manage coding interview problems
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={() => setShowEnrichModal(true)}>
            <SparklesIcon className="w-4 h-4" />
            Enrich Problem
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)}>
              <XMarkIcon className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        {/* Problem list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[var(--bg-muted)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-tertiary)] mb-4">No problems yet</p>
            <Button variant="outline" onClick={() => setShowEnrichModal(true)}>
              <PlusIcon className="w-4 h-4" />
              Create your first problem
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((p) => (
              <motion.div
                key={p.id}
                layout
                className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {p.title}
                    </h3>
                    <Badge
                      variant={DIFFICULTY_VARIANT[p.difficulty] || 'default'}
                      size="sm"
                    >
                      {p.difficulty}
                    </Badge>
                    {p.is_verified && (
                      <CheckBadgeIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                    <span>{p.category}</span>
                    <span>&bull;</span>
                    <span>{p.source}</span>
                    <span>&bull;</span>
                    <span>{p.tags?.join(', ') || 'no tags'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <Tooltip content="Verify — run reference solution against all test cases" position="top">
                    <button
                      onClick={() => handleVerify(p.id)}
                      disabled={verifyingId === p.id}
                      className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--accent-color)] disabled:opacity-50"
                    >
                      {verifyingId === p.id ? (
                        <div className="w-4 h-4 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <BeakerIcon className="w-4 h-4" />
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip content="Edit problem" position="top">
                    <button
                      onClick={() => router.push(`/admin/problems/${p.id}`)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete problem" position="top">
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-[var(--text-tertiary)] hover:text-red-400 disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Enrich Modal */}
      <AnimatePresence>
        {showEnrichModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => !isEnriching && setShowEnrichModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {enrichedProblem ? 'Review Enriched Problem' : 'Enrich Problem'}
                </h2>
                <button
                  onClick={() => {
                    setShowEnrichModal(false)
                    setEnrichedProblem(null)
                  }}
                  className="p-1 rounded hover:bg-[var(--bg-muted)]"
                >
                  <XMarkIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                </button>
              </div>

              {!enrichedProblem ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">
                      Question Text
                    </label>
                    <textarea
                      value={enrichText}
                      onChange={(e) => setEnrichText(e.target.value)}
                      placeholder='e.g., "Two Sum" or "Given an array, find two numbers that add up to target..."'
                      className="w-full h-24 px-3 py-2 text-sm bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">
                        Difficulty
                      </label>
                      <select
                        value={enrichDifficulty}
                        onChange={(e) => setEnrichDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                        className="w-full px-3 py-2 text-sm bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">
                        Category
                      </label>
                      <input
                        value={enrichCategory}
                        onChange={(e) => setEnrichCategory(e.target.value)}
                        placeholder="e.g., arrays"
                        className="w-full px-3 py-2 text-sm bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                      />
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleEnrich}
                    disabled={isEnriching || !enrichText.trim()}
                  >
                    {isEnriching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enriching with AI...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        Enrich with GPT-4o
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {enrichedProblem.title}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {enrichedProblem.difficulty} &bull; {enrichedProblem.category} &bull;{' '}
                      {enrichedProblem.testCases?.length || 0} test cases &bull;{' '}
                      {Object.keys(enrichedProblem.starterCode || {}).length} languages
                    </p>
                  </div>

                  <div className="p-3 bg-[var(--bg-muted)] rounded-xl max-h-40 overflow-y-auto">
                    <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
                      {enrichedProblem.statement}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEnrichedProblem(null)}
                    >
                      Re-generate
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleSaveEnriched}
                    >
                      <PlusIcon className="w-4 h-4" />
                      Save Problem
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
