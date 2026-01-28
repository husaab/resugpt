# Past Resumes Feature Design

## Overview

Add a "Past Resumes" feature for logged-in users showing their saved resumes with PDF thumbnails. Users can view, edit, download, or delete their resumes.

## Decisions Made

| Decision | Choice |
|----------|--------|
| Location on home page | Below form, above features (3 most recent) |
| Dedicated page | Yes, at `/resumes` with full list |
| Navbar | Add "My Resumes" link to `/resumes` page |
| Card preview | Thumbnail image of PDF first page |
| Thumbnail generation | On save (backend), updated on every save |
| Card actions | Click to edit, kebab menu for Preview/Download/Delete |
| Filtering | Search by title/company + sort (newest/oldest) |

---

## Architecture

### Page Structure

```
HOME PAGE (logged-in users)
├── HeroSection (headline + ResumeForm)
├── PastResumesPreview (3 most recent + "View All" link)
└── FeaturesGrid

/resumes PAGE
├── Header ("Your Resumes")
├── Search input + Sort dropdown
├── Resume grid (all resumes)
└── Empty state (if no resumes)
```

### Storage Structure (Supabase)

```
resumes/
  └── {userId}/
      ├── {resumeId}.pdf         ← Full PDF
      └── {resumeId}_thumb.png   ← Thumbnail (200x260px)
```

### Database Changes

```sql
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS thumbnail_path VARCHAR(512);
```

---

## Components

### ResumeCard

Core reusable component for displaying a single resume.

```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │      PDF Thumbnail        │  │  ← 8.5:11 aspect ratio
│  │      (first page)         │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Resume for Google       [⋮]   │  ← Title + kebab menu
│  Software Engineer             │  ← Target role
│  Updated 2 days ago            │  ← Relative timestamp
└─────────────────────────────────┘
```

**Props:**
```typescript
interface ResumeCardProps {
  id: string
  title: string
  targetRole?: string
  updatedAt: string
  thumbnailUrl: string | null
  onEdit: (id: string) => void
  onPreview: (id: string) => void
  onDownload: (id: string) => void
  onDelete: (id: string) => void
}
```

**Kebab menu options:**
- Preview → Opens PDF in modal
- Download → Downloads PDF directly
- Delete → Confirm dialog, then delete

### PastResumesPreview (Home Page)

Shows 3 most recent resumes with "View All" link.

```typescript
interface PastResumesPreviewProps {
  // Fetches own data using useSession
}
```

### ResumesPage (/resumes)

Full page with search, sort, and complete resume list.

**State:**
- `resumes: ResumeListItem[]`
- `searchQuery: string`
- `sortOrder: 'newest' | 'oldest'`
- `isLoading: boolean`

---

## API Changes

### GET /api/resume/list Response Update

```typescript
interface ResumeListItem {
  id: string
  title: string
  targetCompany?: string
  targetRole?: string
  thumbnailUrl: string | null  // NEW: signed URL for thumbnail
  pdfUrl: string | null        // NEW: signed URL for PDF
  createdAt: string
  updatedAt: string
}
```

### Backend Save Flow (Updated)

```
1. Generate LaTeX from resumeData
2. Compile PDF via latex-online
3. Upload PDF to Supabase storage
4. Generate thumbnail from PDF using pdf2pic
5. Upload thumbnail to Supabase storage
6. Save all paths to database
7. Return response with paths
```

---

## Frontend Files to Create/Modify

### New Files
- `src/components/resumes/ResumeCard.tsx`
- `src/components/resumes/ResumeGrid.tsx`
- `src/components/resumes/PastResumesPreview.tsx`
- `src/components/resumes/PdfPreviewModal.tsx`
- `src/components/resumes/DeleteConfirmModal.tsx`
- `src/app/resumes/page.tsx`

### Modified Files
- `src/app/page.tsx` - Add PastResumesPreview for logged-in users
- `src/components/navbar.tsx` - Add "My Resumes" link
- `src/services/resumeService.ts` - Update types, add download function
- `src/types/resume.ts` - Update ResumeListItem type

---

## Backend Files to Create/Modify

### New Files
- `resugpt-backend/utils/thumbnailGenerator.js`
- `resugpt-backend/migrations/003_add_thumbnail_path.sql`

### Modified Files
- `resugpt-backend/config/storage.js` - Add thumbnail upload/delete/getUrl
- `resugpt-backend/controllers/resume.controller.js` - Generate thumbnails on save
- `resugpt-backend/queries/resume.queries.js` - Add thumbnail_path to queries

---

## Implementation Order

### Phase 1: Backend Thumbnail Support
1. Add thumbnail_path to database
2. Create thumbnail generator utility
3. Update storage.js with thumbnail functions
4. Update save controller to generate/upload thumbnails
5. Update list endpoint to return thumbnail URLs

### Phase 2: Frontend Components
6. Create ResumeCard component
7. Create ResumeGrid component
8. Create PdfPreviewModal component
9. Create DeleteConfirmModal component

### Phase 3: Pages & Integration
10. Create /resumes page with search/sort
11. Create PastResumesPreview component
12. Add to home page for logged-in users
13. Update navbar with "My Resumes" link

### Phase 4: Polish
14. Loading states and skeletons
15. Empty states
16. Error handling
17. Mobile responsiveness
