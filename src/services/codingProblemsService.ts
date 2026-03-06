import apiClient from './apiClient'
import type {
  CodingProblem,
  CodingProblemRow,
  EnrichProblemRequest,
  EnrichProblemResponse,
} from '@/types/codingProblem'

interface ListProblemsResponse {
  success: boolean
  data: CodingProblemRow[]
}

interface GetProblemResponse {
  success: boolean
  data: CodingProblemRow
}

interface CreateProblemResponse {
  success: boolean
  message: string
  data: CodingProblemRow
}

interface UpdateProblemResponse {
  success: boolean
  message: string
  data: CodingProblemRow
}

interface DeleteProblemResponse {
  success: boolean
  message: string
}

interface VerifyProblemResponse {
  success: boolean
  data: {
    verified: boolean
    results: Record<string, { passed: number; total: number }>
  }
}

export const listCodingProblems = async (
  googleId: string,
  filters?: { difficulty?: string; category?: string; verified?: boolean }
): Promise<ListProblemsResponse> => {
  const params = new URLSearchParams({ googleId })
  if (filters?.difficulty) params.set('difficulty', filters.difficulty)
  if (filters?.category) params.set('category', filters.category)
  if (filters?.verified) params.set('verified', 'true')

  return apiClient<ListProblemsResponse>(`coding-problems?${params}`, { method: 'GET' })
}

export const getCodingProblem = async (
  id: string,
  googleId: string
): Promise<GetProblemResponse> => {
  return apiClient<GetProblemResponse>(`coding-problems/${id}?googleId=${googleId}`, {
    method: 'GET',
  })
}

export const createCodingProblem = async (
  googleId: string,
  problem: CodingProblem,
  source?: 'curated' | 'enriched',
  sourceQuestionId?: string
): Promise<CreateProblemResponse> => {
  return apiClient<CreateProblemResponse>('coding-problems', {
    method: 'POST',
    body: { googleId, problem, source, sourceQuestionId },
  })
}

export const updateCodingProblem = async (
  id: string,
  googleId: string,
  problem: CodingProblem
): Promise<UpdateProblemResponse> => {
  return apiClient<UpdateProblemResponse>(`coding-problems/${id}`, {
    method: 'PUT',
    body: { googleId, problem },
  })
}

export const deleteCodingProblem = async (
  id: string,
  googleId: string
): Promise<DeleteProblemResponse> => {
  return apiClient<DeleteProblemResponse>(`coding-problems/${id}`, {
    method: 'DELETE',
    body: { googleId },
  })
}

export const enrichProblem = async (
  googleId: string,
  request: EnrichProblemRequest
): Promise<EnrichProblemResponse> => {
  return apiClient<EnrichProblemResponse>('coding-problems/enrich', {
    method: 'POST',
    body: { googleId, ...request },
  })
}

export const verifyCodingProblem = async (
  id: string,
  googleId: string
): Promise<VerifyProblemResponse> => {
  return apiClient<VerifyProblemResponse>(`coding-problems/${id}/verify`, {
    method: 'POST',
    body: { googleId },
  })
}

export const markCodingProblemVerified = async (
  id: string,
  googleId: string,
  verified: boolean
): Promise<UpdateProblemResponse> => {
  return apiClient<UpdateProblemResponse>(`coding-problems/${id}/verify`, {
    method: 'PATCH',
    body: { googleId, verified },
  })
}
