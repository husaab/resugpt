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
import type { RunTestsResponse } from '@/types/codingProblem';
import type {
  GetAnalysisResponse,
  GetCodeSnapshotsResponse,
  SaveCodeSnapshotsResponse,
  UploadAudioResponse,
  GetRoundAudioResponse,
  GetProgressResponse,
} from '@/types/interviewAnalysis';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

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
  duration: number,
  codeSubmission?: string | null,
  codeLanguage?: string | null,
  testResults?: { passed: number; total: number } | null
): Promise<EndRoundResponse> => {
  return apiClient<EndRoundResponse>(
    `interview-sessions/${sessionId}/end-round`,
    {
      method: 'POST',
      body: {
        googleId,
        roundNumber,
        exchanges,
        duration,
        ...(codeSubmission ? { codeSubmission, codeLanguage } : {}),
        ...(testResults ? { testResults } : {}),
      },
    }
  );
};

/**
 * Run test cases against user code for a coding problem round.
 */
export const runTests = async (
  sessionId: string,
  googleId: string,
  roundNumber: number,
  language: string,
  code: string,
  runMode: 'visible' | 'all'
): Promise<RunTestsResponse> => {
  return apiClient<RunTestsResponse>(
    `interview-sessions/${sessionId}/run-tests`,
    {
      method: 'POST',
      body: { googleId, roundNumber, language, code, runMode },
    }
  );
};

// ─── Replay & Analysis Endpoints ────────────────────────────

/**
 * Get moment-level analysis for a completed session.
 * Returns { status: 'pending' } if analysis hasn't started yet.
 */
export const getAnalysis = async (
  sessionId: string,
  googleId: string
): Promise<GetAnalysisResponse> => {
  return apiClient<GetAnalysisResponse>(
    `interview-sessions/${sessionId}/analysis?googleId=${googleId}`,
    { method: 'GET' }
  );
};

/**
 * Save code snapshots captured during a coding round.
 */
export const saveCodeSnapshots = async (
  sessionId: string,
  googleId: string,
  roundNumber: number,
  snapshots: Array<{ code: string; language: string; capturedAt: string }>
): Promise<SaveCodeSnapshotsResponse> => {
  return apiClient<SaveCodeSnapshotsResponse>(
    `interview-sessions/${sessionId}/code-snapshots`,
    { method: 'POST', body: { googleId, roundNumber, snapshots } }
  );
};

/**
 * Get code snapshots for a specific round (for replay).
 */
export const getCodeSnapshots = async (
  sessionId: string,
  googleId: string,
  roundNumber: number
): Promise<GetCodeSnapshotsResponse> => {
  return apiClient<GetCodeSnapshotsResponse>(
    `interview-sessions/${sessionId}/code-snapshots?googleId=${googleId}&roundNumber=${roundNumber}`,
    { method: 'GET' }
  );
};

/**
 * Upload audio recordings for a round.
 * Uses raw fetch with FormData (not apiClient, which forces JSON content-type).
 */
export const uploadRoundAudio = async (
  sessionId: string,
  googleId: string,
  roundNumber: number,
  userAudio: Blob | null,
  aiAudio: Blob | null
): Promise<UploadAudioResponse> => {
  const formData = new FormData();
  formData.append('googleId', googleId);
  formData.append('roundNumber', String(roundNumber));
  if (userAudio) formData.append('userAudio', userAudio, 'user-audio.webm');
  if (aiAudio) formData.append('aiAudio', aiAudio, 'ai-audio.webm');

  const response = await fetch(`${baseURL}interview-sessions/${sessionId}/upload-audio`, {
    method: 'POST',
    body: formData,
  });

  return response.json() as Promise<UploadAudioResponse>;
};

/**
 * Get signed audio URLs for all rounds in a session (for replay).
 */
export const getRoundAudio = async (
  sessionId: string,
  googleId: string
): Promise<GetRoundAudioResponse> => {
  return apiClient<GetRoundAudioResponse>(
    `interview-sessions/${sessionId}/audio?googleId=${googleId}`,
    { method: 'GET' }
  );
};

/**
 * Get progress data — skill trends across completed sessions.
 */
export const getProgress = async (
  googleId: string,
  roleId?: string
): Promise<GetProgressResponse> => {
  const params = roleId
    ? `googleId=${googleId}&roleId=${roleId}`
    : `googleId=${googleId}`;
  return apiClient<GetProgressResponse>(
    `interview-sessions/progress?${params}`,
    { method: 'GET' }
  );
};
