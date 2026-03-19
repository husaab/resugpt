/**
 * Types for the Interview Replay & Analysis system.
 */

// ─── Analysis Types ─────────────────────────────────────────

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type SkillCategory =
  | 'communication'
  | 'problem_solving'
  | 'technical_depth'
  | 'behavioral_examples'
  | 'code_quality'

export interface MomentAnnotation {
  roundNumber: number
  momentIndex: number
  skillCategory: SkillCategory
  qualityScore: number
  annotation: string
  improvementTip: string
  isKeyMoment: boolean
  keyMomentReason?: string
  exchangeStartIndex: number
  exchangeEndIndex: number
}

export type SkillScores = Partial<Record<SkillCategory, number>>

export interface TopImprovement {
  roundNumber: number
  momentIndex: number
  tip: string
  skillCategory: SkillCategory
}

export interface InterviewAnalysis {
  id: string
  sessionId: string
  status: AnalysisStatus
  moments: MomentAnnotation[]
  skillScores: SkillScores
  topImprovements: TopImprovement[]
  completedAt: string | null
  errorMessage?: string
}

// ─── Code Snapshot Types ────────────────────────────────────

export interface CodeSnapshot {
  id: string
  roundNumber: number
  snapshotIndex: number
  code: string
  language: string
  capturedAt: string
  relativeSeconds: number | null
}

// ─── Audio Types ────────────────────────────────────────────

export interface RoundAudioUrls {
  roundNumber: number
  userAudioUrl: string | null
  aiAudioUrl: string | null
}

// ─── Progress Types ─────────────────────────────────────────

export interface SessionSkillPoint {
  sessionId: string
  completedAt: string
  overallScore: number
  roleId: string
  roleTitle: string
  companyName: string
  skillScores: SkillScores
}

export interface ProgressData {
  sessions: SessionSkillPoint[]
  skillTrends: Partial<Record<SkillCategory, number[]>>
  roundTypeTrends: Record<string, number[]>
}

// ─── API Response Types ─────────────────────────────────────

export interface GetAnalysisResponse {
  success: boolean
  data: InterviewAnalysis
}

export interface GetCodeSnapshotsResponse {
  success: boolean
  data: CodeSnapshot[]
}

export interface SaveCodeSnapshotsResponse {
  success: boolean
  message: string
}

export interface UploadAudioResponse {
  success: boolean
  message: string
}

export interface GetRoundAudioResponse {
  success: boolean
  data: RoundAudioUrls[]
}

export interface GetProgressResponse {
  success: boolean
  data: ProgressData
}
