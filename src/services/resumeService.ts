import apiClient from './apiClient';
import {
  GenerateResumeRequest,
  GenerateResumeResponse,
  SaveResumeRequest,
  SaveResumeResponse,
  Resume,
  ResumeListItem,
  ResumeData,
} from '@/types/resume';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

/**
 * Generate a new tailored resume
 */
export const generateResume = async (
  request: GenerateResumeRequest
): Promise<GenerateResumeResponse> => {
  return apiClient<GenerateResumeResponse>('resume/generate', {
    method: 'POST',
    body: request,
  });
};

/**
 * Compile to PDF and return as blob
 * Can accept either latex string OR resumeData object
 */
export const compileResume = async (options: { latex?: string; resumeData?: ResumeData }): Promise<Blob> => {
  const response = await fetch(`${baseURL}resume/compile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Compilation failed' }));
    throw new Error(error.message || 'Failed to compile PDF');
  }

  return response.blob();
};

/**
 * Save or update a resume
 */
export const saveResume = async (
  request: SaveResumeRequest
): Promise<SaveResumeResponse> => {
  return apiClient<SaveResumeResponse>('resume/save', {
    method: 'POST',
    body: request,
  });
};

/**
 * Get a single resume by ID
 */
export const getResume = async (id: string, googleId: string): Promise<{ success: boolean; data: Resume }> => {
  return apiClient<{ success: boolean; data: Resume }>(`resume/${id}?googleId=${googleId}`, {
    method: 'GET',
  });
};

/**
 * List all resumes for the current user
 */
export const listResumes = async (googleId: string): Promise<{ success: boolean; data: ResumeListItem[] }> => {
  return apiClient<{ success: boolean; data: ResumeListItem[] }>(`resume/list?googleId=${googleId}`, {
    method: 'GET',
  });
};

/**
 * Delete a resume
 */
export const deleteResume = async (id: string, googleId: string): Promise<{ success: boolean }> => {
  return apiClient<{ success: boolean }>(`resume/${id}`, {
    method: 'DELETE',
    body: { googleId },
  });
};
