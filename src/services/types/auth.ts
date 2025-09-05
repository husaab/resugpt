export interface LoginRequest {
  email: string;
  name: string;
  sub: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    userId: string; // This is now the Google ID
    email: string;
    name: string;
    credits: number;
    subscriptionStatus: string;
    createdAt: string;
  };
}

export interface User {
  userId: string; // This is now the Google ID
  email: string;
  name: string;
  credits: number;
  subscriptionStatus: string;
  picture?: string;
}