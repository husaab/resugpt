'use client'

import { useCallback, useRef } from 'react'

interface AdvancedEditorProps {
  latex: string
  onChange: (latex: string) => void
}

export function AdvancedEditor({ latex, onChange }: AdvancedEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  // Sync line numbers scroll with textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const lineCount = latex ? latex.split('\n').length : 1

  return (
    <div className="h-full flex flex-col border border-[var(--border-color)] rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-muted)]">
        <p className="text-sm text-[var(--text-secondary)]">
          Edit the LaTeX source directly. Changes here will override the structured editor.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="w-12 bg-[var(--bg-muted)] border-r border-[var(--border-color)] overflow-hidden select-none"
        >
          <div className="py-3 px-2 font-mono text-xs text-[var(--text-tertiary)] text-right">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="h-[1.5rem] leading-[1.5rem]">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <textarea
          ref={textareaRef}
          value={latex}
          onChange={handleChange}
          onScroll={handleScroll}
          className="flex-1 p-3 font-mono text-sm bg-[var(--bg-body)] text-[var(--text-primary)] resize-none focus:outline-none border-0 leading-[1.5rem]"
          spellCheck={false}
          placeholder="LaTeX source will appear here after generation..."
        />
      </div>
    </div>
  )
}
