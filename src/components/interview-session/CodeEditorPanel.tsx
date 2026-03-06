'use client'

import { useCallback } from 'react'
import Editor from '@monaco-editor/react'
import {
  PlayIcon,
  PaperAirplaneIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { useTheme } from '@/components/theme-provider'

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
] as const

const DEFAULT_CODE: Record<string, string> = {
  javascript: '// Write your solution here\nfunction solution() {\n  \n}\n',
  typescript: '// Write your solution here\nfunction solution(): void {\n  \n}\n',
  python: '# Write your solution here\ndef solution():\n    pass\n',
  java: '// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n',
  cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
  go: '// Write your solution here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println()\n}\n',
}

interface CodeEditorPanelProps {
  language: string
  code: string
  output: string
  isRunning: boolean
  isOutputExpanded: boolean
  onCodeChange: (code: string) => void
  onLanguageChange: (lang: string) => void
  onRun: () => void
  onSubmit: () => void
  onToggleOutput: () => void
  hideActions?: boolean
}

export function CodeEditorPanel({
  language,
  code,
  output,
  isRunning,
  isOutputExpanded,
  onCodeChange,
  onLanguageChange,
  onRun,
  onSubmit,
  onToggleOutput,
  hideActions,
}: CodeEditorPanelProps) {
  const { resolvedTheme } = useTheme()

  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newLang = e.target.value
      onLanguageChange(newLang)
      // If code is still default/empty for previous language, swap to new default
      const prevDefault = DEFAULT_CODE[language] || ''
      if (!code || code === prevDefault) {
        onCodeChange(DEFAULT_CODE[newLang] || '')
      }
    },
    [language, code, onLanguageChange, onCodeChange]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Top bar — language selector + actions */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
        <select
          value={language}
          onChange={handleLanguageChange}
          className="text-sm bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        {!hideActions && (
          <div className="flex items-center gap-2">
            <button
              onClick={onRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayIcon className="w-4 h-4" />
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
            <button
              onClick={onSubmit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-[var(--accent-color)] text-white hover:opacity-90"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Submit
            </button>
          </div>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          language={language === 'cpp' ? 'cpp' : language}
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(value) => onCodeChange(value || '')}
          loading={
            <div className="flex items-center justify-center h-full bg-[var(--bg-body)]">
              <p className="text-sm text-[var(--text-tertiary)]">Loading editor...</p>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 12 },
          }}
        />
      </div>

      {/* Output console (hidden when actions are hidden — test panel replaces it) */}
      {!hideActions && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-elevated)]">
          <button
            onClick={onToggleOutput}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>Output</span>
            {isOutputExpanded ? (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronUpIcon className="w-3.5 h-3.5" />
            )}
          </button>

          {isOutputExpanded && (
            <div className="px-3 pb-3 max-h-48 overflow-y-auto">
              {output ? (
                <pre className="text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {output}
                </pre>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] italic">
                  Run your code to see output here.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { DEFAULT_CODE }
