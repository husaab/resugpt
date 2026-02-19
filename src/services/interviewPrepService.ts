import apiClient from './apiClient';
import {
  ListCompaniesResponse,
  GetCompanyResponse,
  GetRoleResponse,
  CreateCompanyResponse,
  UpdateCompanyResponse,
  DeleteCompanyResponse,
  CreateRoleRequest,
  CreateRoleResponse,
  UpdateRoleRequest,
  UpdateRoleResponse,
  DeleteRoleResponse,
} from '@/types/interviewPrep';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

// ─── Public Endpoints ──────────────────────────────────

/**
 * List all companies
 * FREE — no auth required
 */
export const listCompanies = async (): Promise<ListCompaniesResponse> => {
  return apiClient<ListCompaniesResponse>('interview-prep/companies', {
    method: 'GET',
  });
};

/**
 * Get a company with its role summaries
 * FREE — no auth required
 */
export const getCompanyWithRoles = async (
  companyId: string
): Promise<GetCompanyResponse> => {
  return apiClient<GetCompanyResponse>(`interview-prep/companies/${companyId}`, {
    method: 'GET',
  });
};

/**
 * Get full role details including rounds and questions
 * FREE — no auth required
 */
export const getRoleDetails = async (
  roleId: string
): Promise<GetRoleResponse> => {
  return apiClient<GetRoleResponse>(`interview-prep/roles/${roleId}`, {
    method: 'GET',
  });
};

// ─── Admin: Companies ──────────────────────────────────
// These use FormData (multipart/form-data) for logo file upload,
// bypassing apiClient which always sets Content-Type: application/json.

/**
 * Create a new company with optional logo upload (admin only)
 */
export const createCompany = async (
  data: {
    name: string
    industry?: string
    description?: string
    interviewStyle?: string
    googleId: string
  },
  logoFile?: File
): Promise<CreateCompanyResponse> => {
  const formData = new FormData();
  formData.append('googleId', data.googleId);
  formData.append('name', data.name);
  if (data.industry) formData.append('industry', data.industry);
  if (data.description) formData.append('description', data.description);
  if (data.interviewStyle) formData.append('interviewStyle', data.interviewStyle);
  if (logoFile) formData.append('logo', logoFile);

  const response = await fetch(`${baseURL}interview-prep/admin/companies`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type — browser sets it with boundary for multipart
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || 'Failed to create company');
  }

  return response.json();
};

/**
 * Update an existing company with optional logo upload (admin only)
 */
export const updateCompany = async (
  companyId: string,
  data: {
    name?: string
    industry?: string
    description?: string
    interviewStyle?: string
    googleId: string
  },
  logoFile?: File
): Promise<UpdateCompanyResponse> => {
  const formData = new FormData();
  formData.append('googleId', data.googleId);
  if (data.name) formData.append('name', data.name);
  if (data.industry) formData.append('industry', data.industry);
  if (data.description) formData.append('description', data.description);
  if (data.interviewStyle) formData.append('interviewStyle', data.interviewStyle);
  if (logoFile) formData.append('logo', logoFile);

  const response = await fetch(`${baseURL}interview-prep/admin/companies/${companyId}`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || 'Failed to update company');
  }

  return response.json();
};

/**
 * Delete a company (admin only)
 */
export const deleteCompany = async (
  companyId: string,
  googleId: string
): Promise<DeleteCompanyResponse> => {
  return apiClient<DeleteCompanyResponse>(`interview-prep/admin/companies/${companyId}`, {
    method: 'DELETE',
    body: { googleId },
  });
};

// ─── Admin: Roles ──────────────────────────────────────

/**
 * Create a new role for a company (admin only)
 */
export const createRole = async (
  request: CreateRoleRequest
): Promise<CreateRoleResponse> => {
  return apiClient<CreateRoleResponse>('interview-prep/admin/roles', {
    method: 'POST',
    body: request,
  });
};

/**
 * Update an existing role (admin only)
 */
export const updateRole = async (
  roleId: string,
  request: UpdateRoleRequest
): Promise<UpdateRoleResponse> => {
  return apiClient<UpdateRoleResponse>(`interview-prep/admin/roles/${roleId}`, {
    method: 'PUT',
    body: request,
  });
};

/**
 * Delete a role (admin only)
 */
export const deleteRole = async (
  roleId: string,
  googleId: string
): Promise<DeleteRoleResponse> => {
  return apiClient<DeleteRoleResponse>(`interview-prep/admin/roles/${roleId}`, {
    method: 'DELETE',
    body: { googleId },
  });
};
