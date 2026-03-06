/**
 * Types for the CodeSignal-style coding interview feature
 */

// ─── Core Problem Shape (stored in coding_problems.data JSONB) ──

export interface CodingProblem {
  title: string
  slug: string
  statement: string // Markdown
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  tags: string[]

  // Function signature (language-agnostic)
  functionName: string
  parameters: { name: string; type: string }[]
  returnType: string

  // Test cases — first `visibleTestCount` shown to candidate, rest hidden
  testCases: TestCase[]
  visibleTestCount: number

  // Per-language starter code
  starterCode: Record<string, string>

  // Reference solution (never sent to frontend)
  referenceSolution?: Record<string, string>

  // AI interviewer guidance
  hints: string[]
  expectedComplexity: { time: string; space: string }
  talkingPoints: string[]

  // Output comparison mode
  compareMode: 'exact' | 'sorted' | 'unordered'
}

export interface TestCase {
  id: string
  input: Record<string, string> // { "nums": "[2,7,11,15]", "target": "9" }
  expectedOutput: string // "[0,1]"
  isHidden: boolean
  description?: string
}

// ─── Frontend-safe Problem (sent to client) ──────────────────

export interface CodingProblemFrontend {
  title: string
  slug: string
  statement: string
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  tags: string[]

  functionName: string
  parameters: { name: string; type: string }[]
  returnType: string

  // Only visible test cases (hidden ones stripped)
  testCases: FrontendTestCase[]
  totalTestCount: number

  starterCode: Record<string, string>

  hints: string[]
  expectedComplexity: { time: string; space: string }

  compareMode: 'exact' | 'sorted' | 'unordered'
}

export interface FrontendTestCase {
  id: string
  input: Record<string, string>
  expectedOutput: string
  description?: string
}

// ─── Test Results ────────────────────────────────────────────

export interface TestCaseResult {
  testCaseId: string
  passed: boolean
  input: Record<string, string>
  expectedOutput: string
  actualOutput: string | null
  error: string | null
  isHidden: boolean
  description?: string
}

export interface RunTestsResponse {
  success: boolean
  data: {
    passed: number
    total: number
    results: TestCaseResult[]
  }
}

// ─── DB Row Shape ────────────────────────────────────────────

export interface CodingProblemRow {
  id: string
  title: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  tags: string[]
  data: CodingProblem
  source: 'curated' | 'enriched'
  source_question_id: string | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

// ─── Admin CRUD ──────────────────────────────────────────────

export interface CreateCodingProblemRequest {
  problem: CodingProblem
  source?: 'curated' | 'enriched'
  sourceQuestionId?: string
}

export interface EnrichProblemRequest {
  questionText: string
  difficulty: 'easy' | 'medium' | 'hard'
  category?: string
}

export interface EnrichProblemResponse {
  success: boolean
  data: CodingProblem
}
