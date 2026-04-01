'use client'

import { motion } from 'framer-motion'
import type { CurrentSpeaker } from '@/types/interviewRealtime'

interface InterviewerOrbProps {
  currentSpeaker: CurrentSpeaker
  size?: number
  className?: string
}

function getVariant(speaker: CurrentSpeaker): 'idle' | 'speaking-ai' | 'speaking-candidate' {
  if (speaker === 'interviewer') return 'speaking-ai'
  if (speaker === 'candidate') return 'speaking-candidate'
  return 'idle'
}

const glowVariants = {
  'idle': {
    scale: [1, 1.08, 1],
    opacity: [0.4, 0.6, 0.4],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
  },
  'speaking-ai': {
    scale: [1, 1.35, 1],
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const },
  },
  'speaking-candidate': {
    scale: [1, 1.15, 1],
    opacity: [0.4, 0.7, 0.4],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const },
  },
}

const coreVariants = {
  'idle': {
    scale: [1, 1.03, 1],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
  },
  'speaking-ai': {
    scale: [1, 1.1, 1],
    filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const },
  },
  'speaking-candidate': {
    scale: [1, 1.05, 1],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const },
  },
}

const BAR_DELAYS = [0, 0.15, 0.3, 0.1, 0.25]

export function InterviewerOrb({ currentSpeaker, size = 100, className = '' }: InterviewerOrbProps) {
  const variant = getVariant(currentSpeaker)
  const isSpeakingAi = variant === 'speaking-ai'
  const barSize = size * 0.03
  const barMaxHeight = size * 0.2

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ backgroundColor: 'var(--accent-color)' }}
        variants={glowVariants}
        animate={variant}
      />

      {/* Waveform bars — arranged around the orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        {BAR_DELAYS.map((delay, i) => {
          const angle = (i / BAR_DELAYS.length) * 360
          const radius = size * 0.42
          const x = Math.cos((angle * Math.PI) / 180) * radius
          const y = Math.sin((angle * Math.PI) / 180) * radius

          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: barSize,
                height: barMaxHeight,
                backgroundColor: 'var(--accent-color)',
                opacity: isSpeakingAi ? 0.8 : 0.25,
                transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
                animation: isSpeakingAi
                  ? `orb-bar 0.5s ease-in-out ${delay}s infinite`
                  : 'none',
                transformOrigin: 'center center',
                transition: 'opacity 0.3s ease',
              }}
            />
          )
        })}
      </div>

      {/* Core orb */}
      <motion.div
        className="rounded-full shadow-lg will-change-transform"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          background: `radial-gradient(circle at 35% 35%, var(--accent-light), var(--accent-color))`,
        }}
        variants={coreVariants}
        animate={variant}
      />
    </div>
  )
}
