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
