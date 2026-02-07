'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon, BookmarkIcon, TrashIcon, ArrowPathIcon, PencilIcon, CheckIcon, XMarkIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Question, ApplicationQASession } from '@/types/applicationQA'
import {
  getQASession,
  updateQASession,
  deleteQASession,
  addQuestionsToSession,
  regenerateQuestionAnswer,
} from '@/services/applicationQAService'

type MobileView = 'questions' | 'add'

export default function ApplicationQAEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const sessionId = params.id as string

  const [qaSession, setQASession] = useState<ApplicationQASession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Edit state for individual questions
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editedAnswer, setEditedAnswer] = useState<string>('')

  // Regeneration state
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)

  // Add questions state
  const [showAddQuestions, setShowAddQuestions] = useState(false)
  const [newQuestions, setNewQuestions] = useState<Array<{ question: string; wordLimit?: number }>>([])
  const [isAddingQuestions, setIsAddingQuestions] = useState(false)

  // Title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')

  // Mobile view state
  const [mobileView, setMobileView] = useState<MobileView>('questions')

  // Load session data
  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    const loadSession = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        setError(null)
        const response = await getQASession(sessionId, session.user.googleId)

        if (response.success && response.data) {
          setQASession(response.data)
          setEditedTitle(response.data.title)
        }
      } catch (err: any) {
        console.error('Failed to load Q&A session:', err)
        setError(err.message || 'Failed to load Q&A session')
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [sessionId, session?.user?.googleId, status, router])

  // Save session
  const handleSave = async () => {
    if (!qaSession || !session?.user?.googleId) return

    try {
      setIsSaving(true)
      setError(null)

      await updateQASession(sessionId, {
        questions: qaSession.questions,
        title: qaSession.title,
        googleId: session.user.googleId,
      })

      setHasUnsavedChanges(false)
    } catch (err: any) {
      console.error('Failed to save session:', err)
      setError(err.message || 'Failed to save session')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete session
  const handleDelete = async () => {
    if (!session?.user?.googleId) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this Q&A session? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      setIsDeleting(true)
      await deleteQASession(sessionId, session.user.googleId)
      router.push('/application-qa')
    } catch (err: any) {
      console.error('Failed to delete session:', err)
      setError(err.message || 'Failed to delete session')
      setIsDeleting(false)
    }
  }

  // Start editing a question's answer
  const startEditing = (question: Question) => {
    setEditingQuestionId(question.id)
    setEditedAnswer(question.answer)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingQuestionId(null)
    setEditedAnswer('')
  }

  // Save edited answer
  const saveEditedAnswer = () => {
    if (!qaSession || !editingQuestionId) return

    setQASession((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === editingQuestionId ? { ...q, answer: editedAnswer } : q
        ),
      }
    })
    setHasUnsavedChanges(true)
    setEditingQuestionId(null)
    setEditedAnswer('')
  }

  // Regenerate a single answer
  const handleRegenerate = async (questionId: string) => {
    if (!session?.user?.googleId) return

    try {
      setRegeneratingId(questionId)
      setError(null)

      const response = await regenerateQuestionAnswer(sessionId, questionId, {
        googleId: session.user.googleId,
      })

      if (response.success && response.data?.question) {
        setQASession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === questionId ? response.data.question : q
            ),
          }
        })
      }
    } catch (err: any) {
      console.error('Failed to regenerate answer:', err)
      setError(err.message || 'Failed to regenerate answer')
    } finally {
      setRegeneratingId(null)
    }
  }

  // Delete a question
  const handleDeleteQuestion = (questionId: string) => {
    if (!qaSession) return

    setQASession((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
      }
    })
    setHasUnsavedChanges(true)
  }

  // Add new question field
  const addNewQuestionField = () => {
    setNewQuestions((prev) => [...prev, { question: '', wordLimit: undefined }])
  }

  // Remove new question field
  const removeNewQuestionField = (index: number) => {
    setNewQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  // Update new question field
  const updateNewQuestion = (index: number, field: 'question' | 'wordLimit', value: string | number) => {
    setNewQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? { ...q, [field]: field === 'wordLimit' ? (value as number || undefined) : value }
          : q
      )
    )
  }

  // Submit new questions
  const handleAddQuestions = async () => {
    if (!session?.user?.googleId) return

    const validQuestions = newQuestions.filter((q) => q.question.trim().length > 0)
    if (validQuestions.length === 0) return

    try {
      setIsAddingQuestions(true)
      setError(null)

      const response = await addQuestionsToSession(sessionId, {
        questions: validQuestions.map((q) => ({
          question: q.question.trim(),
          wordLimit: q.wordLimit,
        })),
        googleId: session.user.googleId,
      })

      if (response.success && response.data?.questions) {
        setQASession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            questions: response.data.questions,
          }
        })
        setNewQuestions([])
        setShowAddQuestions(false)
      }
    } catch (err: any) {
      console.error('Failed to add questions:', err)
      setError(err.message || 'Failed to add questions')
    } finally {
      setIsAddingQuestions(false)
    }
  }

  // Save title
  const saveTitle = () => {
    if (!qaSession) return

    setQASession((prev) => {
      if (!prev) return prev
      return { ...prev, title: editedTitle }
    })
    setHasUnsavedChanges(true)
    setIsEditingTitle(false)
  }

  // Count words in a string
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length
  }

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Handle back navigation
  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      )
      if (!confirmed) return
    }
    router.push('/application-qa')
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-[var(--bg-body)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error && !qaSession) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-[var(--bg-body)]">
        <div className="text-center">
          <p className="text-[var(--error)] mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/application-qa')}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-[var(--bg-body)] flex flex-col">
      {/* Header */}
      <header className="sticky top-16 z-40 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>

            <div className="h-6 w-px bg-[var(--border-color)]" />

            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="px-2 py-1 text-sm font-semibold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle()
                    if (e.key === 'Escape') setIsEditingTitle(false)
                  }}
                />
                <button onClick={saveTitle} className="p-1 hover:bg-[var(--bg-muted)] rounded">
                  <CheckIcon className="w-4 h-4 text-[var(--success)]" />
                </button>
                <button onClick={() => setIsEditingTitle(false)} className="p-1 hover:bg-[var(--bg-muted)] rounded">
                  <XMarkIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-2 hover:bg-[var(--bg-muted)] px-2 py-1 rounded-lg transition-colors"
              >
                <h1 className="font-semibold text-[var(--text-primary)] truncate max-w-[300px]">
                  {qaSession?.title || 'Untitled Q&A Session'}
                </h1>
                <PencilIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </button>
            )}

            {hasUnsavedChanges && (
              <span className="text-xs text-[var(--text-tertiary)]">• Unsaved changes</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-[var(--error)] hover:bg-[var(--error-light)]"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <BookmarkIcon className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="shrink-0 !px-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="font-semibold text-[var(--text-primary)] truncate text-sm">
                  {qaSession?.title || 'Untitled Q&A Session'}
                </h1>
                {hasUnsavedChanges && (
                  <span className="text-[10px] text-[var(--text-tertiary)]">Unsaved changes</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="shrink-0 !px-2 text-[var(--error)]"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving || !hasUnsavedChanges}
                className="shrink-0 !px-3"
              >
                <BookmarkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile view toggle */}
          <div className="flex items-center justify-center px-3 pb-2">
            <div className="flex items-center bg-[var(--bg-muted)] rounded-lg p-0.5">
              <button
                onClick={() => setMobileView('questions')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors',
                  mobileView === 'questions'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                )}
              >
                Q&A ({qaSession?.questions?.length || 0})
              </button>
              <button
                onClick={() => {
                  setMobileView('add')
                  if (newQuestions.length === 0) addNewQuestionField()
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors',
                  mobileView === 'add'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                )}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-[var(--error-light)] border-t border-[var(--error)]">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}
      </header>

      {/* Main Content - Desktop */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Questions & Answers Panel */}
        <div className="flex-1 h-[calc(100vh-120px)] overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {qaSession?.questions && qaSession.questions.length > 0 ? (
              qaSession.questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden"
                >
                  {/* Question Header */}
                  <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-muted)]">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-sm font-medium"
                        style={{ color: 'var(--accent-color)' }}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-primary)] font-medium">{question.question}</p>
                        {question.wordLimit && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            Word limit: {question.wordLimit}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="p-5">
                    {editingQuestionId === question.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editedAnswer}
                          onChange={(e) => setEditedAnswer(e.target.value)}
                          rows={6}
                          className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-body)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {countWords(editedAnswer)} words
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={saveEditedAnswer}
                            >
                              Save Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap leading-relaxed">
                          {question.answer || 'No answer generated yet.'}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {countWords(question.answer)} words
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="text-[var(--error)] hover:bg-[var(--error-light)]"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(question)}
                            >
                              <PencilIcon className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRegenerate(question.id)}
                              isLoading={regeneratingId === question.id}
                              disabled={regeneratingId !== null}
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[var(--text-tertiary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  No questions yet
                </h3>
                <p className="text-[var(--text-secondary)] mb-4">
                  Add your first question to get AI-generated answers
                </p>
              </div>
            )}

            {/* Add Questions Section */}
            <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
              <button
                onClick={() => {
                  setShowAddQuestions(!showAddQuestions)
                  if (!showAddQuestions && newQuestions.length === 0) {
                    addNewQuestionField()
                  }
                }}
                className="w-full flex items-center justify-between px-5 py-4 bg-[var(--bg-elevated)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                    <PlusIcon className="w-5 h-5 text-[var(--accent-color)]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[var(--text-primary)]">Add More Questions</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Free - no credit cost</p>
                  </div>
                </div>
                {showAddQuestions ? (
                  <ChevronUpIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                )}
              </button>

              <AnimatePresence>
                {showAddQuestions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 border-t border-[var(--border-color)] space-y-4">
                      {newQuestions.map((q, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-body)] space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-xs font-medium"
                              style={{ color: 'var(--accent-color)' }}
                            >
                              +
                            </span>
                            <div className="flex-1 space-y-3">
                              <textarea
                                value={q.question}
                                onChange={(e) => updateNewQuestion(index, 'question', e.target.value)}
                                rows={2}
                                placeholder="Enter your application question..."
                                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                              />
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-[var(--text-secondary)]">
                                    Word limit
                                  </label>
                                  <input
                                    type="number"
                                    value={q.wordLimit || ''}
                                    onChange={(e) => updateNewQuestion(index, 'wordLimit', parseInt(e.target.value) || 0)}
                                    placeholder="Auto"
                                    min={10}
                                    max={1000}
                                    className="w-20 px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeNewQuestionField(index)}
                                  className="ml-auto p-1.5 rounded-lg hover:bg-[var(--error-light)] transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4 text-[var(--error)]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addNewQuestionField}
                        className="w-full p-3 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <PlusIcon className="w-4 h-4 text-[var(--accent-color)]" />
                        <span className="text-sm font-medium text-[var(--accent-color)]">
                          Add Another Question
                        </span>
                      </button>

                      <div className="flex justify-end gap-3 pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setNewQuestions([])
                            setShowAddQuestions(false)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleAddQuestions}
                          isLoading={isAddingQuestions}
                          disabled={newQuestions.every((q) => !q.question.trim()) || isAddingQuestions}
                        >
                          Generate Answers
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile */}
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          {mobileView === 'questions' ? (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100vh-152px)] overflow-y-auto"
            >
              <div className="p-4 pb-24 space-y-4">
                {qaSession?.questions && qaSession.questions.length > 0 ? (
                  qaSession.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden"
                    >
                      {/* Question */}
                      <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-muted)]">
                        <div className="flex items-start gap-2">
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-xs font-medium"
                            style={{ color: 'var(--accent-color)' }}
                          >
                            {index + 1}
                          </span>
                          <p className="text-[var(--text-primary)] text-sm font-medium flex-1">
                            {question.question}
                          </p>
                        </div>
                      </div>

                      {/* Answer */}
                      <div className="p-4">
                        {editingQuestionId === question.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editedAnswer}
                              onChange={(e) => setEditedAnswer(e.target.value)}
                              rows={6}
                              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-body)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                                Cancel
                              </Button>
                              <Button variant="primary" size="sm" onClick={saveEditedAnswer}>
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap leading-relaxed">
                              {question.answer || 'No answer generated yet.'}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-color)]">
                              <span className="text-xs text-[var(--text-tertiary)]">
                                {countWords(question.answer)} words
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  className="p-2 rounded-lg hover:bg-[var(--error-light)] transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4 text-[var(--error)]" />
                                </button>
                                <button
                                  onClick={() => startEditing(question)}
                                  className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                                >
                                  <PencilIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                                </button>
                                <button
                                  onClick={() => handleRegenerate(question.id)}
                                  disabled={regeneratingId !== null}
                                  className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors disabled:opacity-50"
                                >
                                  <ArrowPathIcon className={cn('w-4 h-4 text-[var(--text-secondary)]', regeneratingId === question.id && 'animate-spin')} />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[var(--text-secondary)]">No questions yet</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">
                      Tap "Add" to add your first question
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="add"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100vh-152px)] overflow-y-auto"
            >
              <div className="p-4 pb-24 space-y-4">
                <p className="text-sm text-[var(--text-secondary)] text-center">
                  Add questions and get AI-generated answers for free
                </p>

                {newQuestions.map((q, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] space-y-3"
                  >
                    <textarea
                      value={q.question}
                      onChange={(e) => updateNewQuestion(index, 'question', e.target.value)}
                      rows={2}
                      placeholder="Enter your application question..."
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-body)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[var(--text-secondary)]">Limit:</label>
                        <input
                          type="number"
                          value={q.wordLimit || ''}
                          onChange={(e) => updateNewQuestion(index, 'wordLimit', parseInt(e.target.value) || 0)}
                          placeholder="Auto"
                          min={10}
                          max={1000}
                          className="w-16 px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-body)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                        />
                      </div>
                      <button
                        onClick={() => removeNewQuestionField(index)}
                        className="p-1.5 rounded-lg hover:bg-[var(--error-light)] transition-colors"
                      >
                        <TrashIcon className="w-4 h-4 text-[var(--error)]" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addNewQuestionField}
                  className="w-full p-3 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] transition-colors flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4 text-[var(--accent-color)]" />
                  <span className="text-sm font-medium text-[var(--accent-color)]">Add Question</span>
                </button>
              </div>

              {/* Mobile floating action button */}
              <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAddQuestions}
                  isLoading={isAddingQuestions}
                  disabled={newQuestions.every((q) => !q.question.trim()) || isAddingQuestions}
                  className="shadow-lg"
                >
                  Generate Answers
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
