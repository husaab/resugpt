'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  LightBulbIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { QuestionRow } from './QuestionRow'
import type { RoleSummary, RoleDetails, InterviewRound } from '@/types/interviewPrep'
import type { BadgeProps } from '@/components/ui/badge'

// ─── Constants ──────────────────────────────────────

type TabId = 'tips' | 'rounds' | 'questions'

const LEVEL_VARIANT: Record<RoleSummary['level'], BadgeProps['variant']> = {
  intern: 'default',
  junior: 'outline',
  mid: 'primary',
  senior: 'warning',
  staff: 'success',
}

const ROUND_TYPE_VARIANT: Record<InterviewRound['type'], BadgeProps['variant']> = {
  phone_screen: 'outline',
  behavioral: 'primary',
  technical: 'warning',
  system_design: 'success',
  hiring_manager: 'default',
}

// ─── Props ──────────────────────────────────────────

interface RoleDetailsContentProps {
  details: RoleDetails
  isAdmin: boolean
  onEdit?: (details: RoleDetails) => void
  onDelete?: (summary: RoleSummary) => void
  showHeader?: boolean
  /** Allow multiple rounds/questions open at once (default: false — single accordion) */
  multiOpen?: boolean
  /** Auto-open the first round on mount (default: false) */
  defaultOpenFirst?: boolean
}

// ─── Component ──────────────────────────────────────

export function RoleDetailsContent({
  details,
  isAdmin,
  onEdit,
  onDelete,
  showHeader = true,
  multiOpen = false,
  defaultOpenFirst = false,
}: RoleDetailsContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('rounds')

  // Multi-open mode: Set-based state; single-open mode: single value
  const [openRounds, setOpenRounds] = useState<Set<number>>(
    () => defaultOpenFirst && details.rounds.length > 0
      ? new Set([details.rounds[0].roundNumber])
      : new Set()
  )
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set())

  const isRoundOpen = (roundNumber: number) => openRounds.has(roundNumber)
  const isQuestionOpen = (questionId: string) => openQuestions.has(questionId)

  const toggleRound = (roundNumber: number) => {
    setOpenRounds((prev) => {
      if (multiOpen) {
        const next = new Set(prev)
        if (next.has(roundNumber)) next.delete(roundNumber)
        else next.add(roundNumber)
        return next
      }
      // Single-open: toggle or switch
      return prev.has(roundNumber) ? new Set() : new Set([roundNumber])
    })
  }

  const toggleQuestion = (questionId: string) => {
    setOpenQuestions((prev) => {
      if (multiOpen) {
        const next = new Set(prev)
        if (next.has(questionId)) next.delete(questionId)
        else next.add(questionId)
        return next
      }
      return prev.has(questionId) ? new Set() : new Set([questionId])
    })
  }

  // ─── Derived values ─────────────────────────────────

  const totalQuestions = details.rounds.reduce((sum, r) => sum + r.questions.length, 0)
  const hasTips = details.tips.length > 0

  // ─── Tabs ───────────────────────────────────────────

  const tabs: { id: TabId; label: string }[] = []
  if (hasTips) {
    tabs.push({ id: 'tips', label: 'Tips' })
  }
  tabs.push({ id: 'rounds', label: `Rounds (${details.rounds.length})` })
  tabs.push({ id: 'questions', label: `Questions (${totalQuestions})` })

  // ─── Render ─────────────────────────────────────────

  return (
    <div>
      {/* Optional header */}
      {showHeader && (
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {details.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <Badge variant={LEVEL_VARIANT[details.level]} size="sm">
                  {details.level}
                </Badge>
                {details.department && (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {details.department}
                  </span>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit?.(details)}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-colors"
                  title="Edit role"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    onDelete?.({
                      id: details.id,
                      title: details.title,
                      level: details.level,
                      department: details.department,
                      description: details.description,
                      roundCount: details.rounds.length,
                    })
                  }
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                  title="Delete role"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-[var(--border-color)] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setOpenQuestions(new Set())
            }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* ─── Tips Tab ─── */}
          {activeTab === 'tips' && details.tips.length > 0 && (
            <div className="bg-[var(--accent-light)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <LightBulbIcon className="w-4 h-4 text-[var(--accent-color)]" />
                <p className="text-xs font-semibold text-[var(--accent-color)] uppercase tracking-wider">
                  Tips
                </p>
              </div>
              <ul className="space-y-1">
                {details.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                  >
                    <span className="text-[var(--accent-color)] mt-0.5 flex-shrink-0">
                      &bull;
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ─── Rounds Tab ─── */}
          {activeTab === 'rounds' && (
            <div className="space-y-4">
              {details.rounds.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] italic text-center py-4">
                  No rounds for this role.
                </p>
              ) : (
                details.rounds.map((round) => (
                  <div
                    key={round.roundNumber}
                    className="border border-[var(--border-color)] rounded-xl overflow-hidden"
                  >
                    {/* Round header -- clickable to expand */}
                    <button
                      onClick={() => toggleRound(round.roundNumber)}
                      className="w-full px-4 py-3 bg-[var(--bg-muted)] flex items-center gap-3 flex-wrap text-left"
                    >
                      <span className="text-xs font-mono text-[var(--text-tertiary)]">
                        Round {round.roundNumber}
                      </span>
                      <span className="font-medium text-sm text-[var(--text-primary)]">
                        {round.title}
                      </span>
                      <Badge variant={ROUND_TYPE_VARIANT[round.type]} size="sm">
                        {round.type.replace(/_/g, ' ')}
                      </Badge>
                      <div className="flex items-center gap-1 ml-auto text-xs text-[var(--text-tertiary)]">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {round.duration} min
                      </div>
                      <ChevronDownIcon
                        className={`w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform ${
                          isRoundOpen(round.roundNumber) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Expanded round content */}
                    <AnimatePresence initial={false}>
                      {isRoundOpen(round.roundNumber) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          {/* Round description */}
                          {round.description && (
                            <div className="px-4 py-2 border-t border-[var(--border-color)]">
                              <p className="text-sm text-[var(--text-secondary)]">
                                {round.description}
                              </p>
                            </div>
                          )}

                          {/* Questions list */}
                          {round.questions.length > 0 ? (
                            <div className="border-t border-[var(--border-color)] divide-y divide-[var(--border-color)]">
                              {round.questions.map((q) => (
                                <QuestionRow
                                  key={q.id}
                                  question={q}
                                  isOpen={isQuestionOpen(q.id)}
                                  onToggle={() => toggleQuestion(q.id)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-3 border-t border-[var(--border-color)]">
                              <p className="text-sm text-[var(--text-tertiary)] italic">
                                No questions for this round.
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── Questions Tab (flat view) ─── */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {details.rounds.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] italic text-center py-4">
                  No questions available.
                </p>
              ) : (
                details.rounds.map((round) => (
                  <div key={round.roundNumber}>
                    {/* Round header separator (not clickable) */}
                    <div className="flex items-center gap-3 flex-wrap mb-2 px-1">
                      <span className="text-xs font-mono text-[var(--text-tertiary)]">
                        Round {round.roundNumber}
                      </span>
                      <span className="font-medium text-sm text-[var(--text-primary)]">
                        {round.title}
                      </span>
                      <Badge variant={ROUND_TYPE_VARIANT[round.type]} size="sm">
                        {round.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    {round.questions.length > 0 ? (
                      <div className="border border-[var(--border-color)] rounded-xl overflow-hidden divide-y divide-[var(--border-color)]">
                        {round.questions.map((q) => (
                          <QuestionRow
                            key={q.id}
                            question={q}
                            isOpen={isQuestionOpen(q.id)}
                            onToggle={() => toggleQuestion(q.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-tertiary)] italic px-1">
                        No questions for this round.
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Re-export constants for consumers that need them (e.g., the full page header)
export { LEVEL_VARIANT, ROUND_TYPE_VARIANT }
export type { TabId }
