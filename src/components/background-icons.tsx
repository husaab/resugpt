'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './theme-provider'
import { 
  FaFileAlt, FaBriefcase, FaCheckCircle, FaHandshake, FaEnvelope,
  FaSuitcase
} from 'react-icons/fa'
import { 
  MdWork, MdSchool, MdBusiness
} from 'react-icons/md'
import { 
  HiDocumentText, HiAcademicCap, HiBriefcase
} from 'react-icons/hi2'

const icons = [
  // Core resume/job icons
  FaFileAlt, FaBriefcase, FaSuitcase, HiBriefcase,
  // Documents and education
  HiDocumentText,  HiAcademicCap, MdSchool,
 MdWork, MdBusiness, FaHandshake,
  // Success/achievement
  FaCheckCircle, 
  // Communication/contact
  FaEnvelope,
  // Skills/growth

]

// Pre-defined positions to avoid hydration mismatch  
// Reduced icons, spread out more
// Rotations: -45° to +45° (left tilt to right tilt, never upside down)
const iconPositions = [
  { top: 15, left: 10, size: 36, rotation: -25, opacity: 0.06 },
  { top: 20, left: 85, size: 32, rotation: 30, opacity: 0.04 },
  { top: 35, left: 25, size: 28, rotation: -15, opacity: 0.05 },
  { top: 45, left: 70, size: 40, rotation: 20, opacity: 0.03 },
  { top: 60, left: 15, size: 34, rotation: -35, opacity: 0.07 },
  { top: 65, left: 90, size: 30, rotation: 25, opacity: 0.04 },
  { top: 80, left: 40, size: 38, rotation: -10, opacity: 0.05 },
  { top: 45, left: 85, size: 38, rotation: -10, opacity: 0.05 },
  { top: 50, left: 5, size: 42, rotation: -40, opacity: 0.03 },
  { top: 75, left: 75, size: 32, rotation: 35, opacity: 0.08 },
  { top: 10, left: 45, size: 28, rotation: 0, opacity: 0.04 },
  { top: 85, left: 20, size: 36, rotation: -20, opacity: 0.05 },
  { top: 40, left: 95, size: 30, rotation: 40, opacity: 0.03 },
  { top: 70, left: 60, size: 34, rotation: -5, opacity: 0.07 },
  { top: 30, left: 35, size: 24, rotation: 45, opacity: 0.06 }
]

export function BackgroundIcons() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Use blue color in dark mode, accent color in light mode
  const iconColor = resolvedTheme === 'dark' ? 'white' : 'var(--accent-color)'

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {iconPositions.map((position, index) => {
        const Icon = icons[index % icons.length]
        return (
          <div
            key={index}
            className="absolute transition-colors duration-300"
            style={{
              top: `${position.top}%`,
              left: `${position.left}%`,
              transform: `rotate(${position.rotation}deg)`,
              opacity: position.opacity,
              color: iconColor
            }}
          >
            <Icon size={position.size} />
          </div>
        )
      })}
    </div>
  )
}