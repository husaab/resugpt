import apiClient from './apiClient';
import {
  GenerateCoverLetterRequest,
  GenerateCoverLetterResponse,
  SaveCoverLetterRequest,
  SaveCoverLetterResponse,
  CoverLetter,
  CoverLetterListItem,
} from '@/types/coverLetter';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

/**
 * Generate a new tailored cover letter
 */
export const generateCoverLetter = async (
  request: GenerateCoverLetterRequest
): Promise<GenerateCoverLetterResponse> => {
  return apiClient<GenerateCoverLetterResponse>('cover-letters/generate', {
    method: 'POST',
    body: request,
  });
};

/**
 * Compile cover letter to PDF and return as blob
 */
export const compileCoverLetter = async (content: string): Promise<Blob> => {
  const response = await fetch(`${baseURL}cover-letters/compile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Compilation failed' }));
    throw new Error(error.message || 'Failed to compile PDF');
  }

  return response.blob();
};

/**
 * Save or update a cover letter
 */
export const saveCoverLetter = async (
  request: SaveCoverLetterRequest
): Promise<SaveCoverLetterResponse> => {
  return apiClient<SaveCoverLetterResponse>('cover-letters/save', {
    method: 'POST',
    body: request,
  });
};

/**
 * Get a single cover letter by ID
 */
export const getCoverLetter = async (
  id: string,
  googleId: string
): Promise<{ success: boolean; data: CoverLetter }> => {
  return apiClient<{ success: boolean; data: CoverLetter }>(
    `cover-letters/${id}?googleId=${googleId}`,
    { method: 'GET' }
  );
};

/**
 * List all cover letters for the current user
 */
export const listCoverLetters = async (
  googleId: string
): Promise<{ success: boolean; data: CoverLetterListItem[] }> => {
  return apiClient<{ success: boolean; data: CoverLetterListItem[] }>(
    `cover-letters/list?googleId=${googleId}`,
    { method: 'GET' }
  );
};

/**
 * Delete a cover letter
 */
export const deleteCoverLetter = async (
  id: string,
  googleId: string
): Promise<{ success: boolean }> => {
  return apiClient<{ success: boolean }>(`cover-letters/${id}`, {
    method: 'DELETE',
    body: { googleId },
  });
};
