'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClockIcon,
  ExclamationTriangleIcon,
  ForwardIcon,
} from '@heroicons/react/24/outline'

export type TimePressureAlertLevel = 'info' | 'warning' | 'critical'

export interface TimePressureAlert {
  id: number
  message: string
  level: TimePressureAlertLevel
}

interface TimePressureToastProps {
  alerts: TimePressureAlert[]
  onDismiss: (id: number) => void
}

const ICON_MAP = {
  info: ForwardIcon,
  warning: ClockIcon,
  critical: ExclamationTriangleIcon,
}

const STYLE_MAP = {
  info: {
    bg: 'bg-[var(--accent-color)]',
    text: 'text-white',
    duration: 3500,
  },
  warning: {
    bg: 'bg-[var(--warning)]',
    text: 'text-white',
    duration: 4000,
  },
  critical: {
    bg: 'bg-[var(--error)]',
    text: 'text-white',
    duration: 5000,
  },
}

function ToastBanner({ alert, onDismiss }: { alert: TimePressureAlert; onDismiss: () => void }) {
  const style = STYLE_MAP[alert.level]
  const Icon = ICON_MAP[alert.level]

  useEffect(() => {
    const timer = setTimeout(onDismiss, style.duration)
    return () => clearTimeout(timer)
  }, [onDismiss, style.duration])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`${style.bg} ${style.text} px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 max-w-sm pointer-events-auto`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${alert.level === 'critical' ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-medium">{alert.message}</span>
    </motion.div>
  )
}

function CenterOverlay({ alert, onDismiss }: { alert: TimePressureAlert; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-[var(--error)] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto"
      >
        <ExclamationTriangleIcon className="w-7 h-7 flex-shrink-0 animate-pulse" />
        <div>
          <p className="text-base font-bold">{alert.message}</p>
          <p className="text-sm opacity-80 mt-0.5">Wrap up your answer now</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function TimePressureToast({ alerts, onDismiss }: TimePressureToastProps) {
  const toastAlerts = alerts.filter((a) => a.level !== 'critical')
  const criticalAlert = alerts.find((a) => a.level === 'critical') ?? null

  return (
    <>
      {/* Toast banners — top center, below navbar */}
      <div className="absolute top-16 left-0 right-0 z-40 flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toastAlerts.map((alert) => (
            <ToastBanner
              key={alert.id}
              alert={alert}
              onDismiss={() => onDismiss(alert.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Critical center overlay */}
      <AnimatePresence>
        {criticalAlert && (
          <CenterOverlay
            key={criticalAlert.id}
            alert={criticalAlert}
            onDismiss={() => onDismiss(criticalAlert.id)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
