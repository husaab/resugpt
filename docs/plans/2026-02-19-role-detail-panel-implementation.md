# Role Detail Panel Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the inline-expanding RoleCard with a clean tabbed detail panel that renders below the role card grid, eliminating layout shifts.

**Architecture:** RoleCard becomes a slim summary-only clickable card. A new RoleDetailPanel component renders below the grid with tabs (Tips, Rounds, Questions). The page orchestrates selection state, and the panel handles its own data loading via the existing cache/service pattern.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Framer Motion, Heroicons, existing CSS variable design system.

---

### Task 1: Simplify RoleCard to Summary-Only

**Files:**
- Modify: `src/components/interview-prep/RoleCard.tsx`

**Step 1: Update props interface**

Replace the current `RoleCardProps` interface. Remove expansion-related props (`isExpanded`, `onToggle`, `detailsCache`) and add selection props (`isSelected`, `onSelect`). Keep admin props (`isAdmin`, `onEdit`, `onDelete`), but change `onEdit` to accept `RoleSummary` instead of `RoleDetails` since the card no longer has details.

New interface:
```typescript
interface RoleCardProps {
  role: RoleSummary
  isAdmin: boolean
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void   // parent handles getting details
  onDelete: (role: RoleSummary) => void
}
```

**Step 2: Strip expansion logic from component body**

Remove:
- `details` state (`useState<RoleDetails | null>`)
- `isFetchingDetails` state
- `fetchError` state
- `openQuestion` state
- `handleToggle` async function
- All imports only used by expansion: `AnimatePresence`, `ClockIcon`, `LightBulbIcon`, `getRoleDetails`, `RoleDetails`, `InterviewRound`

**Step 3: Rewrite the component render**

The entire card becomes clickable via `onSelect`. The card body shows:
- Title + level badge
- Department (optional)
- Description (2-line clamp)
- Round count badge
- Admin buttons (edit/delete) in top-right with `e.stopPropagation()`

Selected state styling: when `isSelected` is true, apply accent border + glow:
```
className={`... ${isSelected ? 'border-[var(--accent-color)] shadow-[0_0_0_1px_var(--accent-color),0_0_20px_-5px_var(--accent-color)]' : 'border-[var(--border-color)]'}`}
```

Remove the expand toggle button and the entire `AnimatePresence` expansion panel (lines 140-350 in current file).

The edit button should call `onEdit()` (no arguments — the parent page will handle fetching details for edit). Keep it always enabled since we're removing the "must expand first" restriction.

**Step 4: Verify visually**

Run: `npm run dev`
Navigate to a company page. Cards should render as a clean grid with no expand buttons. Clicking a card does nothing visible yet (selection state not wired up in parent). Admin buttons should be visible.

**Step 5: Commit**

```bash
git add src/components/interview-prep/RoleCard.tsx
git commit -m "refactor: simplify RoleCard to summary-only clickable card"
```

---

### Task 2: Create RoleDetailPanel Component

**Files:**
- Create: `src/components/interview-prep/RoleDetailPanel.tsx`

**Step 1: Create the file with imports, types, and component skeleton**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  LightBulbIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { getRoleDetails } from '@/services/interviewPrepService'
import type { RoleSummary, RoleDetails, InterviewRound } from '@/types/interviewPrep'
import type { BadgeProps } from '@/components/ui/badge'

type TabId = 'tips' | 'rounds' | 'questions'

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

interface RoleDetailPanelProps {
  roleId: string
  detailsCache: React.MutableRefObject<Map<string, RoleDetails>>
  onClose: () => void
  isAdmin: boolean
  onEdit: (role: RoleDetails) => void
  onDelete: (role: RoleSummary) => void
}
```

**Step 2: Implement the data loading logic**

Inside the component, use `useEffect` keyed on `roleId` to:
1. Check `detailsCache.current.has(roleId)` — if yes, set `details` from cache
2. If not, call `getRoleDetails(roleId)`, store in cache, set `details`
3. Handle loading (`isLoading`) and error (`fetchError`) states
4. Reset `activeTab` to 'rounds' when `roleId` changes (unless details have tips, then default to 'tips' — but we won't know until data loads, so default to 'rounds' and let the tab bar handle visibility)

```typescript
export function RoleDetailPanel({
  roleId,
  detailsCache,
  onClose,
  isAdmin,
  onEdit,
  onDelete,
}: RoleDetailPanelProps) {
  const [details, setDetails] = useState<RoleDetails | null>(
    detailsCache.current.get(roleId) ?? null
  )
  const [isLoading, setIsLoading] = useState(!detailsCache.current.has(roleId))
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('rounds')
  const [openRound, setOpenRound] = useState<number | null>(null)
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)

  useEffect(() => {
    const cached = detailsCache.current.get(roleId)
    if (cached) {
      setDetails(cached)
      setIsLoading(false)
      setFetchError(null)
      setActiveTab('rounds')
      setOpenRound(null)
      setOpenQuestion(null)
      return
    }

    let cancelled = false
    const fetchDetails = async () => {
      try {
        setIsLoading(true)
        setFetchError(null)
        setDetails(null)
        const res = await getRoleDetails(roleId)
        if (cancelled) return
        if (res.success) {
          detailsCache.current.set(roleId, res.data)
          setDetails(res.data)
        } else {
          setFetchError('Failed to load role details')
        }
      } catch (err: any) {
        if (!cancelled) setFetchError(err.message || 'Failed to load role details')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchDetails()
    setActiveTab('rounds')
    setOpenRound(null)
    setOpenQuestion(null)

    return () => { cancelled = true }
  }, [roleId, detailsCache])
```

**Step 3: Implement the panel header**

The header shows:
- Role title + level badge + department text
- Admin edit/delete buttons (if `isAdmin`)
- Close button (X)

```tsx
// Inside the return:
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
  className="overflow-hidden"
>
  <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl mt-6">
    {/* Header */}
    <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
      <div className="flex items-center gap-3 flex-wrap min-w-0">
        {details ? (
          <>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {details.title}
            </h3>
            <Badge variant={LEVEL_VARIANT[details.level]} size="sm">
              {details.level}
            </Badge>
            {details.department && (
              <span className="text-sm text-[var(--text-tertiary)]">
                {details.department}
              </span>
            )}
          </>
        ) : (
          <div className="h-6 w-48 bg-[var(--bg-muted)] rounded animate-pulse" />
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isAdmin && details && (
          <>
            <button
              onClick={() => onEdit(details)}
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-light)] transition-colors"
              title="Edit role"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(details)}
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
              title="Delete role"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors ml-1"
          title="Close panel"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
```

**Step 4: Implement the tab bar**

Horizontal pill-style tabs. "Tips" tab only shown if tips exist. "Rounds" is default.

```tsx
    {/* Tab Bar */}
    {details && !isLoading && (
      <div className="px-5 pt-4 flex gap-1">
        {details.tips.length > 0 && (
          <button
            onClick={() => setActiveTab('tips')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'tips'
                ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            Tips
          </button>
        )}
        <button
          onClick={() => setActiveTab('rounds')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'rounds'
              ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
          }`}
        >
          Rounds ({details.rounds.length})
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'questions'
              ? 'bg-[var(--accent-light)] text-[var(--accent-color)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
          }`}
        >
          Questions ({details.rounds.reduce((sum, r) => sum + r.questions.length, 0)})
        </button>
      </div>
    )}
```

**Step 5: Implement the Tips tab content**

Reuse the exact styling from the current RoleCard expansion — accent background with bullet list:

```tsx
    {/* Tab Content */}
    <div className="p-5">
      {isLoading && (
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-[var(--bg-muted)] rounded" />
          <div className="h-20 bg-[var(--bg-muted)] rounded-xl" />
          <div className="h-20 bg-[var(--bg-muted)] rounded-xl" />
        </div>
      )}

      {fetchError && (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--error)] mb-3">{fetchError}</p>
          <button
            onClick={() => {
              detailsCache.current.delete(roleId)
              // re-trigger fetch by toggling a counter or similar
            }}
            className="text-sm text-[var(--accent-color)] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {details && !isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'tips' && (
              <div className="bg-[var(--accent-light)] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <LightBulbIcon className="w-4 h-4 text-[var(--accent-color)]" />
                  <p className="text-xs font-semibold text-[var(--accent-color)] uppercase tracking-wider">
                    Interview Tips
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {details.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                      <span className="text-[var(--accent-color)] mt-0.5 flex-shrink-0">&bull;</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
```

**Step 6: Implement the Rounds tab content**

Collapsible round sections with nested questions accordion. This is the core content — migrate the rounds/questions rendering from the current RoleCard but use `openRound` state to collapse/expand rounds:

```tsx
            {activeTab === 'rounds' && (
              <div className="space-y-3">
                {details.rounds.map((round) => (
                  <div
                    key={round.roundNumber}
                    className="border border-[var(--border-color)] rounded-xl overflow-hidden"
                  >
                    {/* Round header — clickable to expand/collapse */}
                    <button
                      onClick={() => setOpenRound(openRound === round.roundNumber ? null : round.roundNumber)}
                      className="w-full px-4 py-3 bg-[var(--bg-muted)] flex items-center gap-3 flex-wrap text-left hover:bg-[var(--bg-muted)]/80 transition-colors"
                    >
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
                      <ChevronDownIcon
                        className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${
                          openRound === round.roundNumber ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Round expanded content */}
                    <AnimatePresence initial={false}>
                      {openRound === round.roundNumber && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          {round.description && (
                            <div className="px-4 py-2 border-t border-[var(--border-color)]">
                              <p className="text-sm text-[var(--text-secondary)]">{round.description}</p>
                            </div>
                          )}
                          {round.questions.length > 0 && (
                            <div className="border-t border-[var(--border-color)] divide-y divide-[var(--border-color)]">
                              {round.questions.map((q) => (
                                <QuestionRow
                                  key={q.id}
                                  question={q}
                                  isOpen={openQuestion === q.id}
                                  onToggle={() => setOpenQuestion(openQuestion === q.id ? null : q.id)}
                                />
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
```

**Step 7: Implement the Questions tab content (flat view)**

All questions grouped by round, with round header separators:

```tsx
            {activeTab === 'questions' && (
              <div className="space-y-4">
                {details.rounds.map((round) => (
                  <div key={round.roundNumber}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-[var(--text-tertiary)]">
                        Round {round.roundNumber}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {round.title}
                      </span>
                      <Badge variant={ROUND_TYPE_VARIANT[round.type]} size="sm">
                        {round.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {round.questions.length > 0 ? (
                      <div className="border border-[var(--border-color)] rounded-xl divide-y divide-[var(--border-color)] overflow-hidden">
                        {round.questions.map((q) => (
                          <QuestionRow
                            key={q.id}
                            question={q}
                            isOpen={openQuestion === q.id}
                            onToggle={() => setOpenQuestion(openQuestion === q.id ? null : q.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-tertiary)] italic">No questions for this round</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  </div>
</motion.div>
```

**Step 8: Extract a QuestionRow sub-component**

Since both "Rounds" and "Questions" tabs render expandable question rows identically, extract a shared `QuestionRow` component defined in the same file (not exported — internal helper):

```tsx
function QuestionRow({
  question: q,
  isOpen,
  onToggle,
}: {
  question: InterviewQuestion
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="px-4">
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
              variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'error'}
              size="sm"
            >
              {q.difficulty}
            </Badge>
            {q.category && (
              <Badge variant="outline" size="sm">{q.category}</Badge>
            )}
          </div>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
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
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Follow-ups</p>
                  <ul className="space-y-1">
                    {q.followUps.map((f, i) => (
                      <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                        <span className="text-[var(--text-tertiary)] flex-shrink-0">&bull;</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {q.evaluationCriteria.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Evaluation Criteria</p>
                  <div className="flex flex-wrap gap-1.5">
                    {q.evaluationCriteria.map((c, i) => (
                      <Badge key={i} variant="outline" size="sm">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {q.sampleAnswer && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Sample Answer</p>
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
```

Import `InterviewQuestion` type at the top of the file (already imported via `InterviewRound` which contains `questions: InterviewQuestion[]`, but add explicit import).

**Step 9: Verify visually**

The component isn't wired up yet, but ensure it compiles:
Run: `npm run dev`
Check for TypeScript errors in the terminal.

**Step 10: Commit**

```bash
git add src/components/interview-prep/RoleDetailPanel.tsx
git commit -m "feat: create RoleDetailPanel with tabbed layout"
```

---

### Task 3: Export RoleDetailPanel from Barrel

**Files:**
- Modify: `src/components/interview-prep/index.ts`

**Step 1: Add export**

Add this line after the `RoleCard` export:
```typescript
export { RoleDetailPanel } from './RoleDetailPanel'
```

**Step 2: Commit**

```bash
git add src/components/interview-prep/index.ts
git commit -m "feat: export RoleDetailPanel from barrel"
```

---

### Task 4: Wire Up the Company Detail Page

**Files:**
- Modify: `src/app/interview-prep/[companyId]/page.tsx`

**Step 1: Update imports**

Add `RoleDetailPanel` to the interview-prep imports. Remove any imports that are no longer needed (the page currently doesn't import expansion-specific things — those were in RoleCard).

```typescript
import {
  RoleCard,
  RoleDetailPanel,  // NEW
  CreateRoleModal,
  EditRoleModal,
  DeleteRoleModal,
  SubmitDataModal,
} from '@/components/interview-prep'
```

**Step 2: Rename state variable**

Change `expandedRoleId` → `selectedRoleId`:
```typescript
const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
```

**Step 3: Update the RoleCard grid rendering**

Replace the current `<RoleCard>` usage in the grid. The key changes:
- Pass `isSelected` instead of `isExpanded`
- Pass `onSelect` instead of `onToggle`
- Remove `detailsCache` prop (panel handles this now)
- Change `onEdit` to not require RoleDetails — it will fetch via the detail panel or we handle edit from the panel

```tsx
<RoleCard
  role={role}
  isAdmin={isAdmin}
  isSelected={selectedRoleId === role.id}
  onSelect={() =>
    setSelectedRoleId((prev) => (prev === role.id ? null : role.id))
  }
  onEdit={() => {
    // Select the role first so panel opens, then user can edit from panel
    setSelectedRoleId(role.id)
  }}
  onDelete={(roleSummary) => setModal({ type: 'delete', role: roleSummary })}
/>
```

**Step 4: Add RoleDetailPanel below the grid**

After the grid `</div>` (or after the empty states), add:

```tsx
{/* Detail Panel — below grid */}
<AnimatePresence>
  {selectedRoleId && (
    <RoleDetailPanel
      key={selectedRoleId}
      roleId={selectedRoleId}
      detailsCache={detailsCache}
      onClose={() => setSelectedRoleId(null)}
      isAdmin={isAdmin}
      onEdit={(roleDetails) => setModal({ type: 'edit', role: roleDetails })}
      onDelete={(roleSummary) => setModal({ type: 'delete', role: roleSummary })}
    />
  )}
</AnimatePresence>
```

Note: Wrap in `AnimatePresence` so the panel's exit animation works. Use `key={selectedRoleId}` so React remounts the panel when switching roles (triggering the enter animation + fresh data load from cache).

**Step 5: Update admin handlers**

The `handleUpdateRole` function currently references `expandedRoleId` — update to `selectedRoleId`:
- Line ~196: `setExpandedRoleId(null)` → `setSelectedRoleId(null)`

The `handleDeleteRole` function references `expandedRoleId`:
- Line ~218: `if (expandedRoleId === roleId) setExpandedRoleId(null)` → `if (selectedRoleId === roleId) setSelectedRoleId(null)`

**Step 6: Clean up unused imports**

The `AnimatePresence` import should already exist on the page (from framer-motion). Ensure it's imported. Remove any imports that were only used by the old expansion pattern if applicable.

**Step 7: Verify visually**

Run: `npm run dev`
Navigate to a company page with roles:
1. Cards render in grid — no expand buttons
2. Click a card → detail panel slides open below grid with accent border on card
3. Click "Rounds" tab → rounds display with collapsible sections
4. Click "Questions" tab → flat question list grouped by round
5. Click "Tips" tab (if tips exist) → tips display
6. Click same card → panel collapses
7. Click different card → panel swaps content instantly
8. Admin: edit/delete buttons work from panel header
9. Search + filter still work, grid stays clean

**Step 8: Commit**

```bash
git add src/app/interview-prep/[companyId]/page.tsx
git commit -m "feat: wire up RoleDetailPanel with tabbed layout below grid"
```

---

### Task 5: Polish & Edge Cases

**Files:**
- Modify: `src/components/interview-prep/RoleDetailPanel.tsx`
- Modify: `src/app/interview-prep/[companyId]/page.tsx`

**Step 1: Handle "retry" on fetch error**

In `RoleDetailPanel`, the retry button needs to re-trigger the fetch. Add a `retryCount` state that increments on retry, and include it in the `useEffect` dependency array:

```typescript
const [retryCount, setRetryCount] = useState(0)

// In useEffect deps: [roleId, detailsCache, retryCount]

// In retry button onClick:
onClick={() => {
  detailsCache.current.delete(roleId)
  setRetryCount((c) => c + 1)
}}
```

**Step 2: Scroll panel into view on open**

When the detail panel opens, scroll it into view so the user can see it (especially on mobile or if they clicked a card at the top of a long grid):

Add a `ref` to the panel container and use `scrollIntoView` after animation completes:

```typescript
import { useRef } from 'react'

const panelRef = useRef<HTMLDivElement>(null)

// After the motion.div:
<motion.div
  ref={panelRef}
  onAnimationComplete={() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }}
  // ... existing motion props
>
```

**Step 3: Clear selected role when filtered out**

In the page, if the selected role gets filtered out by search/level filter, clear the selection:

```typescript
// Add after the filteredRoles useMemo:
useEffect(() => {
  if (selectedRoleId && !filteredRoles.some((r) => r.id === selectedRoleId)) {
    setSelectedRoleId(null)
  }
}, [filteredRoles, selectedRoleId])
```

**Step 4: Verify all edge cases**

Run: `npm run dev`
Test:
1. Select a role → type in search that filters it out → panel should close
2. Select a role → change level filter → if role filtered out, panel closes
3. Panel shows loading skeleton when fetching details for the first time
4. Panel shows error + retry when fetch fails (test by going offline)
5. Switching between roles rapidly doesn't cause stale data (cancelled flag in useEffect)

**Step 5: Commit**

```bash
git add src/components/interview-prep/RoleDetailPanel.tsx src/app/interview-prep/[companyId]/page.tsx
git commit -m "feat: add polish — scroll into view, retry, filter-clear edge cases"
```

---

### Task 6: Final Build Verification

**Step 1: Run production build**

Run: `npm run build`
Ensure no TypeScript errors and build succeeds.

**Step 2: Fix any build issues**

Address any type errors or warnings from the build.

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build issues from role detail panel redesign"
```
