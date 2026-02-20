'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  ArrowLeftIcon,
  PlusIcon,
  BriefcaseIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RoleCard,
  CreateRoleModal,
  EditRoleModal,
  DeleteRoleModal,
  SubmitDataModal,
} from '@/components/interview-prep'
import type { RoleFormData } from '@/components/interview-prep/RoleForm'
import {
  getCompanyWithRoles,
  listCompanies,
  createRole,
  updateRole,
  deleteRole,
} from '@/services/interviewPrepService'
import type { Company, CompanyListItem, RoleSummary, RoleDetails } from '@/types/interviewPrep'

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; role: RoleDetails }
  | { type: 'delete'; role: RoleSummary }
  | { type: 'submit' }

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const { data: session } = useSession()
  const isAdmin = session?.user?.isAdmin === true

  const [company, setCompany] = useState<Company | null>(null)
  const [allCompanies, setAllCompanies] = useState<CompanyListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null)
  const [logoFailed, setLogoFailed] = useState(false)

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [showLevelMenu, setShowLevelMenu] = useState(false)

  const detailsCache = useRef<Map<string, RoleDetails>>(new Map())

  // ─── Fetch ──────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [companyRes, companiesRes] = await Promise.all([
          getCompanyWithRoles(companyId),
          listCompanies(),
        ])
        if (companyRes.success) {
          setCompany(companyRes.data)
        } else {
          setError('Failed to load company')
        }
        if (companiesRes.success) {
          setAllCompanies(companiesRes.data)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load company')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [companyId])

  const roles = company?.roles ?? []

  const LEVEL_OPTIONS = ['intern', 'junior', 'mid', 'senior', 'staff'] as const

  const filteredRoles = useMemo(() => {
    let result = [...roles]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.department?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      )
    }

    if (levelFilter !== 'all') {
      result = result.filter((r) => r.level === levelFilter)
    }

    return result
  }, [roles, searchQuery, levelFilter])

  // ─── Admin Handlers ─────────────────────────────────

  const handleCreateRole = async (data: RoleFormData) => {
    if (!session?.user?.googleId || !company) return
    try {
      setIsSubmitting(true)
      setError(null)
      const res = await createRole({
        companyId: company.id,
        title: data.title,
        level: data.level,
        department: data.department || undefined,
        description: data.description || undefined,
        rounds: data.rounds.length > 0 ? data.rounds : undefined,
        tips: data.tips.length > 0 ? data.tips : undefined,
        googleId: session.user.googleId,
      })
      if (res.success) {
        setCompany((prev) =>
          prev
            ? {
                ...prev,
                roles: [
                  ...prev.roles,
                  {
                    id: res.data.id,
                    title: res.data.title,
                    level: res.data.level as RoleSummary['level'],
                    department: res.data.department,
                    description: res.data.description,
                    roundCount: res.data.rounds.length,
                  },
                ],
              }
            : prev
        )
        setModal({ type: 'none' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create role')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRole = async (data: RoleFormData) => {
    if (!session?.user?.googleId || modal.type !== 'edit') return
    const roleId = modal.role.id
    try {
      setIsSubmitting(true)
      setError(null)
      const res = await updateRole(roleId, {
        title: data.title,
        level: data.level,
        department: data.department || undefined,
        description: data.description || undefined,
        rounds: data.rounds.length > 0 ? data.rounds : undefined,
        tips: data.tips.length > 0 ? data.tips : undefined,
        googleId: session.user.googleId,
      })
      if (res.success) {
        detailsCache.current.delete(roleId)
        setCompany((prev) =>
          prev
            ? {
                ...prev,
                roles: prev.roles.map((r) =>
                  r.id === roleId
                    ? {
                        ...r,
                        title: res.data.title,
                        level: res.data.level as RoleSummary['level'],
                        department: res.data.department,
                        description: res.data.description,
                        roundCount: res.data.rounds.length,
                      }
                    : r
                ),
              }
            : prev
        )
        setExpandedRoleId(null)
        setModal({ type: 'none' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!session?.user?.googleId || modal.type !== 'delete') return
    const roleId = modal.role.id
    try {
      setIsSubmitting(true)
      setError(null)
      const res = await deleteRole(roleId, session.user.googleId)
      if (res.success) {
        detailsCache.current.delete(roleId)
        setCompany((prev) =>
          prev ? { ...prev, roles: prev.roles.filter((r) => r.id !== roleId) } : prev
        )
        if (expandedRoleId === roleId) setExpandedRoleId(null)
        setModal({ type: 'none' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete role')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Loading State ──────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-5 w-40 bg-[var(--bg-muted)] rounded mb-8" />
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-[var(--bg-muted)]" />
              <div className="space-y-2">
                <div className="h-8 w-56 bg-[var(--bg-muted)] rounded" />
                <div className="h-5 w-32 bg-[var(--bg-muted)] rounded" />
              </div>
            </div>
            <div className="h-4 w-full max-w-lg bg-[var(--bg-muted)] rounded mb-2" />
            <div className="h-4 w-2/3 bg-[var(--bg-muted)] rounded mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-[var(--bg-muted)] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Error / 404 State ──────────────────────────────

  if (error && !company) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
            <BriefcaseIcon className="w-10 h-10 text-[var(--text-tertiary)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Company not found
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            {error || 'This company does not exist or has been removed.'}
          </p>
          <Link href="/interview-prep">
            <Button variant="primary">Back to Companies</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!company) return null

  // ─── Main Render ────────────────────────────────────

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href="/interview-prep"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--accent-color)] transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            All Companies
          </Link>
        </motion.div>

        {/* Company Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-5">
              {/* Logo */}
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden shadow-sm">
                {company.logo && !logoFailed ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-full h-full object-contain p-2"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <span
                    className="text-2xl font-bold"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    {company.name.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                  {company.name}
                </h1>
                {company.industry && (
                  <Badge variant="primary" size="md" className="mt-1.5">
                    {company.industry}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {session && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setModal({ type: 'submit' })}
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  Submit Data
                </Button>
              )}
              {/* Admin: Add Role */}
              {isAdmin && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setModal({ type: 'create' })}
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Role
                </Button>
              )}
            </div>
          </div>

          {/* Description + Interview Style */}
          {(company.description || company.interviewStyle) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {company.description && (
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                    About
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {company.description}
                  </p>
                </div>
              )}
              {company.interviewStyle && (
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                    Interview Style
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {company.interviewStyle}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Error Banner (for CRUD errors after page load) */}
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

        {/* Roles Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Roles
              {roles.length > 0 && (
                <span className="ml-2 text-base font-normal text-[var(--text-tertiary)]">
                  ({roles.length})
                </span>
              )}
            </h2>
          </div>

          {/* Toolbar: Search + Level Filter */}
          {roles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3 mb-6"
            >
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search roles..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
                />
              </div>

              {/* Level Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowLevelMenu(!showLevelMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors whitespace-nowrap"
                >
                  {levelFilter === 'all'
                    ? 'All Levels'
                    : levelFilter.charAt(0).toUpperCase() + levelFilter.slice(1)}
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {showLevelMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowLevelMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 top-12 z-20 w-40 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setLevelFilter('all')
                          setShowLevelMenu(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          levelFilter === 'all'
                            ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        All Levels
                      </button>
                      {LEVEL_OPTIONS.map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => {
                            setLevelFilter(lvl)
                            setShowLevelMenu(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            levelFilter === lvl
                              ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                              : 'text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                          }`}
                        >
                          {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {roles.length > 0 ? (
            filteredRoles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.map((role, index) => (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <RoleCard
                      role={role}
                      isAdmin={isAdmin}
                      isExpanded={expandedRoleId === role.id}
                      onToggle={() =>
                        setExpandedRoleId((prev) =>
                          prev === role.id ? null : role.id
                        )
                      }
                      detailsCache={detailsCache}
                      onEdit={(roleDetails) =>
                        setModal({ type: 'edit', role: roleDetails })
                      }
                      onDelete={(roleSummary) =>
                        setModal({ type: 'delete', role: roleSummary })
                      }
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                  <BriefcaseIcon className="w-10 h-10 text-[var(--text-tertiary)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  No roles match your search
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Try a different search term or filter
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                <BriefcaseIcon className="w-10 h-10 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                No roles yet
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                Roles will appear here once they are added for {company.name}.
              </p>
              {isAdmin && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setModal({ type: 'create' })}
                >
                  <PlusIcon className="w-5 h-5" />
                  Add First Role
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Admin Modals ─── */}

      <CreateRoleModal
        isOpen={modal.type === 'create'}
        onClose={() => setModal({ type: 'none' })}
        onSubmit={handleCreateRole}
        isSubmitting={isSubmitting}
      />

      <EditRoleModal
        isOpen={modal.type === 'edit'}
        onClose={() => setModal({ type: 'none' })}
        onSubmit={handleUpdateRole}
        role={modal.type === 'edit' ? modal.role : null}
        isSubmitting={isSubmitting}
      />

      <DeleteRoleModal
        isOpen={modal.type === 'delete'}
        onClose={() => setModal({ type: 'none' })}
        onConfirm={handleDeleteRole}
        role={modal.type === 'delete' ? modal.role : null}
        isSubmitting={isSubmitting}
      />

      <SubmitDataModal
        isOpen={modal.type === 'submit'}
        onClose={() => setModal({ type: 'none' })}
        companies={allCompanies}
        preSelectedCompanyId={company?.id}
      />
    </div>
  )
}
