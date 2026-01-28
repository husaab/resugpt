'use client'

import { useCallback, useRef, useEffect } from 'react'

interface TextEditorProps {
  content: string
  onChange: (content: string) => void
}

export function TextEditor({ content, onChange }: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = content ? content.length : 0

  return (
    <div className="h-full flex flex-col border border-[var(--border-color)] rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-muted)] flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Edit your cover letter below
        </p>
        <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          className="w-full min-h-full p-4 text-base bg-[var(--bg-body)] text-[var(--text-primary)] resize-none focus:outline-none border-0 leading-relaxed"
          spellCheck={true}
          placeholder="Your cover letter will appear here after generation..."
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  )
}
