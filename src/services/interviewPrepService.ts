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
  SubmitExternalDataResponse,
  ListSubmissionsParams,
  ListSubmissionsResponse,
  GetSubmissionResponse,
  ApproveSubmissionRequest,
  ApproveSubmissionResponse,
  RejectSubmissionRequest,
  RejectSubmissionResponse,
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

// ─── User Submissions ──────────────────────────────────

/**
 * Submit crowdsourced interview data (any authenticated user)
 */
export const submitExternalData = async (
  payload: { company: Record<string, unknown>; role: Record<string, unknown> },
  googleId: string
): Promise<SubmitExternalDataResponse> => {
  return apiClient<SubmitExternalDataResponse>('submissions', {
    method: 'POST',
    body: { googleId, data: payload },
  });
};

// ─── Admin: Submissions ──────────────────────────────────

/**
 * List all submissions with optional filters (admin only)
 */
export const listSubmissions = async (
  params: ListSubmissionsParams,
  googleId: string
): Promise<ListSubmissionsResponse> => {
  const query = new URLSearchParams();
  query.append('googleId', googleId);
  if (params.status) query.append('status', params.status);
  if (params.source) query.append('source', params.source);
  query.append('limit', String(params.limit || 50));
  query.append('offset', String(params.offset || 0));

  return apiClient<ListSubmissionsResponse>(
    `submissions/admin?${query.toString()}`,
    { method: 'GET' }
  );
};

/**
 * Get full details of a single submission (admin only)
 */
export const getSubmissionDetails = async (
  id: string,
  googleId: string
): Promise<GetSubmissionResponse> => {
  const query = new URLSearchParams({ googleId });
  return apiClient<GetSubmissionResponse>(
    `submissions/admin/${id}?${query.toString()}`,
    { method: 'GET' }
  );
};

/**
 * Approve a submission — atomically creates company + role (admin only)
 */
export const approveSubmission = async (
  id: string,
  data: ApproveSubmissionRequest,
  googleId: string
): Promise<ApproveSubmissionResponse> => {
  return apiClient<ApproveSubmissionResponse>(
    `submissions/admin/${id}/approve`,
    { method: 'POST', body: { ...data, googleId } }
  );
};

/**
 * Reject a submission with a reason (admin only)
 */
export const rejectSubmission = async (
  id: string,
  data: RejectSubmissionRequest,
  googleId: string
): Promise<RejectSubmissionResponse> => {
  return apiClient<RejectSubmissionResponse>(
    `submissions/admin/${id}/reject`,
    { method: 'POST', body: { ...data, googleId } }
  );
};
