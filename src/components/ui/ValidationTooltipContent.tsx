'use client'

interface ValidationTooltipContentProps {
  /** List of missing requirements to display */
  missingRequirements: string[]
}

/**
 * Formatted content for validation tooltips showing missing requirements.
 */
export function ValidationTooltipContent({
  missingRequirements,
}: ValidationTooltipContentProps) {
  if (missingRequirements.length === 0) return null

  return (
    <div className="text-left whitespace-normal max-w-[280px]">
      <p
        className="font-medium mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        Complete the following to continue:
      </p>
      <ul className="space-y-1">
        {missingRequirements.map((requirement, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ color: 'var(--warning)' }}>•</span>
            <span>{requirement}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
