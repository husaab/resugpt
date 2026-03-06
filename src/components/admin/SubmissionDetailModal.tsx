'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { ModalShell } from '@/components/ui/ModalShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SubmissionDetails, SubmissionStatus, InterviewRound } from '@/types/interviewPrep'

interface SubmissionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  submission: SubmissionDetails | null
  isLoadingDetail: boolean
  onApprove: () => void
  onReject: () => void
}

const statusBadgeVariant = (status: SubmissionStatus) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'error' } as const
  return map[status]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function RoundAccordion({ round }: { round: InterviewRound }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase">
            Round {round.roundNumber}
          </span>
          <span className="font-medium text-sm text-[var(--text-primary)]">{round.title}</span>
          <Badge variant="outline" size="sm">{round.type.replace('_', ' ')}</Badge>
          {round.duration > 0 && (
            <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {round.duration}m
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-3 border-t border-[var(--border-color)]">
              {round.description && (
                <p className="text-sm text-[var(--text-secondary)]">{round.description}</p>
              )}

              {round.questions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase">
                    Questions ({round.questions.length})
                  </p>
                  {round.questions.map((q, qi) => (
                    <div key={q.id || qi} className="p-3 bg-[var(--bg-muted)] rounded-lg space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{q.question}</p>
                        <div className="flex gap-1 shrink-0">
                          {q.category && <Badge variant="primary" size="sm">{q.category}</Badge>}
                          {q.difficulty && <Badge variant="outline" size="sm">{q.difficulty}</Badge>}
                        </div>
                      </div>

                      {q.sampleAnswer && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-1">Sample Answer</p>
                          <p className="text-xs text-[var(--text-secondary)]">{q.sampleAnswer}</p>
                        </div>
                      )}

                      {q.followUps?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-1">Follow-ups</p>
                          <ul className="list-disc list-inside text-xs text-[var(--text-secondary)]">
                            {q.followUps.map((f, fi) => <li key={fi}>{f}</li>)}
                          </ul>
                        </div>
                      )}

                      {q.evaluationCriteria?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-1">Evaluation Criteria</p>
                          <ul className="list-disc list-inside text-xs text-[var(--text-secondary)]">
                            {q.evaluationCriteria.map((c, ci) => <li key={ci}>{c}</li>)}
                          </ul>
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

export function SubmissionDetailModal({
  isOpen,
  onClose,
  submission,
  isLoadingDetail,
  onApprove,
  onReject,
}: SubmissionDetailModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Submission Details" size="xl">
      {isLoadingDetail || !submission ? (
        <div className="animate-pulse space-y-4">
          <div className="flex gap-3">
            <div className="h-6 w-20 bg-[var(--bg-muted)] rounded-full" />
            <div className="h-6 w-16 bg-[var(--bg-muted)] rounded-full" />
            <div className="h-6 w-32 bg-[var(--bg-muted)] rounded ml-auto" />
          </div>
          <div className="h-32 bg-[var(--bg-muted)] rounded-xl" />
          <div className="h-32 bg-[var(--bg-muted)] rounded-xl" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-[var(--border-color)]">
            <Badge variant={statusBadgeVariant(submission.status)} size="md">
              {submission.status}
            </Badge>
            <Badge variant={submission.source === 'user' ? 'primary' : 'outline'} size="md">
              {submission.source}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] ml-auto">
              {submission.submittedByUsername && (
                <>
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{submission.submittedByUsername}</span>
                  <span className="mx-1">·</span>
                </>
              )}
              <span>{formatDate(submission.createdAt)}</span>
            </div>
          </div>

          {/* Review Info (if already reviewed) */}
          {submission.status !== 'pending' && (
            <div className={`p-3 rounded-lg border ${
              submission.status === 'approved'
                ? 'bg-[var(--success-light)] border-[var(--success)]'
                : 'bg-[var(--error-light)] border-[var(--error)]'
            }`}>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                {submission.status === 'approved' ? 'Approved' : 'Rejected'}
                {submission.reviewedByUsername && ` by ${submission.reviewedByUsername}`}
                {submission.reviewedAt && ` on ${formatDate(submission.reviewedAt)}`}
              </p>
              {submission.rejectionReason && (
                <p className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium">Reason:</span> {submission.rejectionReason}
                </p>
              )}
              {submission.reviewNotes && (
                <p className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium">Notes:</span> {submission.reviewNotes}
                </p>
              )}
            </div>
          )}

          {/* Company Section */}
          <div className="p-4 bg-[var(--bg-muted)] rounded-xl space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <BuildingOffice2Icon className="w-4 h-4 text-[var(--accent-color)]" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                Company
              </h4>
            </div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {submission.data.company.name}
            </p>
            {submission.data.company.industry && (
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Industry</span>
                <span className="text-sm text-[var(--text-secondary)]">{submission.data.company.industry}</span>
              </div>
            )}
            {submission.data.company.description && (
              <div>
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Description</span>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{submission.data.company.description}</p>
              </div>
            )}
            {submission.data.company.interviewStyle && (
              <div>
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Interview Style</span>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{submission.data.company.interviewStyle}</p>
              </div>
            )}
          </div>

          {/* Role Section */}
          <div className="p-4 bg-[var(--bg-muted)] rounded-xl space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <BriefcaseIcon className="w-4 h-4 text-[var(--accent-color)]" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                Role
              </h4>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {submission.data.role.title}
              </p>
              <Badge variant="primary" size="sm">{formatLevel(submission.data.role.level)}</Badge>
              {submission.data.role.department && (
                <Badge variant="outline" size="sm">{submission.data.role.department}</Badge>
              )}
            </div>
            {submission.data.role.description && (
              <div>
                <span className="text-xs font-medium text-[var(--text-tertiary)]">Description</span>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{submission.data.role.description}</p>
              </div>
            )}
          </div>

          {/* Rounds Section */}
          {submission.data.role.rounds && submission.data.role.rounds.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                Rounds ({submission.data.role.rounds.length})
              </h4>
              {submission.data.role.rounds.map((round, ri) => (
                <RoundAccordion key={ri} round={round} />
              ))}
            </div>
          )}

          {/* Tips Section */}
          {submission.data.role.tips && submission.data.role.tips.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                Tips
              </h4>
              <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-1">
                {submission.data.role.tips.map((tip, ti) => (
                  <li key={ti}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
            {submission.status === 'pending' && (
              <>
                <Button variant="destructive" size="md" onClick={onReject}>
                  Reject
                </Button>
                <Button variant="primary" size="md" onClick={onApprove}>
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  )
}
