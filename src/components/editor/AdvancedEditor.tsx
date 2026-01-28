'use client'

import { useCallback } from 'react'

interface AdvancedEditorProps {
  latex: string
  onChange: (latex: string) => void
}

export function AdvancedEditor({ latex, onChange }: AdvancedEditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-muted)]">
        <p className="text-sm text-[var(--text-secondary)]">
          Edit the LaTeX source directly. Changes here will override the structured editor.
        </p>
      </div>

      <div className="flex-1 relative">
        <textarea
          value={latex}
          onChange={handleChange}
          className="w-full h-full p-4 font-mono text-sm bg-[var(--bg-body)] text-[var(--text-primary)] resize-none focus:outline-none border-0"
          spellCheck={false}
          placeholder="LaTeX source will appear here after generation..."
        />

        {/* Line numbers overlay - simple implementation */}
        <div className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none border-r border-[var(--border-color)] bg-[var(--bg-muted)]/50">
          <div className="p-4 font-mono text-xs text-[var(--text-tertiary)] leading-[1.5rem]">
            {latex.split('\n').slice(0, 100).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        </div>

        <style jsx>{`
          textarea {
            padding-left: 3.5rem;
            line-height: 1.5rem;
          }
        `}</style>
      </div>
    </div>
  )
}
