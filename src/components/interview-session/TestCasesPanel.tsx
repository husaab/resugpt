'use client'

import { useState } from 'react'
import type { FrontendTestCase, TestCaseResult } from '@/types/codingProblem'
import {
  PlayIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface TestCasesPanelProps {
  testCases: FrontendTestCase[]
  totalTestCount: number
  testResults: TestCaseResult[] | null
  isRunning: boolean
  isSubmitting: boolean
  onRunTests: () => void
  onSubmitTests: () => void
}

export function TestCasesPanel({
  testCases,
  totalTestCount,
  testResults,
  isRunning,
  isSubmitting,
  onRunTests,
  onSubmitTests,
}: TestCasesPanelProps) {
  const [activeTestIndex, setActiveTestIndex] = useState(0)

  const passedCount = testResults?.filter((r) => r.passed).length ?? 0
  const totalRan = testResults?.length ?? 0
  const hasResults = testResults && testResults.length > 0

  // Map results by testCaseId for lookup
  const resultMap = new Map<string, TestCaseResult>()
  testResults?.forEach((r) => resultMap.set(r.testCaseId, r))

  const activeTest = testCases[activeTestIndex]
  const activeResult = activeTest ? resultMap.get(activeTest.id) : undefined

  return (
    <div className="flex flex-col h-full border-t border-[var(--border-color)]">
      {/* Header with summary + actions */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Test Cases</span>
          {hasResults && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                passedCount === totalRan
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : passedCount > 0
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-red-500/15 text-red-400'
              }`}
            >
              {passedCount}/{totalRan} passed
              {totalRan < totalTestCount && ` (${totalTestCount} total)`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunTests}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="w-3.5 h-3.5" />
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
          <button
            onClick={onSubmitTests}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[var(--accent-color)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-3.5 h-3.5" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Test case tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-body)] border-b border-[var(--border-color)] overflow-x-auto">
        {testCases.map((tc, i) => {
          const result = resultMap.get(tc.id)
          const isActive = i === activeTestIndex

          return (
            <button
              key={tc.id}
              onClick={() => setActiveTestIndex(i)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-color)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
              }`}
            >
              {result && (
                result.passed ? (
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircleIcon className="w-3.5 h-3.5 text-red-400" />
                )
              )}
              Case {i + 1}
            </button>
          )
        })}

        {/* Hidden test indicators */}
        {totalTestCount > testCases.length && (
          <span className="px-2 py-1 text-xs text-[var(--text-tertiary)] flex-shrink-0">
            + {totalTestCount - testCases.length} hidden
          </span>
        )}
      </div>

      {/* Active test case detail */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {activeTest ? (
          <div className="space-y-3">
            {/* Description */}
            {activeTest.description && (
              <p className="text-xs text-[var(--text-tertiary)] italic">
                {activeTest.description}
              </p>
            )}

            {/* Input */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Input</p>
              <div className="bg-[var(--bg-muted)] rounded-lg p-2.5 border border-[var(--border-color)]">
                {Object.entries(activeTest.input).map(([key, value]) => (
                  <p key={key} className="text-xs font-mono text-[var(--text-secondary)]">
                    <span className="text-[var(--text-tertiary)]">{key} = </span>
                    {value}
                  </p>
                ))}
              </div>
            </div>

            {/* Expected output */}
            <div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Expected Output</p>
              <div className="bg-[var(--bg-muted)] rounded-lg p-2.5 border border-[var(--border-color)]">
                <p className="text-xs font-mono text-[var(--text-secondary)]">
                  {activeTest.expectedOutput}
                </p>
              </div>
            </div>

            {/* Actual output (only shown when we have results) */}
            {activeResult && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-medium text-[var(--text-tertiary)]">Actual Output</p>
                  {activeResult.passed ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Passed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <XCircleIcon className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                </div>
                <div
                  className={`rounded-lg p-2.5 border ${
                    activeResult.passed
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  {activeResult.error ? (
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap">
                        {activeResult.error}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-[var(--text-secondary)]">
                      {activeResult.actualOutput ?? 'No output'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
            No test cases available
          </p>
        )}
      </div>
    </div>
  )
}
