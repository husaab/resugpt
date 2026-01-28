# Past Resumes Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Past Resumes" feature showing saved resumes with PDF thumbnails, accessible from home page and dedicated /resumes page.

**Architecture:** Backend generates thumbnails on save using pdf2pic, stores in Supabase alongside PDFs. Frontend displays resume cards with thumbnails, kebab menu for actions. Home page shows 3 recent, /resumes page shows all with search/sort.

**Tech Stack:** pdf2pic + GraphicsMagick (backend), Next.js + Framer Motion (frontend), Supabase Storage (files)

---

## Phase 1: Backend Thumbnail Support

### Task 1: Add thumbnail_path to database

**Files:**
- Create: `resugpt-backend/migrations/003_add_thumbnail_path.sql`

**Step 1: Create migration file**

```sql
-- Migration: Add thumbnail_path column to resumes table

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS thumbnail_path VARCHAR(512);

COMMENT ON COLUMN resumes.thumbnail_path IS 'Supabase storage path for PDF thumbnail: user_id/resume_id_thumb.png';
```

**Step 2: Run migration in Supabase**

Run this SQL in Supabase Dashboard → SQL Editor.

**Step 3: Commit**

```bash
git add resugpt-backend/migrations/003_add_thumbnail_path.sql
git commit -m "chore: add thumbnail_path column migration"
```

---

### Task 2: Add thumbnail functions to storage.js

**Files:**
- Modify: `resugpt-backend/config/storage.js`

**Step 1: Add uploadThumbnail function**

Add after `uploadPdf` function:

```javascript
/**
 * Upload a thumbnail image to Supabase storage
 * @param {string} userId - The user's Google ID
 * @param {string} resumeId - The resume UUID
 * @param {Buffer} imageBuffer - The PNG image buffer
 * @returns {Promise<{path: string}>} - Storage path
 */
async function uploadThumbnail(userId, resumeId, imageBuffer) {
  if (!supabase) {
    throw new Error('Supabase storage not configured');
  }

  const filePath = `${userId}/${resumeId}_thumb.png`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    logger.error(`Failed to upload thumbnail: ${error.message}`);
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }

  logger.info(`Thumbnail uploaded successfully: ${filePath}`);

  return {
    path: filePath,
    fullPath: data.path
  };
}
```

**Step 2: Add getThumbnailUrl function**

Add after `getPdfUrl` function:

```javascript
/**
 * Get a signed URL for a thumbnail image
 * @param {string} userId - The user's Google ID
 * @param {string} resumeId - The resume UUID
 * @param {number} expiresIn - URL expiration in seconds (default 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
async function getThumbnailUrl(userId, resumeId, expiresIn = 3600) {
  if (!supabase) {
    throw new Error('Supabase storage not configured');
  }

  const filePath = `${userId}/${resumeId}_thumb.png`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    logger.error(`Failed to get thumbnail URL: ${error.message}`);
    throw new Error(`Failed to get thumbnail URL: ${error.message}`);
  }

  return data.signedUrl;
}
```

**Step 3: Add deleteThumbnail function**

Add after `deletePdf` function:

```javascript
/**
 * Delete a thumbnail from Supabase storage
 * @param {string} userId - The user's Google ID
 * @param {string} resumeId - The resume UUID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteThumbnail(userId, resumeId) {
  if (!supabase) {
    logger.warn('Supabase storage not configured, skipping thumbnail delete');
    return true;
  }

  const filePath = `${userId}/${resumeId}_thumb.png`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    logger.error(`Failed to delete thumbnail: ${error.message}`);
    return false;
  }

  logger.info(`Thumbnail deleted successfully: ${filePath}`);
  return true;
}
```

**Step 4: Update module.exports**

```javascript
module.exports = {
  uploadPdf,
  deletePdf,
  getPdfUrl,
  pdfExists,
  uploadThumbnail,
  getThumbnailUrl,
  deleteThumbnail,
  BUCKET_NAME
};
```

**Step 5: Commit**

```bash
git add resugpt-backend/config/storage.js
git commit -m "feat: add thumbnail upload/get/delete functions to storage"
```

---

### Task 3: Create thumbnail generator utility

**Files:**
- Create: `resugpt-backend/utils/thumbnailGenerator.js`

**Step 1: Install pdf2pic**

```bash
cd /Users/husseinsaab/Documents/GitHub/resugpt-backend && npm install pdf2pic
```

Note: Requires GraphicsMagick installed on system (`brew install graphicsmagick` on macOS).

**Step 2: Create thumbnailGenerator.js**

```javascript
const { fromBuffer } = require('pdf2pic');
const logger = require('../logger');

/**
 * Generate a thumbnail image from a PDF buffer
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {Object} options - Generation options
 * @param {number} options.width - Thumbnail width (default 200)
 * @param {number} options.height - Thumbnail height (default 260)
 * @param {number} options.density - DPI for rendering (default 150)
 * @returns {Promise<Buffer>} - PNG image buffer
 */
async function generateThumbnail(pdfBuffer, options = {}) {
  const {
    width = 200,
    height = 260,
    density = 150
  } = options;

  try {
    const converter = fromBuffer(pdfBuffer, {
      density: density,
      saveFilename: 'thumbnail',
      savePath: '/tmp',
      format: 'png',
      width: width,
      height: height
    });

    // Convert first page only
    const result = await converter(1, { responseType: 'buffer' });

    if (!result || !result.buffer) {
      throw new Error('Failed to generate thumbnail - no buffer returned');
    }

    logger.info(`Thumbnail generated: ${width}x${height}px`);
    return result.buffer;

  } catch (error) {
    logger.error(`Thumbnail generation failed: ${error.message}`);
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

module.exports = {
  generateThumbnail
};
```

**Step 3: Commit**

```bash
git add resugpt-backend/utils/thumbnailGenerator.js resugpt-backend/package.json resugpt-backend/package-lock.json
git commit -m "feat: add thumbnail generator utility using pdf2pic"
```

---

### Task 4: Update queries to include thumbnail_path

**Files:**
- Modify: `resugpt-backend/queries/resume.queries.js`

**Step 1: Update createResume query**

Change the INSERT to include thumbnail_path:

```javascript
  // Create new resume
  createResume: `
    INSERT INTO resumes (user_id, resume_data, latex, job_description, title, target_company, target_role, pdf_path, thumbnail_path)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, user_id, resume_data, latex, job_description, title, target_company, target_role, pdf_path, thumbnail_path, created_at, updated_at
  `,
```

**Step 2: Update updateResume query**

```javascript
  // Update existing resume
  updateResume: `
    UPDATE resumes
    SET resume_data = $2, latex = $3, job_description = $4, title = $5, target_company = $6, target_role = $7, pdf_path = $8, thumbnail_path = $9, updated_at = NOW()
    WHERE id = $1 AND user_id = $10
    RETURNING id, user_id, resume_data, latex, job_description, title, target_company, target_role, pdf_path, thumbnail_path, created_at, updated_at
  `,
```

**Step 3: Update selectById query**

```javascript
  // Get resume by ID (with user ownership check)
  selectById: `
    SELECT id, user_id, resume_data, latex, job_description, title, target_company, target_role, pdf_path, thumbnail_path, created_at, updated_at
    FROM resumes
    WHERE id = $1 AND user_id = $2
  `,
```

**Step 4: Update listByUserId query**

```javascript
  // List all resumes for a user
  listByUserId: `
    SELECT id, title, target_company, target_role, pdf_path, thumbnail_path, created_at, updated_at
    FROM resumes
    WHERE user_id = $1
    ORDER BY updated_at DESC
  `,
```

**Step 5: Commit**

```bash
git add resugpt-backend/queries/resume.queries.js
git commit -m "feat: add thumbnail_path to resume queries"
```

---

### Task 5: Update controller to generate thumbnails on save

**Files:**
- Modify: `resugpt-backend/controllers/resume.controller.js`

**Step 1: Add imports**

At the top, add:

```javascript
const { uploadPdf, deletePdf, getPdfUrl, uploadThumbnail, getThumbnailUrl, deleteThumbnail } = require("../config/storage");
const { generateThumbnail } = require("../utils/thumbnailGenerator");
```

**Step 2: Update save function for existing resumes (id exists)**

Replace the PDF upload section in the `if (id)` block with this logic that handles both PDF and thumbnail:

Find this section in the save function (around line 140-158):
```javascript
    // Compile PDF from the current resumeData
    let pdfPath = null;
    try {
      const latexSource = generateLatex(resumeData);
      const pdfBuffer = await compileLatexToPdf(latexSource);

      // For updates, use existing ID; for creates, we need to create first then update
      const resumeId = id || null;

      if (resumeId) {
        // Upload PDF to Supabase storage
        const uploadResult = await uploadPdf(googleId, resumeId, pdfBuffer);
        pdfPath = uploadResult.path;
        logger.info(`PDF uploaded to storage: ${pdfPath}`);
      }
    } catch (pdfError) {
      // Log but don't fail the save - PDF upload is best-effort
      logger.warn(`Failed to compile/upload PDF: ${pdfError.message}`);
    }
```

Replace with:

```javascript
    // Compile PDF and generate thumbnail
    let pdfPath = null;
    let thumbnailPath = null;
    let pdfBuffer = null;

    try {
      const latexSource = generateLatex(resumeData);
      pdfBuffer = await compileLatexToPdf(latexSource);

      if (id) {
        // Upload PDF to Supabase storage
        const uploadResult = await uploadPdf(googleId, id, pdfBuffer);
        pdfPath = uploadResult.path;
        logger.info(`PDF uploaded to storage: ${pdfPath}`);

        // Generate and upload thumbnail
        try {
          const thumbnailBuffer = await generateThumbnail(pdfBuffer);
          const thumbResult = await uploadThumbnail(googleId, id, thumbnailBuffer);
          thumbnailPath = thumbResult.path;
          logger.info(`Thumbnail uploaded to storage: ${thumbnailPath}`);
        } catch (thumbError) {
          logger.warn(`Failed to generate/upload thumbnail: ${thumbError.message}`);
        }
      }
    } catch (pdfError) {
      logger.warn(`Failed to compile/upload PDF: ${pdfError.message}`);
    }
```

**Step 3: Update the updateResume query call**

Find:
```javascript
      result = await db.query(resumeQueries.updateResume, [
        id,
        JSON.stringify(resumeData),
        latex,
        jobDescription || null,
        title,
        targetCompany,
        targetRole,
        pdfPath,  // Will be null if upload failed
        googleId
      ]);
```

Replace with:
```javascript
      result = await db.query(resumeQueries.updateResume, [
        id,
        JSON.stringify(resumeData),
        latex,
        jobDescription || null,
        title,
        targetCompany,
        targetRole,
        pdfPath,
        thumbnailPath,
        googleId
      ]);
```

**Step 4: Update the createResume query call**

Find:
```javascript
      result = await db.query(resumeQueries.createResume, [
        googleId,
        JSON.stringify(resumeData),
        latex,
        jobDescription || null,
        title,
        targetCompany,
        targetRole,
        null  // pdf_path - will be set in follow-up update
      ]);
```

Replace with:
```javascript
      result = await db.query(resumeQueries.createResume, [
        googleId,
        JSON.stringify(resumeData),
        latex,
        jobDescription || null,
        title,
        targetCompany,
        targetRole,
        null,  // pdf_path - will be set in follow-up update
        null   // thumbnail_path - will be set in follow-up update
      ]);
```

**Step 5: Update the new resume PDF upload section**

Find:
```javascript
      // Now that we have the ID, compile and upload PDF
      const newResumeId = result.rows[0].id;
      try {
        const latexSource = generateLatex(resumeData);
        const pdfBuffer = await compileLatexToPdf(latexSource);
        const uploadResult = await uploadPdf(googleId, newResumeId, pdfBuffer);
        pdfPath = uploadResult.path;

        // Update the resume with the PDF path
        await db.query(
          `UPDATE resumes SET pdf_path = $1 WHERE id = $2`,
          [pdfPath, newResumeId]
        );
        result.rows[0].pdf_path = pdfPath;
        logger.info(`PDF uploaded to storage for new resume: ${pdfPath}`);
      } catch (pdfError) {
        logger.warn(`Failed to compile/upload PDF for new resume: ${pdfError.message}`);
      }
```

Replace with:
```javascript
      // Now that we have the ID, compile and upload PDF + thumbnail
      const newResumeId = result.rows[0].id;
      try {
        const latexSource = generateLatex(resumeData);
        const newPdfBuffer = await compileLatexToPdf(latexSource);
        const uploadResult = await uploadPdf(googleId, newResumeId, newPdfBuffer);
        pdfPath = uploadResult.path;

        // Generate and upload thumbnail
        try {
          const thumbnailBuffer = await generateThumbnail(newPdfBuffer);
          const thumbResult = await uploadThumbnail(googleId, newResumeId, thumbnailBuffer);
          thumbnailPath = thumbResult.path;
        } catch (thumbError) {
          logger.warn(`Failed to generate/upload thumbnail for new resume: ${thumbError.message}`);
        }

        // Update the resume with paths
        await db.query(
          `UPDATE resumes SET pdf_path = $1, thumbnail_path = $2 WHERE id = $3`,
          [pdfPath, thumbnailPath, newResumeId]
        );
        result.rows[0].pdf_path = pdfPath;
        result.rows[0].thumbnail_path = thumbnailPath;
        logger.info(`PDF and thumbnail uploaded for new resume: ${pdfPath}`);
      } catch (pdfError) {
        logger.warn(`Failed to compile/upload PDF for new resume: ${pdfError.message}`);
      }
```

**Step 6: Update save response to include thumbnailPath**

Find:
```javascript
    return res.status(200).json({
      success: true,
      message: "Resume saved successfully",
      data: {
        id: resume.id,
        pdfPath: resume.pdf_path,
        updatedAt: resume.updated_at
      }
    });
```

Replace with:
```javascript
    return res.status(200).json({
      success: true,
      message: "Resume saved successfully",
      data: {
        id: resume.id,
        pdfPath: resume.pdf_path,
        thumbnailPath: resume.thumbnail_path,
        updatedAt: resume.updated_at
      }
    });
```

**Step 7: Commit**

```bash
git add resugpt-backend/controllers/resume.controller.js
git commit -m "feat: generate and upload thumbnails on resume save"
```

---

### Task 6: Update list endpoint to return thumbnail URLs

**Files:**
- Modify: `resugpt-backend/controllers/resume.controller.js`

**Step 1: Update the list function**

Find the list function and replace it entirely:

```javascript
/**
 * GET /api/resume/list
 * List all resumes for the authenticated user
 */
const list = async (req, res) => {
  const { googleId } = req.query;

  try {
    if (!googleId) {
      throw { status: 400, message: "Missing googleId query parameter" };
    }

    const result = await db.query(resumeQueries.listByUserId, [googleId]);

    // Generate signed URLs for thumbnails
    const resumesWithUrls = await Promise.all(
      result.rows.map(async (resume) => {
        let thumbnailUrl = null;
        let pdfUrl = null;

        if (resume.thumbnail_path) {
          try {
            thumbnailUrl = await getThumbnailUrl(googleId, resume.id, 3600);
          } catch (err) {
            logger.warn(`Failed to get thumbnail URL for ${resume.id}: ${err.message}`);
          }
        }

        if (resume.pdf_path) {
          try {
            pdfUrl = await getPdfUrl(googleId, resume.id, 3600);
          } catch (err) {
            logger.warn(`Failed to get PDF URL for ${resume.id}: ${err.message}`);
          }
        }

        return {
          id: resume.id,
          title: resume.title,
          targetCompany: resume.target_company,
          targetRole: resume.target_role,
          thumbnailUrl,
          pdfUrl,
          createdAt: resume.created_at,
          updatedAt: resume.updated_at
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: resumesWithUrls
    });

  } catch (error) {
    logger.error('List resumes error:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to list resumes"
    });
  }
};
```

**Step 2: Update remove function to delete thumbnail**

Find the delete section in remove function:
```javascript
    // Delete PDF from Supabase storage (best-effort, don't fail if it doesn't exist)
    try {
      await deletePdf(googleId, id);
      logger.info(`PDF deleted from storage: ${googleId}/${id}.pdf`);
    } catch (storageError) {
      logger.warn(`Failed to delete PDF from storage: ${storageError.message}`);
    }
```

Replace with:
```javascript
    // Delete PDF and thumbnail from Supabase storage (best-effort)
    try {
      await deletePdf(googleId, id);
      logger.info(`PDF deleted from storage: ${googleId}/${id}.pdf`);
    } catch (storageError) {
      logger.warn(`Failed to delete PDF from storage: ${storageError.message}`);
    }

    try {
      await deleteThumbnail(googleId, id);
      logger.info(`Thumbnail deleted from storage: ${googleId}/${id}_thumb.png`);
    } catch (storageError) {
      logger.warn(`Failed to delete thumbnail from storage: ${storageError.message}`);
    }
```

**Step 3: Update generate function to include thumbnail_path parameter**

Find:
```javascript
    // Save to database (pdf_path is null initially - set on first save)
    const result = await db.query(resumeQueries.createResume, [
      googleId,
      JSON.stringify(resumeData),
      latex,
      jobDescription,
      title,
      targetCompany,
      targetRole,
      null  // pdf_path - populated when user saves
    ]);
```

Replace with:
```javascript
    // Save to database (pdf_path and thumbnail_path are null initially - set on first save)
    const result = await db.query(resumeQueries.createResume, [
      googleId,
      JSON.stringify(resumeData),
      latex,
      jobDescription,
      title,
      targetCompany,
      targetRole,
      null,  // pdf_path - populated when user saves
      null   // thumbnail_path - populated when user saves
    ]);
```

**Step 4: Commit**

```bash
git add resugpt-backend/controllers/resume.controller.js
git commit -m "feat: return thumbnail URLs in list endpoint, delete thumbnails on remove"
```

---

## Phase 2: Frontend Components

### Task 7: Update ResumeListItem type

**Files:**
- Modify: `resugpt/src/types/resume.ts`

**Step 1: Update ResumeListItem interface**

Find:
```typescript
export interface ResumeListItem {
  id: string;
  title: string;
  targetCompany?: string;
  targetRole?: string;
  createdAt: string;
  updatedAt: string;
}
```

Replace with:
```typescript
export interface ResumeListItem {
  id: string;
  title: string;
  targetCompany?: string;
  targetRole?: string;
  thumbnailUrl?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Commit**

```bash
git add src/types/resume.ts
git commit -m "feat: add thumbnailUrl and pdfUrl to ResumeListItem type"
```

---

### Task 8: Create ResumeCard component

**Files:**
- Create: `resugpt/src/components/resumes/ResumeCard.tsx`

**Step 1: Create the component**

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  EllipsisVerticalIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface ResumeCardProps {
  id: string
  title: string
  targetRole?: string | null
  updatedAt: string
  thumbnailUrl?: string | null
  onPreview: (id: string) => void
  onDownload: (id: string) => void
  onDelete: (id: string) => void
}

export function ResumeCard({
  id,
  title,
  targetRole,
  updatedAt,
  thumbnailUrl,
  onPreview,
  onDownload,
  onDelete
}: ResumeCardProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    router.push(`/editor/${id}`)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    setShowMenu(false)
    action()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="relative bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl overflow-hidden cursor-pointer group transition-shadow hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="aspect-[8.5/11] bg-[var(--bg-muted)] relative overflow-hidden">
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <DocumentIcon className="w-16 h-16 text-[var(--text-tertiary)]" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[var(--text-primary)] truncate text-sm">
              {title}
            </h3>
            {targetRole && (
              <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                {targetRole}
              </p>
            )}
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {formatDate(updatedAt)}
            </p>
          </div>

          {/* Kebab menu */}
          <div className="relative">
            <button
              onClick={handleMenuClick}
              className="p-1 rounded-md hover:bg-[var(--bg-muted)] transition-colors"
            >
              <EllipsisVerticalIcon className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => handleAction(e, () => {})}
                />

                {/* Menu */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-8 z-20 w-36 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg shadow-lg overflow-hidden"
                >
                  <button
                    onClick={(e) => handleAction(e, () => onPreview(id))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={(e) => handleAction(e, () => onDownload(id))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download
                  </button>
                  <div className="h-px bg-[var(--border-color)]" />
                  <button
                    onClick={(e) => handleAction(e, () => onDelete(id))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

**Step 2: Create directory and commit**

```bash
mkdir -p src/components/resumes
git add src/components/resumes/ResumeCard.tsx
git commit -m "feat: create ResumeCard component with thumbnail and kebab menu"
```

---

### Task 9: Create ResumeGrid component

**Files:**
- Create: `resugpt/src/components/resumes/ResumeGrid.tsx`

**Step 1: Create the component**

```typescript
'use client'

import { ResumeCard } from './ResumeCard'
import { ResumeListItem } from '@/types/resume'

interface ResumeGridProps {
  resumes: ResumeListItem[]
  onPreview: (id: string) => void
  onDownload: (id: string) => void
  onDelete: (id: string) => void
  emptyMessage?: string
}

export function ResumeGrid({
  resumes,
  onPreview,
  onDownload,
  onDelete,
  emptyMessage = "No resumes yet"
}: ResumeGridProps) {
  if (resumes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {resumes.map((resume) => (
        <ResumeCard
          key={resume.id}
          id={resume.id}
          title={resume.title}
          targetRole={resume.targetRole}
          updatedAt={resume.updatedAt}
          thumbnailUrl={resume.thumbnailUrl}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/resumes/ResumeGrid.tsx
git commit -m "feat: create ResumeGrid component"
```

---

### Task 10: Create PdfPreviewModal component

**Files:**
- Create: `resugpt/src/components/resumes/PdfPreviewModal.tsx`

**Step 1: Create the component**

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface PdfPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string | null
  title: string
  onDownload: () => void
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  onDownload
}: PdfPreviewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 z-50 flex flex-col bg-[var(--bg-elevated)] rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <h2 className="font-semibold text-[var(--text-primary)] truncate">
                {title}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onDownload}>
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download
                </Button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 bg-[var(--bg-muted)]">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title={title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-[var(--text-secondary)]">
                    PDF not available
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/resumes/PdfPreviewModal.tsx
git commit -m "feat: create PdfPreviewModal component"
```

---

### Task 11: Create DeleteConfirmModal component

**Files:**
- Create: `resugpt/src/components/resumes/DeleteConfirmModal.tsx`

**Step 1: Create the component**

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  isDeleting?: boolean
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isDeleting = false
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[var(--bg-elevated)] rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6">
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-[var(--error-light)] flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-[var(--error)]" />
              </div>

              {/* Content */}
              <h2 className="text-lg font-semibold text-[var(--text-primary)] text-center mb-2">
                Delete Resume?
              </h2>
              <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
                Are you sure you want to delete "{title}"? This action cannot be undone.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 !bg-[var(--error)] hover:!bg-[var(--error)]/90"
                  onClick={onConfirm}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/resumes/DeleteConfirmModal.tsx
git commit -m "feat: create DeleteConfirmModal component"
```

---

### Task 12: Create index export for resumes components

**Files:**
- Create: `resugpt/src/components/resumes/index.ts`

**Step 1: Create the index file**

```typescript
export { ResumeCard } from './ResumeCard'
export { ResumeGrid } from './ResumeGrid'
export { PdfPreviewModal } from './PdfPreviewModal'
export { DeleteConfirmModal } from './DeleteConfirmModal'
```

**Step 2: Commit**

```bash
git add src/components/resumes/index.ts
git commit -m "feat: add index export for resumes components"
```

---

## Phase 3: Pages & Integration

### Task 13: Create /resumes page

**Files:**
- Create: `resugpt/src/app/resumes/page.tsx`

**Step 1: Create the page**

```typescript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { ResumeGrid, PdfPreviewModal, DeleteConfirmModal } from '@/components/resumes'
import { listResumes, deleteResume } from '@/services/resumeService'
import { ResumeListItem } from '@/types/resume'

type SortOrder = 'newest' | 'oldest'

export default function ResumesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [showSortMenu, setShowSortMenu] = useState(false)

  const [previewResume, setPreviewResume] = useState<ResumeListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResumeListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch resumes
  useEffect(() => {
    const fetchResumes = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        const response = await listResumes(session.user.googleId)
        if (response.success) {
          setResumes(response.data)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load resumes')
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.googleId) {
      fetchResumes()
    }
  }, [session?.user?.googleId])

  // Filter and sort resumes
  const filteredResumes = useMemo(() => {
    let result = [...resumes]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.targetCompany?.toLowerCase().includes(query) ||
          r.targetRole?.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [resumes, searchQuery, sortOrder])

  const handlePreview = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume) {
      setPreviewResume(resume)
    }
  }

  const handleDownload = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume?.pdfUrl) {
      const a = document.createElement('a')
      a.href = resume.pdfUrl
      a.download = `${resume.title}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleDeleteClick = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume) {
      setDeleteTarget(resume)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !session?.user?.googleId) return

    try {
      setIsDeleting(true)
      await deleteResume(deleteTarget.id, session.user.googleId)
      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete resume')
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-[var(--bg-muted)] rounded-lg mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[8.5/11] bg-[var(--bg-muted)] rounded-xl" />
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
            Your Resumes
          </h1>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or company..."
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
          <ResumeGrid
            resumes={filteredResumes}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDelete={handleDeleteClick}
            emptyMessage={
              searchQuery
                ? 'No resumes match your search'
                : 'No resumes yet. Create your first one!'
            }
          />
        </motion.div>
      </div>

      {/* Preview Modal */}
      <PdfPreviewModal
        isOpen={!!previewResume}
        onClose={() => setPreviewResume(null)}
        pdfUrl={previewResume?.pdfUrl || null}
        title={previewResume?.title || ''}
        onDownload={() => previewResume && handleDownload(previewResume.id)}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/resumes/page.tsx
git commit -m "feat: create /resumes page with search and sort"
```

---

### Task 14: Create PastResumesPreview component for home page

**Files:**
- Create: `resugpt/src/components/resumes/PastResumesPreview.tsx`

**Step 1: Create the component**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { ResumeGrid, PdfPreviewModal, DeleteConfirmModal } from '@/components/resumes'
import { listResumes, deleteResume } from '@/services/resumeService'
import { ResumeListItem } from '@/types/resume'

export function PastResumesPreview() {
  const { data: session } = useSession()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [previewResume, setPreviewResume] = useState<ResumeListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResumeListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchResumes = async () => {
      if (!session?.user?.googleId) return

      try {
        setIsLoading(true)
        const response = await listResumes(session.user.googleId)
        if (response.success) {
          // Only show first 3
          setResumes(response.data.slice(0, 3))
        }
      } catch (err) {
        console.error('Failed to load resumes:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.googleId) {
      fetchResumes()
    }
  }, [session?.user?.googleId])

  const handlePreview = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume) setPreviewResume(resume)
  }

  const handleDownload = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume?.pdfUrl) {
      const a = document.createElement('a')
      a.href = resume.pdfUrl
      a.download = `${resume.title}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleDeleteClick = (id: string) => {
    const resume = resumes.find((r) => r.id === id)
    if (resume) setDeleteTarget(resume)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !session?.user?.googleId) return

    try {
      setIsDeleting(true)
      await deleteResume(deleteTarget.id, session.user.googleId)
      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Don't render if not logged in or no resumes
  if (!session?.user || (!isLoading && resumes.length === 0)) {
    return null
  }

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-6 w-40 bg-[var(--bg-muted)] rounded-lg mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="aspect-[8.5/11] bg-[var(--bg-muted)] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Your Resumes
              </h2>
              <Link
                href="/resumes"
                className="flex items-center gap-1 text-sm font-medium text-[var(--accent-color)] hover:underline"
              >
                View all
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {/* Grid - limited width for 3 items */}
            <div className="max-w-2xl">
              <ResumeGrid
                resumes={resumes}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDelete={handleDeleteClick}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modals */}
      <PdfPreviewModal
        isOpen={!!previewResume}
        onClose={() => setPreviewResume(null)}
        pdfUrl={previewResume?.pdfUrl || null}
        title={previewResume?.title || ''}
        onDownload={() => previewResume && handleDownload(previewResume.id)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.title || ''}
        isDeleting={isDeleting}
      />
    </>
  )
}
```

**Step 2: Update index.ts**

Add to `src/components/resumes/index.ts`:
```typescript
export { PastResumesPreview } from './PastResumesPreview'
```

**Step 3: Commit**

```bash
git add src/components/resumes/PastResumesPreview.tsx src/components/resumes/index.ts
git commit -m "feat: create PastResumesPreview component for home page"
```

---

### Task 15: Add PastResumesPreview to home page

**Files:**
- Modify: `resugpt/src/app/page.tsx`

**Step 1: Update home page**

```typescript
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { BackgroundGradient } from '@/components/shared/background-gradient'
import { PastResumesPreview } from '@/components/resumes'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <BackgroundGradient />

      {/* Hero Section with Resume Form */}
      <HeroSection />

      {/* Past Resumes Preview (for logged-in users) */}
      <PastResumesPreview />

      {/* Features Grid */}
      <FeaturesGrid />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add PastResumesPreview to home page"
```

---

### Task 16: Add "My Resumes" link to navbar

**Files:**
- Modify: `resugpt/src/components/navbar.tsx`

**Step 1: Add the link after Pricing**

Find the Pricing link section:
```typescript
                    {/* Pricing link */}
                    <Link href="/pricing">
                      <motion.span
                        whileHover={{ scale: 1.02 }}
                        className="text-sm font-medium cursor-pointer transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Pricing
                      </motion.span>
                    </Link>
```

Add after it:
```typescript
                    {/* My Resumes link */}
                    <Link href="/resumes">
                      <motion.span
                        whileHover={{ scale: 1.02 }}
                        className="text-sm font-medium cursor-pointer transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        My Resumes
                      </motion.span>
                    </Link>
```

**Step 2: Commit**

```bash
git add src/components/navbar.tsx
git commit -m "feat: add My Resumes link to navbar for logged-in users"
```

---

## Verification

### Backend Verification

1. Run migration in Supabase SQL Editor
2. Install GraphicsMagick: `brew install graphicsmagick`
3. Restart backend: `npm run dev`
4. Test save endpoint - should generate PDF + thumbnail
5. Test list endpoint - should return thumbnailUrl
6. Test delete endpoint - should remove thumbnail

### Frontend Verification

1. Start frontend: `npm run dev`
2. Log in with Google
3. Check home page shows PastResumesPreview (if you have resumes)
4. Check navbar has "My Resumes" link
5. Navigate to /resumes page
6. Test search and sort
7. Test card click → opens editor
8. Test kebab menu → Preview, Download, Delete
9. Test delete confirmation modal

### End-to-End Test

1. Create new resume via form
2. Save in editor
3. Verify thumbnail appears in list
4. Edit resume, save again
5. Verify thumbnail updates
6. Delete resume
7. Verify removed from list
