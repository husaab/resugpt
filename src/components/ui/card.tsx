'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface CardProps {
  className?: string
  hover?: boolean
  children?: React.ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, children }, ref) => {
    const baseStyles = cn(
      'rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] transition-all duration-200',
      hover && 'hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-md)]',
      className
    )

    if (hover) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className={baseStyles}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={baseStyles}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

interface CardSectionProps {
  className?: string
  children?: React.ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-5 border-b border-[var(--border-color)]', className)}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

export const CardContent = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, children }, ref) => (
    <div ref={ref} className={cn('p-6', className)}>
      {children}
    </div>
  )
)

CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-t border-[var(--border-color)]', className)}
    >
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'
