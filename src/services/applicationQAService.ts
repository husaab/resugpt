import apiClient from './apiClient';
import {
  GenerateQARequest,
  GenerateQAResponse,
  AddQuestionsRequest,
  AddQuestionsResponse,
  RegenerateQuestionRequest,
  RegenerateQuestionResponse,
  UpdateQARequest,
  UpdateQAResponse,
  GetQAResponse,
  ListQAResponse,
  DeleteQAResponse,
} from '@/types/applicationQA';

/**
 * Generate a new Q&A session with initial answers
 * Costs 1 credit
 */
export const generateQASession = async (
  request: GenerateQARequest
): Promise<GenerateQAResponse> => {
  return apiClient<GenerateQAResponse>('application-qa/generate', {
    method: 'POST',
    body: request,
  });
};

/**
 * Add new questions to an existing session
 * FREE - no credit cost
 */
export const addQuestionsToSession = async (
  sessionId: string,
  request: AddQuestionsRequest
): Promise<AddQuestionsResponse> => {
  return apiClient<AddQuestionsResponse>(`application-qa/${sessionId}/add-questions`, {
    method: 'POST',
    body: request,
  });
};

/**
 * Regenerate a single answer
 * FREE - no credit cost
 */
export const regenerateQuestionAnswer = async (
  sessionId: string,
  questionId: string,
  request: RegenerateQuestionRequest
): Promise<RegenerateQuestionResponse> => {
  return apiClient<RegenerateQuestionResponse>(
    `application-qa/${sessionId}/regenerate/${questionId}`,
    {
      method: 'POST',
      body: request,
    }
  );
};

/**
 * Update session (inline edits, title changes)
 * FREE - no credit cost
 */
export const updateQASession = async (
  sessionId: string,
  request: UpdateQARequest
): Promise<UpdateQAResponse> => {
  return apiClient<UpdateQAResponse>(`application-qa/${sessionId}`, {
    method: 'PUT',
    body: request,
  });
};

/**
 * Get a single Q&A session by ID
 */
export const getQASession = async (
  sessionId: string,
  googleId: string
): Promise<GetQAResponse> => {
  return apiClient<GetQAResponse>(`application-qa/${sessionId}?googleId=${googleId}`, {
    method: 'GET',
  });
};

/**
 * List all Q&A sessions for the current user
 */
export const listQASessions = async (googleId: string): Promise<ListQAResponse> => {
  return apiClient<ListQAResponse>(`application-qa/list?googleId=${googleId}`, {
    method: 'GET',
  });
};

/**
 * Delete a Q&A session
 */
export const deleteQASession = async (
  sessionId: string,
  googleId: string
): Promise<DeleteQAResponse> => {
  return apiClient<DeleteQAResponse>(`application-qa/${sessionId}`, {
    method: 'DELETE',
    body: { googleId },
  });
};
