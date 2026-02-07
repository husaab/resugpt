'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MagnifyingGlassIcon, ChevronDownIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { listQASessions, deleteQASession } from '@/services/applicationQAService'
import { ApplicationQAListItem } from '@/types/applicationQA'

type SortOrder = 'newest' | 'oldest'

export default function ApplicationQAListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [sessions, setSessions] = useState<ApplicationQAListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [showSortMenu, setShowSortMenu] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ApplicationQAListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        const response = await listQASessions(session.user.googleId)
        if (response.success) {
          setSessions(response.data)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load Q&A sessions')
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.googleId) {
      fetchSessions()
    }
  }, [session?.user?.googleId])

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((s) => s.title.toLowerCase().includes(query))
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [sessions, searchQuery, sortOrder])

  const handleDeleteClick = (qa: ApplicationQAListItem) => {
    setDeleteTarget(qa)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !session?.user?.googleId) return

    try {
      setIsDeleting(true)
      await deleteQASession(deleteTarget.id, session.user.googleId)
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete session')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 w-64 bg-[var(--bg-muted)] rounded-lg mb-8" />
            <div className="flex gap-3 mb-8">
              <div className="h-12 w-80 bg-[var(--bg-muted)] rounded-xl" />
              <div className="h-12 w-32 bg-[var(--bg-muted)] rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-[var(--bg-muted)] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              Application Q&A Sessions
            </h1>
            <Link href="/application-qa/new">
              <Button variant="primary" size="md">
                <PlusIcon className="w-5 h-5" />
                New Session
              </Button>
            </Link>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title..."
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-12 z-20 w-36 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setSortOrder('newest')
                        setShowSortMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                    >
                      Newest first
                    </button>
                    <button
                      onClick={() => {
                        setSortOrder('oldest')
                        setShowSortMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                    >
                      Oldest first
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-xl">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((qa, index) => (
                <motion.div
                  key={qa.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden hover:border-[var(--accent-color)] transition-colors"
                >
                  <Link href={`/application-qa/${qa.id}`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-color)] transition-colors">
                            {qa.title}
                          </h3>
                          <p className="text-sm text-[var(--text-tertiary)] mt-1">
                            {formatDate(qa.updatedAt)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                            <span className="text-sm font-semibold text-[var(--accent-color)]">
                              {qa.questionCount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {qa.questionCount} question{qa.questionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </Link>
                  <div className="px-5 pb-4 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteClick(qa)
                      }}
                      className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[var(--text-tertiary)]"
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
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                {searchQuery ? 'No sessions match your search' : 'No Q&A sessions yet'}
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start your first Q&A session to get AI-generated answers'}
              </p>
              {!searchQuery && (
                <Link href="/application-qa/new">
                  <Button variant="primary" size="lg">
                    <PlusIcon className="w-5 h-5" />
                    Start New Session
                  </Button>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Delete Q&A Session
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Are you sure you want to delete "{deleteTarget.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                className="bg-[var(--error)] hover:bg-[var(--error)]"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
