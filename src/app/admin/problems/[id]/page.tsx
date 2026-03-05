'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  BeakerIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getCodingProblem,
  updateCodingProblem,
  verifyCodingProblem,
} from '@/services/codingProblemsService'
import type { CodingProblem, TestCase } from '@/types/codingProblem'

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go'] as const

export default function ProblemEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { data: authSession } = useSession()
  const router = useRouter()
  const googleId = authSession?.user?.googleId

  const [problem, setProblem] = useState<CodingProblem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'testcases' | 'startercode' | 'solutions' | 'ai'>('details')

  // Load problem
  const loadProblem = useCallback(async () => {
    if (!googleId || !id) return
    setLoading(true)
    try {
      const res = await getCodingProblem(id, googleId)
      if (res.success) {
        setProblem(res.data.data)
      } else {
        setError('Problem not found')
      }
    } catch {
      setError('Failed to load problem')
    } finally {
      setLoading(false)
    }
  }, [googleId, id])

  useEffect(() => {
    loadProblem()
  }, [loadProblem])

  // Save
  const handleSave = async () => {
    if (!googleId || !id || !problem) return
    setSaving(true)
    setError(null)
    try {
      const res = await updateCodingProblem(id, googleId, problem)
      if (res.success) {
        setSuccess('Saved successfully')
        setTimeout(() => setSuccess(null), 2000)
      } else {
        setError('Failed to save')
      }
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Verify
  const handleVerify = async () => {
    if (!googleId || !id) return
    setVerifying(true)
    setError(null)
    try {
      const res = await verifyCodingProblem(id, googleId)
      if (res.success) {
        if (res.data.verified) {
          setSuccess('All tests passed! Problem verified.')
        } else {
          const langs = Object.entries(res.data.results)
            .filter(([, r]) => r.passed !== r.total)
            .map(([lang, r]) => `${lang}: ${r.passed}/${r.total}`)
          setError(`Verification failed: ${langs.join(', ')}`)
        }
      }
    } catch {
      setError('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  // Field updater
  const update = <K extends keyof CodingProblem>(field: K, value: CodingProblem[K]) => {
    if (!problem) return
    setProblem({ ...problem, [field]: value })
  }

  // Test case helpers
  const addTestCase = () => {
    if (!problem) return
    const newId = `tc-${problem.testCases.length + 1}`
    const newCase: TestCase = {
      id: newId,
      input: {},
      expectedOutput: '',
      isHidden: true,
      description: '',
    }
    // Pre-populate input keys from parameters
    for (const param of problem.parameters) {
      newCase.input[param.name] = ''
    }
    update('testCases', [...problem.testCases, newCase])
  }

  const removeTestCase = (index: number) => {
    if (!problem) return
    update('testCases', problem.testCases.filter((_, i) => i !== index))
  }

  const updateTestCase = (index: number, field: keyof TestCase, value: unknown) => {
    if (!problem) return
    const updated = [...problem.testCases]
    updated[index] = { ...updated[index], [field]: value }
    update('testCases', updated)
  }

  const updateTestCaseInput = (index: number, paramName: string, value: string) => {
    if (!problem) return
    const updated = [...problem.testCases]
    updated[index] = { ...updated[index], input: { ...updated[index].input, [paramName]: value } }
    update('testCases', updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Problem not found</h2>
          <Button variant="outline" onClick={() => router.push('/admin/problems')}>
            <ArrowLeftIcon className="w-4 h-4" /> Back to Problem Bank
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)] px-4 py-30">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/problems')}
              className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{problem.title}</h1>
              <p className="text-xs text-[var(--text-tertiary)]">{problem.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <div className="w-4 h-4 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <BeakerIcon className="w-4 h-4" />
              )}
              Verify
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Banners */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)}><XMarkIcon className="w-4 h-4 text-red-400" /></button>
          </div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
          >
            <p className="text-sm text-emerald-400">{success}</p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-color)] mb-6 overflow-x-auto">
          {(['details', 'testcases', 'startercode', 'solutions', 'ai'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeTab === tab
                  ? 'text-[var(--accent-color)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab === 'details' && 'Details'}
              {tab === 'testcases' && `Test Cases (${problem.testCases.length})`}
              {tab === 'startercode' && 'Starter Code'}
              {tab === 'solutions' && 'Solutions'}
              {tab === 'ai' && 'AI Guidance'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-color)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* ─── Details Tab ─── */}
          {activeTab === 'details' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Title" value={problem.title} onChange={(v) => update('title', v)} />
                <Field label="Slug" value={problem.slug} onChange={(v) => update('slug', v)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] mb-1 block">Difficulty</label>
                  <select
                    value={problem.difficulty}
                    onChange={(e) => update('difficulty', e.target.value as CodingProblem['difficulty'])}
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <Field label="Category" value={problem.category} onChange={(v) => update('category', v)} />
                <div>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] mb-1 block">Compare Mode</label>
                  <select
                    value={problem.compareMode}
                    onChange={(e) => update('compareMode', e.target.value as CodingProblem['compareMode'])}
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                  >
                    <option value="exact">Exact</option>
                    <option value="sorted">Sorted</option>
                    <option value="unordered">Unordered</option>
                  </select>
                </div>
              </div>
              <Field label="Tags (comma-separated)" value={problem.tags.join(', ')} onChange={(v) => update('tags', v.split(',').map((t) => t.trim()).filter(Boolean))} />
              <TextArea label="Problem Statement (Markdown)" value={problem.statement} onChange={(v) => update('statement', v)} rows={10} />
              <TextArea label="Constraints (one per line)" value={problem.constraints.join('\n')} onChange={(v) => update('constraints', v.split('\n').filter(Boolean))} rows={4} />

              {/* Function Signature */}
              <div className="p-4 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Function Signature</h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <Field label="Function Name" value={problem.functionName} onChange={(v) => update('functionName', v)} />
                  <Field label="Return Type" value={problem.returnType} onChange={(v) => update('returnType', v)} />
                </div>
                <label className="text-xs font-medium text-[var(--text-tertiary)] mb-2 block">Parameters</label>
                {problem.parameters.map((param, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                      value={param.name}
                      onChange={(e) => {
                        const params = [...problem.parameters]
                        params[i] = { ...params[i], name: e.target.value }
                        update('parameters', params)
                      }}
                      placeholder="name"
                      className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                    />
                    <input
                      value={param.type}
                      onChange={(e) => {
                        const params = [...problem.parameters]
                        params[i] = { ...params[i], type: e.target.value }
                        update('parameters', params)
                      }}
                      placeholder="type"
                      className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                    />
                    <button
                      onClick={() => update('parameters', problem.parameters.filter((_, j) => j !== i))}
                      className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => update('parameters', [...problem.parameters, { name: '', type: '' }])}
                  className="text-xs text-[var(--accent-color)] hover:underline mt-1"
                >
                  + Add parameter
                </button>
              </div>

              {/* Examples */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Examples</h3>
                {problem.examples.map((ex, i) => (
                  <div key={i} className="p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)] mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--text-tertiary)]">Example {i + 1}</span>
                      <button
                        onClick={() => update('examples', problem.examples.filter((_, j) => j !== i))}
                        className="p-1 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        value={ex.input}
                        onChange={(e) => {
                          const exs = [...problem.examples]
                          exs[i] = { ...exs[i], input: e.target.value }
                          update('examples', exs)
                        }}
                        placeholder="Input"
                        className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                      />
                      <input
                        value={ex.output}
                        onChange={(e) => {
                          const exs = [...problem.examples]
                          exs[i] = { ...exs[i], output: e.target.value }
                          update('examples', exs)
                        }}
                        placeholder="Output"
                        className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                      />
                      <input
                        value={ex.explanation || ''}
                        onChange={(e) => {
                          const exs = [...problem.examples]
                          exs[i] = { ...exs[i], explanation: e.target.value || undefined }
                          update('examples', exs)
                        }}
                        placeholder="Explanation (optional)"
                        className="w-full px-3 py-1.5 text-xs bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => update('examples', [...problem.examples, { input: '', output: '' }])}
                  className="flex items-center gap-1 text-xs text-[var(--accent-color)] hover:underline"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Add example
                </button>
              </div>
            </>
          )}

          {/* ─── Test Cases Tab ─── */}
          {activeTab === 'testcases' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {problem.testCases.filter((tc) => !tc.isHidden).length} visible, {problem.testCases.filter((tc) => tc.isHidden).length} hidden
                  </p>
                  <Field
                    label=""
                    value={String(problem.visibleTestCount)}
                    onChange={(v) => update('visibleTestCount', parseInt(v) || 0)}
                  />
                </div>
                <Button variant="outline" onClick={addTestCase}>
                  <PlusIcon className="w-4 h-4" /> Add Test Case
                </Button>
              </div>

              <div className="space-y-3">
                {problem.testCases.map((tc, i) => (
                  <div
                    key={tc.id}
                    className={`p-4 rounded-xl border ${
                      tc.isHidden
                        ? 'bg-[var(--bg-muted)] border-[var(--border-color)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--accent-color)]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">{tc.id}</span>
                        <Badge variant={tc.isHidden ? 'default' : 'primary'} size="sm">
                          {tc.isHidden ? 'Hidden' : 'Visible'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateTestCase(i, 'isHidden', !tc.isHidden)}
                          className="p-1.5 rounded hover:bg-[var(--bg-muted)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                          title={tc.isHidden ? 'Make visible' : 'Make hidden'}
                        >
                          {tc.isHidden ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeSlashIcon className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => removeTestCase(i)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      value={tc.description || ''}
                      onChange={(e) => updateTestCase(i, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-1.5 text-xs bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] mb-2"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Input</label>
                        {problem.parameters.map((param) => (
                          <div key={param.name} className="flex items-center gap-1 mb-1">
                            <span className="text-xs text-[var(--text-tertiary)] w-16 truncate font-mono">{param.name}:</span>
                            <input
                              value={tc.input[param.name] || ''}
                              onChange={(e) => updateTestCaseInput(i, param.name, e.target.value)}
                              placeholder={`${param.type}`}
                              className="flex-1 px-2 py-1 text-xs font-mono bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Expected Output</label>
                        <input
                          value={tc.expectedOutput}
                          onChange={(e) => updateTestCase(i, 'expectedOutput', e.target.value)}
                          placeholder="JSON value"
                          className="w-full px-2 py-1 text-xs font-mono bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ─── Starter Code Tab ─── */}
          {activeTab === 'startercode' && (
            <div className="space-y-4">
              {LANGUAGES.map((lang) => (
                <div key={lang}>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] mb-1 block capitalize">{lang}</label>
                  <textarea
                    value={problem.starterCode?.[lang] || ''}
                    onChange={(e) => update('starterCode', { ...problem.starterCode, [lang]: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] resize-y"
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ─── Solutions Tab ─── */}
          {activeTab === 'solutions' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-tertiary)]">
                Reference solutions are used for verification. They are never sent to the frontend.
              </p>
              {LANGUAGES.map((lang) => (
                <div key={lang}>
                  <label className="text-xs font-medium text-[var(--text-tertiary)] mb-1 block capitalize">{lang}</label>
                  <textarea
                    value={problem.referenceSolution?.[lang] || ''}
                    onChange={(e) => update('referenceSolution', { ...(problem.referenceSolution || {}), [lang]: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] resize-y"
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ─── AI Guidance Tab ─── */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <TextArea
                label="Hints (one per line — given to candidate if stuck)"
                value={problem.hints.join('\n')}
                onChange={(v) => update('hints', v.split('\n').filter(Boolean))}
                rows={4}
              />
              <TextArea
                label="Talking Points (one per line — what interviewer should probe)"
                value={problem.talkingPoints.join('\n')}
                onChange={(v) => update('talkingPoints', v.split('\n').filter(Boolean))}
                rows={4}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Expected Time Complexity"
                  value={problem.expectedComplexity?.time || ''}
                  onChange={(v) => update('expectedComplexity', { ...problem.expectedComplexity, time: v })}
                />
                <Field
                  label="Expected Space Complexity"
                  value={problem.expectedComplexity?.space || ''}
                  onChange={(v) => update('expectedComplexity', { ...problem.expectedComplexity, space: v })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Reusable Field Components ───────────────────────────

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      {label && <label className="text-xs font-medium text-[var(--text-tertiary)] mb-1 block">{label}</label>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="text-xs font-medium text-[var(--text-tertiary)] mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 text-sm bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] resize-y"
      />
    </div>
  )
}
