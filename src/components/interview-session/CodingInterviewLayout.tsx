'use client'

import type { CodingProblemFrontend, TestCaseResult } from '@/types/codingProblem'
import type { Exchange, CurrentSpeaker } from '@/types/interviewRealtime'
import { ProblemStatementPanel } from './ProblemStatementPanel'
import { CodeEditorPanel } from './CodeEditorPanel'
import { TestCasesPanel } from './TestCasesPanel'

interface CodingInterviewLayoutProps {
  // Problem
  problem: CodingProblemFrontend

  // Chat / realtime
  exchanges: Exchange[]
  aiPartialTranscript: string
  userPartialTranscript?: string
  currentSpeaker: CurrentSpeaker

  // Code editor
  language: string
  code: string
  onCodeChange: (code: string) => void
  onLanguageChange: (lang: string) => void

  // Test cases
  testResults: TestCaseResult[] | null
  isRunningTests: boolean
  isSubmittingTests: boolean
  onRunTests: () => void
  onSubmitTests: () => void
}

export function CodingInterviewLayout({
  problem,
  exchanges,
  aiPartialTranscript,
  userPartialTranscript,
  currentSpeaker,
  language,
  code,
  onCodeChange,
  onLanguageChange,
  testResults,
  isRunningTests,
  isSubmittingTests,
  onRunTests,
  onSubmitTests,
}: CodingInterviewLayoutProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left panel — Problem + Chat tabs */}
      <div className="w-2/5 border-r border-[var(--border-color)]">
        <ProblemStatementPanel
          problem={problem}
          exchanges={exchanges}
          aiPartialTranscript={aiPartialTranscript}
          userPartialTranscript={userPartialTranscript}
          currentSpeaker={currentSpeaker}
        />
      </div>

      {/* Right panel — Editor (top) + Tests (bottom) */}
      <div className="w-3/5 flex flex-col">
        {/* Editor — takes most of the vertical space */}
        <div className="flex-1 min-h-0">
          <CodeEditorPanel
            language={language}
            code={code}
            output=""
            isRunning={false}
            isOutputExpanded={false}
            onCodeChange={onCodeChange}
            onLanguageChange={onLanguageChange}
            onRun={() => {}}
            onSubmit={() => {}}
            onToggleOutput={() => {}}
            hideActions
          />
        </div>

        {/* Test cases panel — bottom portion */}
        <div className="h-[280px] flex-shrink-0">
          <TestCasesPanel
            testCases={problem.testCases}
            totalTestCount={problem.totalTestCount}
            testResults={testResults}
            isRunning={isRunningTests}
            isSubmitting={isSubmittingTests}
            onRunTests={onRunTests}
            onSubmitTests={onSubmitTests}
          />
        </div>
      </div>
    </div>
  )
}
