'use client'

import { useState } from 'react'
import { ChevronDownIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { RoleDetails, InterviewRound } from '@/types/interviewPrep'

export interface RoleFormData {
  title: string
  level: 'intern' | 'junior' | 'mid' | 'senior' | 'staff'
  department: string
  description: string
  rounds: InterviewRound[]
  tips: string[]
}

interface QuestionDraft {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  followUps: string
  evaluationCriteria: string
  sampleAnswer: string
  source: 'manual' | 'user_submitted'
}

interface RoundDraft {
  roundNumber: number
  type: InterviewRound['type']
  title: string
  description: string
  duration: number
  questions: QuestionDraft[]
}

interface RoleFormProps {
  initial?: Partial<RoleDetails>
  onSubmit: (data: RoleFormData) => void
  onCancel: () => void
  isSubmitting: boolean
  submitLabel: string
}

const LEVEL_OPTIONS = ['intern', 'junior', 'mid', 'senior', 'staff'] as const
const ROUND_TYPES = ['phone_screen', 'behavioral', 'technical', 'system_design', 'hiring_manager'] as const
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const

function blankQuestion(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    question: '',
    category: '',
    difficulty: 'medium',
    followUps: '',
    evaluationCriteria: '',
    sampleAnswer: '',
    source: 'manual',
  }
}

function blankRound(number: number): RoundDraft {
  return {
    roundNumber: number,
    type: 'behavioral',
    title: '',
    description: '',
    duration: 45,
    questions: [],
  }
}

function toRoundDraft(r: InterviewRound): RoundDraft {
  return {
    ...r,
    questions: r.questions.map((q) => ({
      ...q,
      followUps: q.followUps.join(', '),
      evaluationCriteria: q.evaluationCriteria.join(', '),
    })),
  }
}

function fromRoundDraft(d: RoundDraft): InterviewRound {
  return {
    roundNumber: d.roundNumber,
    type: d.type,
    title: d.title,
    description: d.description,
    duration: d.duration,
    questions: d.questions.map((q) => ({
      id: q.id,
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      followUps: q.followUps.split(',').map((s) => s.trim()).filter(Boolean),
      evaluationCriteria: q.evaluationCriteria.split(',').map((s) => s.trim()).filter(Boolean),
      sampleAnswer: q.sampleAnswer,
      source: q.source,
    })),
  }
}

const inputCls =
  'w-full px-4 py-2.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50'
const labelCls = 'block text-sm font-medium text-[var(--text-primary)] mb-1.5'

export function RoleForm({ initial, onSubmit, onCancel, isSubmitting, submitLabel }: RoleFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [level, setLevel] = useState<RoleFormData['level']>(initial?.level ?? 'mid')
  const [department, setDepartment] = useState(initial?.department ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tipsText, setTipsText] = useState((initial?.tips ?? []).join('\n'))
  const [rounds, setRounds] = useState<RoundDraft[]>(
    (initial?.rounds ?? []).map(toRoundDraft)
  )
  const [openRound, setOpenRound] = useState<number | null>(null)

  // ─── Round helpers ──────────────────────────────────

  const addRound = () => {
    setRounds((prev) => {
      const next = blankRound(prev.length + 1)
      setOpenRound(prev.length)
      return [...prev, next]
    })
  }

  const removeRound = (idx: number) => {
    setRounds((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, roundNumber: i + 1 }))
    )
    setOpenRound(null)
  }

  const updateRound = (idx: number, patch: Partial<RoundDraft>) => {
    setRounds((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  // ─── Question helpers ───────────────────────────────

  const addQuestion = (roundIdx: number) => {
    const q = blankQuestion()
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIdx ? { ...r, questions: [...r.questions, q] } : r
      )
    )
  }

  const removeQuestion = (roundIdx: number, qIdx: number) => {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIdx
          ? { ...r, questions: r.questions.filter((_, qi) => qi !== qIdx) }
          : r
      )
    )
  }

  const updateQuestion = (roundIdx: number, qIdx: number, patch: Partial<QuestionDraft>) => {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIdx
          ? {
              ...r,
              questions: r.questions.map((q, qi) =>
                qi === qIdx ? { ...q, ...patch } : q
              ),
            }
          : r
      )
    )
  }

  // ─── Submit ─────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      level,
      department,
      description,
      rounds: rounds.map(fromRoundDraft),
      tips: tipsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── Basic Info ─── */}
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Role Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Software Engineer"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Level *</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as RoleFormData['level'])}
              className={inputCls}
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Role overview..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      {/* ─── Rounds Accordion ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Interview Rounds
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addRound}>
            <PlusIcon className="w-4 h-4" />
            Add Round
          </Button>
        </div>

        <div className="space-y-2">
          {rounds.length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-4 border border-dashed border-[var(--border-color)] rounded-xl">
              No rounds yet. Add one above.
            </p>
          )}

          {rounds.map((round, idx) => (
            <div
              key={idx}
              className="border border-[var(--border-color)] rounded-xl overflow-hidden"
            >
              {/* Accordion header */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-[var(--bg-muted)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                onClick={() => setOpenRound(openRound === idx ? null : idx)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[var(--text-tertiary)]">
                    Round {round.roundNumber}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {round.title || '(untitled)'}
                  </span>
                  <Badge variant="outline" size="sm">
                    {round.type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeRound(idx)
                    }}
                    className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${
                      openRound === idx ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Accordion body */}
              {openRound === idx && (
                <div className="p-4 space-y-4 border-t border-[var(--border-color)]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Round Title</label>
                      <input
                        type="text"
                        value={round.title}
                        onChange={(e) => updateRound(idx, { title: e.target.value })}
                        placeholder="e.g. Phone Screen"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Type</label>
                      <select
                        value={round.type}
                        onChange={(e) =>
                          updateRound(idx, {
                            type: e.target.value as InterviewRound['type'],
                          })
                        }
                        className={inputCls}
                      >
                        {ROUND_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Duration (minutes)</label>
                      <input
                        type="number"
                        value={round.duration}
                        onChange={(e) =>
                          updateRound(idx, { duration: Number(e.target.value) })
                        }
                        min={5}
                        max={180}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Description</label>
                      <input
                        type="text"
                        value={round.description}
                        onChange={(e) =>
                          updateRound(idx, { description: e.target.value })
                        }
                        placeholder="Round overview..."
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Questions sub-section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Questions ({round.questions.length})
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addQuestion(idx)}
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        Add Question
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {round.questions.map((q, qi) => (
                        <div
                          key={q.id}
                          className="bg-[var(--bg-muted)] rounded-xl p-4 space-y-3 relative"
                        >
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx, qi)}
                            className="absolute top-3 right-3 p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <label className={labelCls}>Question</label>
                            <textarea
                              value={q.question}
                              onChange={(e) =>
                                updateQuestion(idx, qi, {
                                  question: e.target.value,
                                })
                              }
                              placeholder="Tell me about a time..."
                              rows={2}
                              className={`${inputCls} resize-none`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Category</label>
                              <input
                                type="text"
                                value={q.category}
                                onChange={(e) =>
                                  updateQuestion(idx, qi, {
                                    category: e.target.value,
                                  })
                                }
                                placeholder="e.g. leadership"
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Difficulty</label>
                              <select
                                value={q.difficulty}
                                onChange={(e) =>
                                  updateQuestion(idx, qi, {
                                    difficulty: e.target.value as QuestionDraft['difficulty'],
                                  })
                                }
                                className={inputCls}
                              >
                                {DIFFICULTY_OPTIONS.map((d) => (
                                  <option key={d} value={d}>
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>
                              Follow-ups (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={q.followUps}
                              onChange={(e) =>
                                updateQuestion(idx, qi, {
                                  followUps: e.target.value,
                                })
                              }
                              placeholder="Follow-up 1, Follow-up 2"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>
                              Evaluation Criteria (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={q.evaluationCriteria}
                              onChange={(e) =>
                                updateQuestion(idx, qi, {
                                  evaluationCriteria: e.target.value,
                                })
                              }
                              placeholder="Communication, Leadership"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Sample Answer</label>
                            <textarea
                              value={q.sampleAnswer}
                              onChange={(e) =>
                                updateQuestion(idx, qi, {
                                  sampleAnswer: e.target.value,
                                })
                              }
                              placeholder="Ideal answer..."
                              rows={3}
                              className={`${inputCls} resize-none`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Tips ─── */}
      <div>
        <label className={labelCls}>Tips (one per line)</label>
        <textarea
          value={tipsText}
          onChange={(e) => setTipsText(e.target.value)}
          placeholder={'Review system design concepts\nPractice STAR format'}
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* ─── Actions ─── */}
      <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-color)]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
