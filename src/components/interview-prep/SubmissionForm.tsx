'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CompanyListItem, InterviewRound } from '@/types/interviewPrep'

// ─── Types ──────────────────────────────────────────────

export interface SubmissionFormData {
  selectedCompanyId: string | null
  newCompany: {
    name: string
    industry: string
    description: string
    interviewStyle: string
  }
  role: {
    title: string
    level: 'intern' | 'junior' | 'mid' | 'senior' | 'staff'
    department: string
    description: string
    tips: string[]
  }
  rounds: InterviewRound[]
}

interface SubmissionFormProps {
  companies: CompanyListItem[]
  preSelectedCompanyId?: string
  onSubmit: (data: SubmissionFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

// ─── Constants ──────────────────────────────────────────

const LEVEL_OPTIONS = ['intern', 'junior', 'mid', 'senior', 'staff'] as const
const ROUND_TYPES = ['phone_screen', 'behavioral', 'technical', 'system_design', 'hiring_manager'] as const
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const

const inputCls =
  'w-full px-4 py-2.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50'
const labelCls = 'block text-sm font-medium text-[var(--text-primary)] mb-1.5'

// ─── Helpers ────────────────────────────────────────────

interface QuestionDraft {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  followUps: string
  evaluationCriteria: string
  sampleAnswer: string
}

interface RoundDraft {
  roundNumber: number
  type: InterviewRound['type']
  title: string
  description: string
  duration: number
  questions: QuestionDraft[]
}

function blankQuestion(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    question: '',
    category: '',
    difficulty: 'medium',
    followUps: '',
    evaluationCriteria: '',
    sampleAnswer: '',
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
      followUps: q.followUps
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      evaluationCriteria: q.evaluationCriteria
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      sampleAnswer: q.sampleAnswer,
      source: 'user_submitted' as const,
    })),
  }
}

// ─── Component ──────────────────────────────────────────

export function SubmissionForm({
  companies,
  preSelectedCompanyId,
  onSubmit,
  onCancel,
  isSubmitting,
}: SubmissionFormProps) {
  // ─── Company Selection State ──────────────────────────
  const preSelectedCompany = preSelectedCompanyId
    ? companies.find((c) => c.id === preSelectedCompanyId)
    : null

  const [companySearch, setCompanySearch] = useState(preSelectedCompany?.name || '')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    preSelectedCompany ? preSelectedCompanyId! : null
  )
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [showNewCompanyFields, setShowNewCompanyFields] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // New company fields
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('')
  const [newCompanyDescription, setNewCompanyDescription] = useState('')
  const [newCompanyInterviewStyle, setNewCompanyInterviewStyle] = useState('')

  // ─── Role Basics State ────────────────────────────────
  const [roleTitle, setRoleTitle] = useState('')
  const [roleLevel, setRoleLevel] = useState<SubmissionFormData['role']['level']>('mid')
  const [roleDepartment, setRoleDepartment] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [tipsText, setTipsText] = useState('')

  // ─── Rounds State (Progressive) ───────────────────────
  const [rounds, setRounds] = useState<RoundDraft[]>([])
  const [showRoundsSection, setShowRoundsSection] = useState(false)
  const [openRound, setOpenRound] = useState<number | null>(null)

  // ─── Company Dropdown Logic ───────────────────────────

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies.slice(0, 20)
    const q = companySearch.toLowerCase()
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q)
    )
  }, [companies, companySearch])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCompanyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelectCompany = (company: CompanyListItem) => {
    setSelectedCompanyId(company.id)
    setCompanySearch(company.name)
    setShowNewCompanyFields(false)
    setShowCompanyDropdown(false)
  }

  const handleSelectNewCompany = () => {
    setSelectedCompanyId(null)
    setShowNewCompanyFields(true)
    setShowCompanyDropdown(false)
  }

  const handleClearCompany = () => {
    setSelectedCompanyId(null)
    setCompanySearch('')
    setShowNewCompanyFields(false)
  }

  // ─── Round Helpers ────────────────────────────────────

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

  // ─── Question Helpers ─────────────────────────────────

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

  const updateQuestion = (
    roundIdx: number,
    qIdx: number,
    patch: Partial<QuestionDraft>
  ) => {
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

  // ─── Submit ───────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const companyName = selectedCompanyId
      ? companies.find((c) => c.id === selectedCompanyId)?.name || companySearch
      : companySearch

    if (!companyName.trim()) return
    if (!roleTitle.trim()) return

    // Filter out incomplete rounds (no title) and empty questions
    const cleanedRounds = rounds
      .filter((r) => r.title.trim())
      .map((r) => ({
        ...r,
        questions: r.questions.filter((q) => q.question.trim()),
      }))

    onSubmit({
      selectedCompanyId,
      newCompany: {
        name: companySearch.trim(),
        industry: newCompanyIndustry,
        description: newCompanyDescription,
        interviewStyle: newCompanyInterviewStyle,
      },
      role: {
        title: roleTitle,
        level: roleLevel,
        department: roleDepartment,
        description: roleDescription,
        tips: tipsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      },
      rounds: cleanedRounds.map(fromRoundDraft),
    })
  }

  // ─── Render ───────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── Section 1: Company Selector ─── */}
      <div>
        <label className={labelCls}>Company *</label>
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value)
                setShowCompanyDropdown(true)
                if (selectedCompanyId) {
                  setSelectedCompanyId(null)
                  setShowNewCompanyFields(false)
                }
              }}
              onFocus={() => setShowCompanyDropdown(true)}
              placeholder="Search existing companies or type a new one..."
              className={`${inputCls} pl-10 ${
                selectedCompanyId
                  ? 'border-[var(--accent-color)] bg-[var(--accent-light)]'
                  : ''
              }`}
            />
            {selectedCompanyId && (
              <CheckIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--accent-color)]" />
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {showCompanyDropdown && !selectedCompanyId && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-30 w-full mt-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg max-h-64 overflow-y-auto"
              >
                {filteredCompanies.length > 0 &&
                  filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => handleSelectCompany(company)}
                      className="w-full px-4 py-2.5 text-left hover:bg-[var(--bg-muted)] transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt=""
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span
                            className="text-xs font-bold"
                            style={{ color: 'var(--accent-color)' }}
                          >
                            {company.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {company.name}
                        </p>
                        {company.industry && (
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {company.industry}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}

                {filteredCompanies.length === 0 && companySearch && (
                  <div className="px-4 py-3 text-sm text-[var(--text-tertiary)]">
                    No matching companies found
                  </div>
                )}

                {/* New Company Option */}
                {companySearch.trim() && (
                  <button
                    type="button"
                    onClick={handleSelectNewCompany}
                    className="w-full px-4 py-2.5 text-left border-t border-[var(--border-color)] hover:bg-[var(--accent-light)] transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4 text-[var(--accent-color)] flex-shrink-0" />
                    <span className="text-sm font-medium text-[var(--accent-color)]">
                      Add &quot;{companySearch.trim()}&quot; as a new company
                    </span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected company badge */}
        {selectedCompanyId && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {companies.find((c) => c.id === selectedCompanyId)?.name}
            </Badge>
            <button
              type="button"
              onClick={handleClearCompany}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-color)] transition-colors"
            >
              Change
            </button>
          </div>
        )}

        {/* New company expanded fields */}
        <AnimatePresence>
          {showNewCompanyFields && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 p-4 bg-[var(--bg-muted)] rounded-xl border border-dashed border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                    New Company Details
                  </p>
                  <button
                    type="button"
                    onClick={handleClearCompany}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <div>
                  <label className={labelCls}>Industry</label>
                  <input
                    type="text"
                    value={newCompanyIndustry}
                    onChange={(e) => setNewCompanyIndustry(e.target.value)}
                    placeholder="e.g. Tech, Finance, Healthcare"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Company Description</label>
                  <textarea
                    value={newCompanyDescription}
                    onChange={(e) => setNewCompanyDescription(e.target.value)}
                    placeholder="Brief description of the company..."
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Interview Style</label>
                  <textarea
                    value={newCompanyInterviewStyle}
                    onChange={(e) => setNewCompanyInterviewStyle(e.target.value)}
                    placeholder="How does this company conduct interviews?"
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Section 2: Role Basics ─── */}
      <div className="space-y-4 border-t border-[var(--border-color)] pt-6">
        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Role Information
        </p>

        <div>
          <label className={labelCls}>Role Title *</label>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
            placeholder="e.g. Software Engineer"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Level *</label>
            <select
              value={roleLevel}
              onChange={(e) =>
                setRoleLevel(e.target.value as SubmissionFormData['role']['level'])
              }
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
              value={roleDepartment}
              onChange={(e) => setRoleDepartment(e.target.value)}
              placeholder="e.g. Engineering"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Role Description</label>
          <textarea
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            placeholder="Brief role overview or what to expect..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className={labelCls}>Interview Tips (one per line)</label>
          <textarea
            value={tipsText}
            onChange={(e) => setTipsText(e.target.value)}
            placeholder={'Review system design concepts\nPractice STAR format\nBe ready for coding challenges'}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      {/* ─── Section 3: Progressive Rounds ─── */}
      <div className="border-t border-[var(--border-color)] pt-4">
        <button
          type="button"
          onClick={() => setShowRoundsSection(!showRoundsSection)}
          className="flex items-center gap-2 w-full text-left text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors py-1"
        >
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-200 ${
              showRoundsSection ? 'rotate-180' : ''
            }`}
          />
          Add Interview Rounds &amp; Questions
          <span className="text-xs text-[var(--text-tertiary)] font-normal">(optional)</span>
          {rounds.length > 0 && (
            <Badge variant="primary" size="sm" className="ml-auto">
              {rounds.length} round{rounds.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </button>

        <AnimatePresence>
          {showRoundsSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Add details about specific interview rounds you experienced
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={addRound}>
                    <PlusIcon className="w-4 h-4" />
                    Add Round
                  </Button>
                </div>

                {rounds.length === 0 && (
                  <p className="text-sm text-[var(--text-tertiary)] text-center py-6 border border-dashed border-[var(--border-color)] rounded-xl">
                    No rounds yet. Click &quot;Add Round&quot; above to start.
                  </p>
                )}

                <div className="space-y-2">
                  {rounds.map((round, idx) => (
                    <div
                      key={idx}
                      className="border border-[var(--border-color)] rounded-xl overflow-hidden"
                    >
                      {/* Round Header */}
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

                      {/* Round Body */}
                      {openRound === idx && (
                        <div className="p-4 space-y-4 border-t border-[var(--border-color)]">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelCls}>Round Title</label>
                              <input
                                type="text"
                                value={round.title}
                                onChange={(e) =>
                                  updateRound(idx, { title: e.target.value })
                                }
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
                              <label className={labelCls}>Duration (min)</label>
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

                          {/* Questions */}
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
                                            difficulty: e.target
                                              .value as QuestionDraft['difficulty'],
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Disclaimer ─── */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl p-4">
        <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1.5">
          IMPORTANT: Email Verification Required
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          Forward proof of your interview (invitation emails, confirmations, offer letters, etc.)
          to{' '}
          <a
            href="mailto:submissions@resugpt.com"
            className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
          >
            submissions@resugpt.com
          </a>
          . We take submission and company interview data accuracy very seriously.
          Not doing so will result in your submission being denied/rejected.
        </p>
      </div>

      {/* ─── Actions ─── */}
      <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border-color)]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Submit Data
        </Button>
      </div>
    </form>
  )
}
