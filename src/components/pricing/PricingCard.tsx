'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PricingTier,
  BillingPeriod,
  getDisplayPrice,
  getPriceLabel,
  formatPrice,
} from '@/lib/pricing'
import { cn } from '@/lib/utils'

interface PricingCardProps {
  tier: PricingTier
  billingPeriod: BillingPeriod
  onSelect: (tierId: string) => void
  isCurrentPlan?: boolean
  currentTier?: string
  disabled?: boolean
  className?: string
}

export function PricingCard({
  tier,
  billingPeriod,
  onSelect,
  isCurrentPlan,
  currentTier,
  disabled,
  className,
}: PricingCardProps) {
  const isHighlighted = tier.highlighted
  const isFreeTier = tier.monthlyPrice === 0

  // Check if this is a lower tier than the user's current plan
  const isLowerTier = tier.id === 'free' && (currentTier === 'pro' || currentTier === 'premium')

  return (
    <motion.div
      whileHover={isHighlighted ? { y: -8, scale: 1.02 } : { y: -4 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'relative flex flex-col rounded-2xl border p-6 md:p-8 transition-all duration-200 h-full',
        'bg-[var(--bg-elevated)]',
        isHighlighted
          ? 'border-[var(--accent-color)] shadow-lg'
          : 'border-[var(--border-color)] hover:border-[var(--border-hover)]',
        className
      )}
    >
      {/* Most Popular Badge */}
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="primary" size="sm">
            Most Popular
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3
          className="text-xl md:text-2xl font-bold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {tier.name}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {tier.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {getDisplayPrice(tier, billingPeriod)}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {getPriceLabel(billingPeriod, isFreeTier)}
          </span>
        </div>

        {/* Annual billing note */}
        {billingPeriod === 'annual' && !isFreeTier && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            {formatPrice(tier.annualPrice / 12)}/month  
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {tier.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            {feature.included ? (
              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="var(--success)"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="var(--text-tertiary)"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span
              className={cn('text-sm', !feature.included && 'line-through')}
              style={{
                color: feature.included
                  ? 'var(--text-primary)'
                  : 'var(--text-tertiary)',
              }}
            >
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button
        variant={isHighlighted ? 'primary' : 'secondary'}
        size="lg"
        className="w-full"
        onClick={() => onSelect(tier.id)}
        disabled={isCurrentPlan || isLowerTier || disabled}
      >
        {isCurrentPlan ? 'Current Plan' : isLowerTier ? 'Free Features' : tier.ctaText}
      </Button>
    </motion.div>
  )
}
