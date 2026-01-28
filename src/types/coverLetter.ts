/**
 * Cover letter data types matching the backend schema
 */

export type CoverLetterTone =
  | 'professional'
  | 'casual'
  | 'enthusiastic'
  | 'confident'
  | 'formal';

export interface CoverLetter {
  id: string;
  content: string;
  jobTitle: string;
  jobDescription?: string;
  companyName?: string;
  location?: string;
  tone: CoverLetterTone;
  resumeText: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoverLetterListItem {
  id: string;
  jobTitle: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCoverLetterRequest {
  resumeText: string;
  jobTitle: string;
  jobDescription?: string;
  companyName?: string;
  location?: string;
  tone: CoverLetterTone;
  googleId: string;
}

export interface GenerateCoverLetterResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    content: string;
    jobTitle: string;
    companyName?: string;
    createdAt: string;
  };
}

export interface SaveCoverLetterRequest {
  id: string;
  content: string;
  googleId: string;
}

export interface SaveCoverLetterResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    updatedAt: string;
  };
}
