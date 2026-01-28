-- Migration: Add thumbnail_path column to resumes table

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS thumbnail_path VARCHAR(512);

COMMENT ON COLUMN resumes.thumbnail_path IS 'Supabase storage path for PDF thumbnail: user_id/resume_id_thumb.png';
