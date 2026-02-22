import apiClient from './apiClient';
import {
  CreateInterviewSessionRequest,
  CreateInterviewSessionResponse,
  ListInterviewSessionsResponse,
  GetInterviewSessionResponse,
  AbandonInterviewSessionResponse,
  DeleteInterviewSessionResponse,
} from '@/types/interviewSession';
import type {
  MintTokenResponse,
  SaveTranscriptResponse,
  EndRoundResponse,
  Exchange,
} from '@/types/interviewRealtime';

/**
 * Create a new interview session
 * Costs 2 credits (deducted by the backend)
 */
export const createInterviewSession = async (
  request: CreateInterviewSessionRequest
): Promise<CreateInterviewSessionResponse> => {
  return apiClient<CreateInterviewSessionResponse>('interview-sessions', {
    method: 'POST',
    body: request,
  });
};

/**
 * List all interview sessions for a user (lightweight summaries)
 */
export const listInterviewSessions = async (
  googleId: string
): Promise<ListInterviewSessionsResponse> => {
  return apiClient<ListInterviewSessionsResponse>(
    `interview-sessions?googleId=${googleId}`,
    { method: 'GET' }
  );
};

/**
 * Get full details for a single interview session
 */
export const getInterviewSession = async (
  sessionId: string,
  googleId: string
): Promise<GetInterviewSessionResponse> => {
  return apiClient<GetInterviewSessionResponse>(
    `interview-sessions/${sessionId}?googleId=${googleId}`,
    { method: 'GET' }
  );
};

/**
 * Abandon an in-progress interview session
 */
export const abandonInterviewSession = async (
  sessionId: string,
  googleId: string
): Promise<AbandonInterviewSessionResponse> => {
  return apiClient<AbandonInterviewSessionResponse>(
    `interview-sessions/${sessionId}/abandon`,
    { method: 'PATCH', body: { googleId } }
  );
};

/**
 * Delete an interview session permanently
 */
export const deleteInterviewSession = async (
  sessionId: string,
  googleId: string
): Promise<DeleteInterviewSessionResponse> => {
  return apiClient<DeleteInterviewSessionResponse>(
    `interview-sessions/${sessionId}`,
    { method: 'DELETE', body: { googleId } }
  );
};

// ─── Realtime Interview Endpoints ───────────────────────

/**
 * Mint an ephemeral OpenAI Realtime token for the current round.
 * Backend bakes the interviewer prompt into the token.
 */
export const mintEphemeralToken = async (
  sessionId: string,
  googleId: string
): Promise<MintTokenResponse> => {
  return apiClient<MintTokenResponse>(
    `interview-sessions/${sessionId}/token`,
    { method: 'POST', body: { googleId } }
  );
};

/**
 * Periodically save transcript exchanges for a round (non-critical).
 */
export const saveTranscript = async (
  sessionId: string,
  googleId: string,
  roundNumber: number,
  exchanges: Exchange[]
): Promise<SaveTranscriptResponse> => {
  return apiClient<SaveTranscriptResponse>(
    `interview-sessions/${sessionId}/save-transcript`,
    { method: 'POST', body: { googleId, roundNumber, exchanges } }
  );
};

/**
 * End a round — triggers GPT-4o scoring and returns results.
 * If it's the last round, also returns overall score + recommendation.
 */
export const endRound = async (
  sessionId: string,
  googleId: string,
  roundNumber: number,
  exchanges: Exchange[],
  duration: number
): Promise<EndRoundResponse> => {
  return apiClient<EndRoundResponse>(
    `interview-sessions/${sessionId}/end-round`,
    { method: 'POST', body: { googleId, roundNumber, exchanges, duration } }
  );
};
