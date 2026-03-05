'use client'

import { useState, useCallback } from 'react'
import { runTests as runTestsApi } from '@/services/interviewSessionService'
import type { TestCaseResult } from '@/types/codingProblem'

interface UseTestRunnerOptions {
  sessionId: string
  googleId: string
  roundNumber: number
}

interface UseTestRunnerReturn {
  testResults: TestCaseResult[] | null
  passedCount: number
  totalCount: number
  isRunning: boolean
  isSubmitting: boolean
  runVisibleTests: (language: string, code: string) => Promise<void>
  submitAllTests: (language: string, code: string) => Promise<{ passed: number; total: number }>
  clearResults: () => void
}

export function useTestRunner({
  sessionId,
  googleId,
  roundNumber,
}: UseTestRunnerOptions): UseTestRunnerReturn {
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null)
  const [passedCount, setPassedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const runVisibleTests = useCallback(
    async (language: string, code: string) => {
      if (!googleId) return
      setIsRunning(true)

      try {
        const res = await runTestsApi(sessionId, googleId, roundNumber, language, code, 'visible')
        if (res.success) {
          setTestResults(res.data.results)
          setPassedCount(res.data.passed)
          setTotalCount(res.data.total)
        }
      } catch (err) {
        console.error('Failed to run tests:', err)
      } finally {
        setIsRunning(false)
      }
    },
    [sessionId, googleId, roundNumber]
  )

  const submitAllTests = useCallback(
    async (language: string, code: string): Promise<{ passed: number; total: number }> => {
      if (!googleId) return { passed: 0, total: 0 }
      setIsSubmitting(true)

      try {
        const res = await runTestsApi(sessionId, googleId, roundNumber, language, code, 'all')
        if (res.success) {
          setTestResults(res.data.results)
          setPassedCount(res.data.passed)
          setTotalCount(res.data.total)
          return { passed: res.data.passed, total: res.data.total }
        }
        return { passed: 0, total: 0 }
      } catch (err) {
        console.error('Failed to submit tests:', err)
        return { passed: 0, total: 0 }
      } finally {
        setIsSubmitting(false)
      }
    },
    [sessionId, googleId, roundNumber]
  )

  const clearResults = useCallback(() => {
    setTestResults(null)
    setPassedCount(0)
    setTotalCount(0)
  }, [])

  return {
    testResults,
    passedCount,
    totalCount,
    isRunning,
    isSubmitting,
    runVisibleTests,
    submitAllTests,
    clearResults,
  }
}
