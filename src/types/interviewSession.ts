/**
 * Interview Session data types matching the backend schema
 */

import type { CodingProblemFrontend, TestCaseResult } from './codingProblem'

// ─── Shared Types ────────────────────────────────────────

export type InterviewSessionStatus = 'in_progress' | 'completed' | 'abandoned'

export type SessionRoundStatus = 'pending' | 'in_progress' | 'completed'

export interface SessionRound {
  roundNumber: number
  type: string
  status: SessionRoundStatus
  exchanges: Exchange[]
  score: number | null
  strengths: string[]
  weaknesses: string[]
  feedback: string | null
  duration: number | null
  codeSubmission: string | null
  codeLanguage: string | null
  codingProblemId: string | null
  codingProblem: CodingProblemFrontend | null
  testResults: TestCaseResult[] | null
}

export interface Exchange {
  role: 'interviewer' | 'candidate'
  content: string
  audioUrl?: string
  timestamp: string
}

// ─── List Item (lightweight, from GET /interview-sessions) ───

export interface InterviewSessionListItem {
  id: string
  company: {
    id: string
    name: string
    logo: string | null
  }
  role: {
    id: string
    title: string
    level: string
  }
  status: InterviewSessionStatus
  currentRound: number
  roundCount: number
  overallScore: number | null
  recommendation: string | null
  creditsUsed: number
  startedAt: string
  completedAt: string | null
}

// ─── Full Session (from GET /interview-sessions/:id) ─────

export interface InterviewSession {
  id: string
  company: {
    id: string
    name: string
    logo: string | null
  }
  role: {
    id: string
    title: string
    level: string
    department: string | null
  }
  status: InterviewSessionStatus
  currentRound: number
  rounds: SessionRound[]
  overallScore: number | null
  recommendation: string | null
  feedback: string | null
  creditsUsed: number
  startedAt: string
  completedAt: string | null
}

// ─── Request Types ───────────────────────────────────────

export interface CreateInterviewSessionRequest {
  googleId: string
  roleId: string
}

// ─── Response Types ──────────────────────────────────────

export interface CreateInterviewSessionResponse {
  success: boolean
  message: string
  data: {
    id: string
    companyId: string
    roleId: string
    status: InterviewSessionStatus
    currentRound: number
    rounds: SessionRound[]
    creditsUsed: number
    startedAt: string
  }
}

export interface ListInterviewSessionsResponse {
  success: boolean
  data: InterviewSessionListItem[]
}

export interface GetInterviewSessionResponse {
  success: boolean
  data: InterviewSession
}

export interface AbandonInterviewSessionResponse {
  success: boolean
  message: string
  data: {
    id: string
    status: InterviewSessionStatus
    completedAt: string
  }
}

export interface DeleteInterviewSessionResponse {
  success: boolean
  message: string
}
