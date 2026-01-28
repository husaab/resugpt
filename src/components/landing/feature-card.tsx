'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  className?: string
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] transition-all duration-200 hover:border-[var(--accent-color)]/30 hover:shadow-[var(--shadow-md)]',
        className
      )}
    >
      {/* Icon container */}
      <div className="mb-5 w-12 h-12 rounded-xl bg-[var(--accent-light)] flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
        <div className="w-6 h-6" style={{ color: 'var(--accent-color)' }}>
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-xl font-semibold mb-3 transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
    </motion.div>
  )
}
