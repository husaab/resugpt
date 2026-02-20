/**
 * Interview Prep data types matching the backend schema
 */

// ─── Company Types ─────────────────────────────────────

export interface CompanyListItem {
  id: string;
  name: string;
  logo: string | null;
  industry: string | null;
  description: string | null;
  interviewStyle: string | null;
}

export interface Company {
  id: string;
  name: string;
  logo: string | null;
  industry: string | null;
  description: string | null;
  interviewStyle: string | null;
  createdAt: string;
  updatedAt: string;
  roles: RoleSummary[];
}

// ─── Role Types ────────────────────────────────────────

export interface RoleSummary {
  id: string;
  title: string;
  level: 'intern' | 'junior' | 'mid' | 'senior' | 'staff';
  department: string | null;
  description: string | null;
  roundCount: number;
}

export interface InterviewRound {
  roundNumber: number;
  type: 'behavioral' | 'technical' | 'system_design' | 'phone_screen' | 'hiring_manager';
  title: string;
  description: string;
  duration: number;
  questions: InterviewQuestion[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  followUps: string[];
  evaluationCriteria: string[];
  sampleAnswer: string;
  source: 'manual' | 'user_submitted';
  submittedBy?: string;
}

export interface RoleDetails {
  id: string;
  title: string;
  level: 'intern' | 'junior' | 'mid' | 'senior' | 'staff';
  department: string | null;
  description: string | null;
  rounds: InterviewRound[];
  tips: string[];
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
}

// ─── Request Types ─────────────────────────────────────

export interface CreateCompanyRequest {
  name: string;
  logo?: string;
  industry?: string;
  description?: string;
  interviewStyle?: string;
  googleId: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  logo?: string;
  industry?: string;
  description?: string;
  interviewStyle?: string;
  googleId: string;
}

export interface CreateRoleRequest {
  companyId: string;
  title: string;
  level: 'intern' | 'junior' | 'mid' | 'senior' | 'staff';
  department?: string;
  description?: string;
  rounds?: InterviewRound[];
  tips?: string[];
  googleId: string;
}

export interface UpdateRoleRequest {
  title?: string;
  level?: 'intern' | 'junior' | 'mid' | 'senior' | 'staff';
  department?: string;
  description?: string;
  rounds?: InterviewRound[];
  tips?: string[];
  googleId: string;
}

// ─── Response Types ────────────────────────────────────

export interface ListCompaniesResponse {
  success: boolean;
  data: CompanyListItem[];
}

export interface GetCompanyResponse {
  success: boolean;
  data: Company;
}

export interface GetRoleResponse {
  success: boolean;
  data: RoleDetails;
}

export interface CreateCompanyResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    logo: string | null;
    industry: string | null;
    description: string | null;
    interviewStyle: string | null;
    createdAt: string;
  };
}

export interface UpdateCompanyResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    logo: string | null;
    industry: string | null;
    description: string | null;
    interviewStyle: string | null;
    updatedAt: string;
  };
}

export interface DeleteCompanyResponse {
  success: boolean;
  message: string;
}

export interface CreateRoleResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    companyId: string;
    title: string;
    level: string;
    department: string | null;
    description: string | null;
    rounds: InterviewRound[];
    tips: string[];
    createdAt: string;
  };
}

export interface UpdateRoleResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    companyId: string;
    title: string;
    level: string;
    department: string | null;
    description: string | null;
    rounds: InterviewRound[];
    tips: string[];
    updatedAt: string;
  };
}

export interface DeleteRoleResponse {
  success: boolean;
  message: string;
}

// ─── External Submission Types ─────────────────────────

export interface SubmitExternalDataResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    source: string;
    status: string;
    createdAt: string;
  };
}

// ─── Admin Submission Types ───────────────────────────

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type SubmissionSource = 'user' | 'scraper';

export interface SubmissionListItem {
  id: string;
  source: SubmissionSource;
  status: SubmissionStatus;
  companyName: string;
  roleTitle: string;
  roleLevel: string;
  submittedBy: string | null;
  submittedByUsername: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface SubmissionDetails {
  id: string;
  source: SubmissionSource;
  status: SubmissionStatus;
  data: {
    company: {
      name: string;
      logo?: string | null;
      industry?: string;
      description?: string;
      interviewStyle?: string;
    };
    role: {
      title: string;
      level: string;
      department?: string;
      description?: string;
      rounds?: InterviewRound[];
      tips?: string[];
    };
  };
  submittedBy: string | null;
  submittedByUsername: string | null;
  submittedByEmail: string | null;
  reviewedBy: string | null;
  reviewedByUsername: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  linkedCompanyId: string | null;
  linkedCompanyName: string | null;
  createdCompanyId: string | null;
  createdRoleId: string | null;
  scraperMetadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListSubmissionsParams {
  status?: SubmissionStatus;
  source?: SubmissionSource;
  limit?: number;
  offset?: number;
}

export interface ListSubmissionsResponse {
  success: boolean;
  data: SubmissionListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetSubmissionResponse {
  success: boolean;
  data: SubmissionDetails;
}

export interface ApproveSubmissionRequest {
  linkedCompanyId?: string;
  reviewNotes?: string;
}

export interface ApproveSubmissionResponse {
  success: boolean;
  message: string;
  data: {
    companyId: string;
    roleId: string;
    companyCreated: boolean;
  };
}

export interface RejectSubmissionRequest {
  rejectionReason: string;
  reviewNotes?: string;
}

export interface RejectSubmissionResponse {
  success: boolean;
  message: string;
}
