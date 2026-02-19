'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { getRoleDetails } from '@/services/interviewPrepService'
import type { RoleSummary, RoleDetails, InterviewRound } from '@/types/interviewPrep'
import type { BadgeProps } from '@/components/ui/badge'

// ─── Badge variant mappings ─────────────────────────

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

interface RoleCardProps {
  role: RoleSummary
  isAdmin: boolean
  isExpanded: boolean
  onToggle: () => void
  detailsCache: React.MutableRefObject<Map<string, RoleDetails>>
  onEdit: (role: RoleDetails) => void
  onDelete: (role: RoleSummary) => void
}

// ─── Component ──────────────────────────────────────

export function RoleCard({
  role,
  isAdmin,
  isExpanded,
  onToggle,
  detailsCache,
  onEdit,
  onDelete,
}: RoleCardProps) {
  const [details, setDetails] = useState<RoleDetails | null>(
    detailsCache.current.get(role.id) ?? null
  )
  const [isFetchingDetails, setIsFetchingDetails] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)

  const handleToggle = async () => {
    onToggle()

    if (!isExpanded && !detailsCache.current.has(role.id)) {
      try {
        setIsFetchingDetails(true)
        setFetchError(null)
        const res = await getRoleDetails(role.id)
        if (res.success) {
          detailsCache.current.set(role.id, res.data)
          setDetails(res.data)
        } else {
          setFetchError('Failed to load role details')
        }
      } catch (err: any) {
        setFetchError(err.message || 'Failed to load role details')
      } finally {
        setIsFetchingDetails(false)
      }
    }
  }

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden transition-all hover:border-[var(--accent-color)] hover:shadow-[var(--shadow-md)]">
      {/* ─── Card Header (always visible) ─── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-[var(--text-primary)]">{role.title}</h3>
              <Badge variant={LEVEL_VARIANT[role.level]} size="sm">
                {role.level}
              </Badge>
            </div>
            {role.department && (
              <p className="text-xs text-[var(--text-tertiary)] mb-2">{role.department}</p>
            )}
            {role.description && (
              <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                {role.description}
              </p>
            )}
            <Badge variant="outline" size="sm">
              {role.roundCount} {role.roundCount === 1 ? 'round' : 'rounds'}
            </Badge>
          </div>

          {/* Admin action buttons */}
          {isAdmin && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (details) onEdit(details)
                }}
                disabled={!details}
                className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
                title={details ? 'Edit role' : 'Expand to load details first'}
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(role)
                }}
                className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                title="Delete role"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={handleToggle}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--accent-color)] transition-colors rounded-lg hover:bg-[var(--accent-light)]"
        >
          {isExpanded ? 'Hide details' : 'View rounds & questions'}
          <ChevronDownIcon
            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* ─── Inline Expansion Panel ─── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-[var(--border-color)] px-5 pb-5 pt-4">
              {/* Fetching skeleton */}
              {isFetchingDetails && (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-32 bg-[var(--bg-muted)] rounded" />
                  <div className="h-20 bg-[var(--bg-muted)] rounded-xl" />
                  <div className="h-20 bg-[var(--bg-muted)] rounded-xl" />
                </div>
              )}

              {/* Fetch error */}
              {fetchError && (
                <p className="text-sm text-[var(--error)]">{fetchError}</p>
              )}

              {/* Details content */}
              {details && !isFetchingDetails && (
                <div className="space-y-4">
                  {/* Tips */}
                  {details.tips.length > 0 && (
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

                  {/* Rounds */}
                  {details.rounds.map((round) => (
                    <div
                      key={round.roundNumber}
                      className="border border-[var(--border-color)] rounded-xl overflow-hidden"
                    >
                      {/* Round header */}
                      <div className="px-4 py-3 bg-[var(--bg-muted)] flex items-center gap-3 flex-wrap">
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
                      </div>

                      {/* Round description */}
                      {round.description && (
                        <div className="px-4 py-2 border-t border-[var(--border-color)]">
                          <p className="text-sm text-[var(--text-secondary)]">
                            {round.description}
                          </p>
                        </div>
                      )}

                      {/* Questions list */}
                      {round.questions.length > 0 && (
                        <div className="border-t border-[var(--border-color)] divide-y divide-[var(--border-color)]">
                          {round.questions.map((q) => (
                            <div key={q.id} className="px-4">
                              {/* Question row — clickable to expand */}
                              <button
                                className="w-full text-left py-3 flex items-start justify-between gap-3 group"
                                onClick={() =>
                                  setOpenQuestion(openQuestion === q.id ? null : q.id)
                                }
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                                    {q.question}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge
                                      variant={
                                        q.difficulty === 'easy'
                                          ? 'success'
                                          : q.difficulty === 'medium'
                                            ? 'warning'
                                            : 'error'
                                      }
                                      size="sm"
                                    >
                                      {q.difficulty}
                                    </Badge>
                                    {q.category && (
                                      <Badge variant="outline" size="sm">
                                        {q.category}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <ChevronDownIcon
                                  className={`w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5 transition-transform ${
                                    openQuestion === q.id ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {/* Expanded question detail */}
                              <AnimatePresence initial={false}>
                                {openQuestion === q.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <div className="pb-4 space-y-3">
                                      {q.followUps.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                                            Follow-ups
                                          </p>
                                          <ul className="space-y-1">
                                            {q.followUps.map((f, i) => (
                                              <li
                                                key={i}
                                                className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                                              >
                                                <span className="text-[var(--text-tertiary)] flex-shrink-0">
                                                  &bull;
                                                </span>
                                                {f}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {q.evaluationCriteria.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                                            Evaluation Criteria
                                          </p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {q.evaluationCriteria.map((c, i) => (
                                              <Badge key={i} variant="outline" size="sm">
                                                {c}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {q.sampleAnswer && (
                                        <div>
                                          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                                            Sample Answer
                                          </p>
                                          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-muted)] rounded-lg p-3">
                                            {q.sampleAnswer}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
