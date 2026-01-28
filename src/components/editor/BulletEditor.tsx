'use client'

import { PlusIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface BulletEditorProps {
  bullets: string[]
  onChange: (bullets: string[]) => void
  placeholder?: string
  className?: string
}

export function BulletEditor({
  bullets,
  onChange,
  placeholder = 'Enter bullet point...',
  className,
}: BulletEditorProps) {
  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...bullets]
    newBullets[index] = value
    onChange(newBullets)
  }

  const addBullet = () => {
    onChange([...bullets, ''])
  }

  const removeBullet = (index: number) => {
    const newBullets = bullets.filter((_, i) => i !== index)
    onChange(newBullets)
  }

  const moveBullet = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= bullets.length) return
    const newBullets = [...bullets]
    const [removed] = newBullets.splice(fromIndex, 1)
    newBullets.splice(toIndex, 0, removed)
    onChange(newBullets)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {bullets.map((bullet, index) => (
        <div key={index} className="flex items-start gap-2 group">
          <div className="flex flex-col gap-0.5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => moveBullet(index, index - 1)}
              disabled={index === 0}
              className="p-0.5 hover:bg-[var(--bg-muted)] rounded disabled:opacity-30"
              title="Move up"
            >
              <svg className="w-3 h-3 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => moveBullet(index, index + 1)}
              disabled={index === bullets.length - 1}
              className="p-0.5 hover:bg-[var(--bg-muted)] rounded disabled:opacity-30"
              title="Move down"
            >
              <svg className="w-3 h-3 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex-1">
            <textarea
              value={bullet}
              onChange={(e) => handleBulletChange(index, e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 focus:border-[var(--accent-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          <button
            type="button"
            onClick={() => removeBullet(index)}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Remove bullet"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addBullet}
        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-lg transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add bullet point
      </button>
    </div>
  )
}
