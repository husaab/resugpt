'use client'

import { motion } from 'framer-motion'
import { BillingPeriod } from '@/lib/pricing'
import { cn } from '@/lib/utils'

interface BillingToggleProps {
  selected: BillingPeriod
  onChange: (period: BillingPeriod) => void
  savingsText?: string
}

export function BillingToggle({ selected, onChange, savingsText }: BillingToggleProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="inline-flex items-center p-1 rounded-xl border"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
        }}
      >
        <button
          onClick={() => onChange('monthly')}
          className={cn(
            'px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
            selected === 'monthly'
              ? 'bg-[var(--accent-color)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => onChange('annual')}
          className={cn(
            'px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
            selected === 'annual'
              ? 'bg-[var(--accent-color)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          Annual
        </button>
      </div>

      {/* Savings message */}
      {selected === 'annual' && savingsText && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium"
          style={{ color: 'var(--success)' }}
        >
          {savingsText}
        </motion.p>
      )}
    </div>
  )
}
