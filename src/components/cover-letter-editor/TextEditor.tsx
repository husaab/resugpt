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
      <div className="px-3 sm:px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-muted)] flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">
          Edit your cover letter
        </p>
        <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-[var(--text-tertiary)] shrink-0">
          <span>{wordCount} words</span>
          <span className="hidden xs:inline">{charCount} chars</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          className="w-full min-h-full p-3 sm:p-4 text-sm sm:text-base bg-[var(--bg-body)] text-[var(--text-primary)] resize-none focus:outline-none border-0 leading-relaxed"
          spellCheck={true}
          placeholder="Your cover letter will appear here after generation..."
          style={{ minHeight: '300px' }}
        />
      </div>
    </div>
  )
}
