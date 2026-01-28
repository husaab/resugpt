/**
 * Resume data types matching the backend schema
 */

export interface ResumeHeader {
  name: string;
  phone: string;
  email: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface EducationEntry {
  school: string;
  location: string;
  degree: string;
  dates: string;
  bullets?: string[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface ProjectEntry {
  name: string;
  technologies: string;
  date: string;
  bullets: string[];
}

export interface ResumeSkills {
  languages: string;
  frameworks: string;
  tools: string;
}

export interface ResumeData {
  // Metadata extracted from job description during generation
  targetCompany?: string;
  targetRole?: string;
  // Resume content
  header: ResumeHeader;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: ResumeSkills;
}

export interface Resume {
  id: string;
  resumeData: ResumeData;
  latex: string;
  jobDescription?: string;
  title?: string;
  targetCompany?: string;
  targetRole?: string;
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeListItem {
  id: string;
  title: string;
  targetCompany?: string;
  targetRole?: string;
  thumbnailUrl?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateResumeRequest {
  resumeText: string;
  jobDescription: string;
  googleId: string;
}

export interface GenerateResumeResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    resumeData: ResumeData;
    latex: string;
    title: string;
    createdAt: string;
  };
}

export interface SaveResumeRequest {
  id?: string;
  resumeData: ResumeData;
  latex: string;
  jobDescription?: string;
  googleId: string;
}

export interface SaveResumeResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    updatedAt: string;
  };
}
