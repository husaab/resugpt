import apiClient from './apiClient';
import { LoginResponse, LoginRequest } from './types/auth';

// Since we're using NextAuth, we don't need token management
// But we can still have backend API calls for user operations

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  return apiClient<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: credentials,
  });
};

// Update user credits (when they use/purchase credits)
export const updateCredits = async (googleId: string, credits: number) => {
  return apiClient(`/api/users/${googleId}/credits`, {
    method: 'PATCH',
    body: { credits },
  });
};

// Update subscription status (when they upgrade/downgrade)
export const updateSubscription = async (googleId: string, subscriptionStatus: string) => {
  return apiClient(`/api/users/${googleId}/subscription`, {
    method: 'PATCH', 
    body: { subscriptionStatus },
  });
};

// Generate resume (uses credits)
export const generateResume = async (googleId: string, resumeData: any) => {
  return apiClient('/api/resumes/generate', {
    method: 'POST',
    body: { googleId, ...resumeData },
  });
};

// Generate cover letter (uses credits) 
export const generateCoverLetter = async (googleId: string, coverLetterData: any) => {
  return apiClient('/api/cover-letters/generate', {
    method: 'POST',
    body: { googleId, ...coverLetterData },
  });
};

