'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '@/services/interviewPrepService'
import {
  CreateCompanyModal,
  EditCompanyModal,
  DeleteCompanyModal,
  ViewCompanyModal,
} from '@/components/interview-prep'
import type { CompanyFormData } from '@/components/interview-prep'
import type { CompanyListItem } from '@/types/interviewPrep'

type SortOrder = 'a-z' | 'z-a'

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; company: CompanyListItem }
  | { type: 'delete'; company: CompanyListItem }
  | { type: 'view'; company: CompanyListItem }

export default function InterviewPrepPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.isAdmin === true

  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('a-z')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showIndustryMenu, setShowIndustryMenu] = useState(false)

  // Admin modal state
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true)
        const response = await listCompanies()
        if (response.success) {
          setCompanies(response.data)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load companies')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  // Derive unique industries for the filter
  const industries = useMemo(() => {
    const set = new Set<string>()
    companies.forEach((c) => {
      if (c.industry) set.add(c.industry)
    })
    return Array.from(set).sort()
  }, [companies])

  // Filter and sort
  const filteredCompanies = useMemo(() => {
    let result = [...companies]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      )
    }

    if (industryFilter !== 'all') {
      result = result.filter((c) => c.industry === industryFilter)
    }

    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name)
      return sortOrder === 'a-z' ? cmp : -cmp
    })

    return result
  }, [companies, searchQuery, industryFilter, sortOrder])

  // ─── Admin Handlers ────────────────────────────────

  const handleCreateCompany = async (data: CompanyFormData) => {
    if (!session?.user?.googleId) return

    try {
      setIsSubmitting(true)
      setError(null)
      const response = await createCompany(
        {
          name: data.name,
          industry: data.industry,
          description: data.description,
          interviewStyle: data.interviewStyle,
          googleId: session.user.googleId,
        },
        data.logoFile
      )
      if (response.success) {
        setCompanies((prev) => [
          ...prev,
          {
            id: response.data.id,
            name: response.data.name,
            logo: response.data.logo,
            industry: response.data.industry,
            description: response.data.description,
            interviewStyle: response.data.interviewStyle,
          },
        ])
        setModal({ type: 'none' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create company')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCompany = async (data: CompanyFormData) => {
    if (!session?.user?.googleId || modal.type !== 'edit') return
    const companyId = modal.company.id

    try {
      setIsSubmitting(true)
      setError(null)
      const response = await updateCompany(
        companyId,
        {
          name: data.name,
          industry: data.industry,
          description: data.description,
          interviewStyle: data.interviewStyle,
          googleId: session.user.googleId,
        },
        data.logoFile
      )
      if (response.success) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  name: response.data.name,
                  logo: response.data.logo,
                  industry: response.data.industry,
                  description: response.data.description,
                  interviewStyle: response.data.interviewStyle,
                }
              : c
          )
        )
        setModal({ type: 'none' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update company')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (!session?.user?.googleId || modal.type !== 'delete') return
    const companyId = modal.company.id

    try {
      setIsSubmitting(true)
      setError(null)
      const response = await deleteCompany(companyId, session.user.googleId)
      if (response.success) {
        setCompanies((prev) => prev.filter((c) => c.id !== companyId))
        setModal({ type: 'none' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete company')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Loading State ─────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 w-72 bg-[var(--bg-muted)] rounded-lg mb-2" />
            <div className="h-5 w-96 bg-[var(--bg-muted)] rounded-lg mb-8" />
            <div className="flex gap-3 mb-8">
              <div className="h-12 w-80 bg-[var(--bg-muted)] rounded-xl" />
              <div className="h-12 w-36 bg-[var(--bg-muted)] rounded-xl" />
              <div className="h-12 w-32 bg-[var(--bg-muted)] rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 bg-[var(--bg-muted)] rounded-xl" />
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                Interview Prep
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Choose a company and role to start your mock interview
              </p>
            </div>
            {isAdmin && (
              <Button variant="primary" size="md" onClick={() => setModal({ type: 'create' })}>
                <PlusIcon className="w-5 h-5" />
                Add Company
              </Button>
            )}
          </div>
        </motion.div>

        {/* Toolbar: Search + Industry Filter + Sort */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
            />
          </div>

          {/* Industry Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowIndustryMenu(!showIndustryMenu)
                setShowSortMenu(false)
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors whitespace-nowrap"
            >
              {industryFilter === 'all' ? 'All Industries' : industryFilter}
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {showIndustryMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowIndustryMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 z-20 w-44 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setIndustryFilter('all')
                      setShowIndustryMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      industryFilter === 'all'
                        ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    All Industries
                  </button>
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => {
                        setIndustryFilter(ind)
                        setShowIndustryMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        industryFilter === ind
                          ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSortMenu(!showSortMenu)
                setShowIndustryMenu(false)
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors whitespace-nowrap"
            >
              Sort: {sortOrder === 'a-z' ? 'A → Z' : 'Z → A'}
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 z-20 w-36 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setSortOrder('a-z')
                      setShowSortMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      sortOrder === 'a-z'
                        ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    A → Z
                  </button>
                  <button
                    onClick={() => {
                      setSortOrder('z-a')
                      setShowSortMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      sortOrder === 'z-a'
                        ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    Z → A
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-xl flex items-center justify-between">
            <p className="text-sm text-[var(--error)]">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-[var(--error)] hover:text-[var(--error)]/80"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Company Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="group bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden hover:border-[var(--accent-color)] hover:shadow-[var(--shadow-md)] transition-all"
                >
                  <Link href={`/interview-prep/${company.id}`}>
                    <div className="p-5">
                      {/* Company Header */}
                      <div className="flex items-start gap-4 mb-3">
                        {/* Logo */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-full h-full object-contain p-1.5"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement!.innerHTML = `<span class="text-lg font-bold" style="color: var(--accent-color)">${company.name.charAt(0)}</span>`
                              }}
                            />
                          ) : (
                            <span
                              className="text-lg font-bold"
                              style={{ color: 'var(--accent-color)' }}
                            >
                              {company.name.charAt(0)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-color)] transition-colors">
                            {company.name}
                          </h3>
                          {company.industry && (
                            <Badge variant="primary" size="sm" className="mt-1">
                              {company.industry}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {company.description && (
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                          {company.description}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="px-5 pb-4 flex gap-1 justify-end border-t border-[var(--border-color)] pt-3">
                      <button
                        onClick={() => setModal({ type: 'view', company })}
                        className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-colors"
                        title="View details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'edit', company })}
                        className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-colors"
                        title="Edit company"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', company })}
                        className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                        title="Delete company"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                <BuildingOffice2Icon className="w-10 h-10 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                {searchQuery || industryFilter !== 'all'
                  ? 'No companies match your search'
                  : 'No companies yet'}
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {searchQuery || industryFilter !== 'all'
                  ? 'Try a different search term or filter'
                  : 'Companies will appear here once they are added'}
              </p>
              {isAdmin && !searchQuery && industryFilter === 'all' && (
                <Button variant="primary" size="lg" onClick={() => setModal({ type: 'create' })}>
                  <PlusIcon className="w-5 h-5" />
                  Add First Company
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Admin Modals ─────────────────────────────── */}

      <CreateCompanyModal
        isOpen={modal.type === 'create'}
        onClose={() => setModal({ type: 'none' })}
        onSubmit={handleCreateCompany}
        isSubmitting={isSubmitting}
      />

      <EditCompanyModal
        isOpen={modal.type === 'edit'}
        onClose={() => setModal({ type: 'none' })}
        onSubmit={handleUpdateCompany}
        company={modal.type === 'edit' ? modal.company : null}
        isSubmitting={isSubmitting}
      />

      <DeleteCompanyModal
        isOpen={modal.type === 'delete'}
        onClose={() => setModal({ type: 'none' })}
        onConfirm={handleDeleteCompany}
        company={modal.type === 'delete' ? modal.company : null}
        isSubmitting={isSubmitting}
      />

      <ViewCompanyModal
        isOpen={modal.type === 'view'}
        onClose={() => setModal({ type: 'none' })}
        onEdit={() => {
          if (modal.type === 'view') setModal({ type: 'edit', company: modal.company })
        }}
        company={modal.type === 'view' ? modal.company : null}
      />
    </div>
  )
}
