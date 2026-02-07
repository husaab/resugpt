/**
 * Application Q&A data types matching the backend schema
 */

export interface Question {
  id: string;
  question: string;
  answer: string;
  wordLimit?: number;
}

export interface ApplicationQASession {
  id: string;
  resumeText: string;
  questions: Question[];
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationQAListItem {
  id: string;
  title: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

// Request types

export interface GenerateQARequest {
  resumeText: string;
  questions: Array<{
    question: string;
    wordLimit?: number;
  }>;
  googleId: string;
}

export interface AddQuestionsRequest {
  questions: Array<{
    question: string;
    wordLimit?: number;
  }>;
  googleId: string;
}

export interface RegenerateQuestionRequest {
  googleId: string;
}

export interface UpdateQARequest {
  questions: Question[];
  title?: string;
  googleId: string;
}

// Response types

export interface GenerateQAResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    questions: Question[];
    title: string;
    createdAt: string;
  };
}

export interface AddQuestionsResponse {
  success: boolean;
  message: string;
  data: {
    questions: Question[];
  };
}

export interface RegenerateQuestionResponse {
  success: boolean;
  message: string;
  data: {
    question: Question;
  };
}

export interface UpdateQAResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    updatedAt: string;
  };
}

export interface GetQAResponse {
  success: boolean;
  data: ApplicationQASession;
}

export interface ListQAResponse {
  success: boolean;
  data: ApplicationQAListItem[];
}

export interface DeleteQAResponse {
  success: boolean;
  message: string;
}
