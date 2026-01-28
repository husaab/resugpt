'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--bg-muted)] text-[var(--text-primary)]',
        primary:
          'bg-[var(--accent-light)] text-[var(--accent-color)]',
        success:
          'bg-[var(--success-light)] text-[var(--success)]',
        warning:
          'bg-[var(--warning-light)] text-[var(--warning)]',
        error:
          'bg-[var(--error-light)] text-[var(--error)]',
        outline:
          'border border-[var(--border-color)] text-[var(--text-secondary)]',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'
