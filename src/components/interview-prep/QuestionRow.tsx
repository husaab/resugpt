'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import type { InterviewQuestion } from '@/types/interviewPrep'

// ─── Props ──────────────────────────────────────────

interface QuestionRowProps {
  question: InterviewQuestion
  isOpen: boolean
  onToggle: () => void
}

// ─── Component ──────────────────────────────────────

export function QuestionRow({ question: q, isOpen, onToggle }: QuestionRowProps) {
  return (
    <div className="px-4">
      {/* Question row -- clickable to expand */}
      <button
        className="w-full text-left py-3 flex items-start justify-between gap-3 group"
        onClick={onToggle}
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
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded question detail */}
      <AnimatePresence initial={false}>
        {isOpen && (
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
  )
}
