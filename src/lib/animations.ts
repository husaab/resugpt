import { Variants, Transition, Easing } from 'framer-motion'

// Shared easing curve - smooth and professional
const ease: Easing = [0.25, 0.1, 0.25, 1]

// Base transition settings
export const defaultTransition: Transition = {
  duration: 0.5,
  ease,
}

// Fade in with upward movement
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.3, ease }
  },
}

// Simple fade in
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, ease }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  },
}

// Scale in from slightly smaller
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.2 }
  },
}

// Container for staggered children
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// Faster stagger for lists
export const staggerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

// Slide in from left
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -32 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease }
  },
}

// Slide in from right
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 32 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease }
  },
}

// Hover animation for cards
export const cardHover = {
  y: -4,
  transition: { duration: 0.25, ease: 'easeOut' as const },
}

// Tap/press animation
export const tapScale = {
  scale: 0.98,
}

// Subtle hover scale
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
}

// Button hover with spring
export const buttonHover = {
  scale: 1.02,
  transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
}

// Pulse animation for loading states
export const pulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}
