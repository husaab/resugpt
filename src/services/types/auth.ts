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
    cancelAtPeriodEnd: boolean;
    subscriptionEndsAt: string | null;
    isAdmin: boolean;
    createdAt: string;
  };
}

export interface User {
  userId: string; // This is now the Google ID
  email: string;
  name: string;
  credits: number;
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean;
  subscriptionEndsAt: string | null;
  picture?: string;
}