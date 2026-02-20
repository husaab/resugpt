# Role Detail Panel Redesign

**Date:** 2026-02-19
**Status:** Approved

## Problem

The company detail page (`/interview-prep/[companyId]`) displays roles in a 3-column CSS grid. When a user clicks "View rounds & questions" on a RoleCard, the card expands inline — growing from ~150px to 800px+ — causing massive vertical layout shifts. Adjacent cards in the same row get stranded with whitespace, and all rows below shift dramatically. The result is a messy, disorienting experience.

## Solution

Replace inline card expansion with an **inline detail panel** that renders **below the entire role card grid**. Role cards become slim, clickable summaries. The detail panel uses **tabs** (Tips, Rounds, Questions) to organize content without excessive scrolling.

## Design

### Layout

```
┌────────────────────────────────────────────────┐
│  [Company Header + Actions]                    │
│                                                │
│  Roles (N)   [Search...] [Level Filter ▼]     │
│                                                │
│  ┌─────────┐  ┌═════════┐  ┌─────────┐       │
│  │ Role A  │  │★ Role B │  │ Role C  │       │
│  │ summary │  │ selected│  │ summary │       │
│  └─────────┘  └═════════┘  └─────────┘       │
│                                                │
│  ╔════════════════════════════════════════════╗│
│  ║ Role B — Software Engineer, Senior    [X] ║│
│  ║ [Tips] [Rounds] [Questions]               ║│
│  ║ ─────────────────────────────             ║│
│  ║ [Active tab content]                      ║│
│  ╚════════════════════════════════════════════╝│
└────────────────────────────────────────────────┘
```

### RoleCard Changes

- Remove all inline expansion logic (AnimatePresence, height animation)
- Remove question state management (openQuestion)
- Remove "View rounds & questions" toggle button
- Make entire card clickable — calls `onSelect(role.id)`
- Add `isSelected` prop: accent border + glow shadow when active
- Keep admin edit/delete icon buttons in top-right (edit disabled until details loaded, same as current)

### New: RoleDetailPanel Component

**Props:**
- `roleId: string` — which role to show
- `detailsCache: React.MutableRefObject<Map<string, RoleDetails>>` — shared cache
- `onClose: () => void` — collapse the panel
- `isAdmin: boolean` — show admin controls
- `onEdit: (role: RoleDetails) => void`
- `onDelete: (role: RoleSummary) => void`

**Panel Header:**
- Role title + level badge + department
- Close button (X icon) on the right
- Admin edit/delete buttons (if admin)

**Tabs:**
1. **Tips** — only shown if `tips.length > 0`. Accent background, bullet list.
2. **Rounds** (default) — collapsible round sections. Each round shows: number, title, type badge, duration, description, and nested questions accordion.
3. **Questions** — flat list of all questions across all rounds, grouped by round header separators. Same expand behavior for individual questions (follow-ups, criteria, sample answer).

**Data Flow:**
- Panel fetches `getRoleDetails(roleId)` when mounted or `roleId` changes
- Checks `detailsCache` ref first to avoid redundant API calls
- Loading skeleton while fetching
- Error state with retry option

**Animation:**
- Panel: Framer Motion `height: 0 → auto` slide open
- Tab content: opacity crossfade on tab switch
- Role swap: crossfade when selecting a different role

### Page Changes ([companyId]/page.tsx)

- Rename `expandedRoleId` → `selectedRoleId`
- Grid renders RoleCard components (summary-only, never expand)
- Below grid: conditionally render `<RoleDetailPanel>` when `selectedRoleId` is set
- Clicking the same card toggles panel closed
- Clicking a different card swaps panel content instantly
- All existing CRUD handlers, filtering, and search remain unchanged

### Files to Create

- `src/components/interview-prep/RoleDetailPanel.tsx`

### Files to Modify

- `src/components/interview-prep/RoleCard.tsx` — simplify to summary-only
- `src/components/interview-prep/index.ts` — export new component
- `src/app/interview-prep/[companyId]/page.tsx` — use new layout pattern

### What Stays the Same

- Type definitions (RoleSummary, RoleDetails, InterviewRound, InterviewQuestion)
- Service layer (getRoleDetails, createRole, updateRole, deleteRole)
- All admin modals (CreateRoleModal, EditRoleModal, DeleteRoleModal, SubmitDataModal)
- Search and level filter functionality
- Company header section
- Loading and error states for initial page load

## Visual Design

### Selected Card State
- Border: `border-[var(--accent-color)]`
- Shadow: `shadow-[0_0_0_1px_var(--accent-color),0_0_20px_-5px_var(--accent-color)]`
- Subtle transition on selection

### Detail Panel
- Background: `bg-[var(--bg-elevated)]`
- Border: `border border-[var(--border-color)]` with `rounded-xl`
- Tab bar: horizontal pill-style tabs with accent color for active tab
- Content area: padded, uses existing styling patterns (badges, typography)

### Tab Design
- Inactive: `text-[var(--text-tertiary)]` with hover state
- Active: `text-[var(--accent-color)]` with accent underline/pill background
- Smooth transition between states
