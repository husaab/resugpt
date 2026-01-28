'use client'

import { cn } from '@/lib/utils'

interface BackgroundGradientProps {
  className?: string
}

export function BackgroundGradient({ className }: BackgroundGradientProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 -z-10 overflow-hidden pointer-events-none',
        className
      )}
      aria-hidden="true"
    >
      {/* Top left gradient blob */}
      <div
        className="absolute -top-40 -left-40 w-80 h-80 md:w-96 md:h-96 rounded-full opacity-[0.15] blur-3xl"
        style={{ backgroundColor: 'var(--accent-color)' }}
      />

      {/* Top right gradient blob */}
      <div
        className="absolute -top-20 right-0 w-72 h-72 md:w-80 md:h-80 rounded-full opacity-[0.08] blur-3xl"
        style={{ backgroundColor: 'var(--accent-color)' }}
      />

      {/* Bottom center gradient blob */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 md:w-[500px] md:h-[500px] rounded-full opacity-[0.1] blur-3xl"
        style={{ backgroundColor: 'var(--accent-color)' }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(var(--text-primary) 1px, transparent 1px),
                           linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  )
}
