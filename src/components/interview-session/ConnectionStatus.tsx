'use client'

import type { RealtimeConnectionState } from '@/types/interviewRealtime'

const STATE_CONFIG: Record<
  RealtimeConnectionState,
  { color: string; label: string }
> = {
  idle: { color: 'var(--text-tertiary)', label: 'Idle' },
  'requesting-mic': { color: 'var(--warning)', label: 'Requesting mic...' },
  'mic-check': { color: 'var(--warning)', label: 'Mic check' },
  connecting: { color: 'var(--warning)', label: 'Connecting...' },
  connected: { color: 'var(--success)', label: 'Connected' },
  reconnecting: { color: 'var(--warning)', label: 'Reconnecting...' },
  disconnected: { color: 'var(--text-tertiary)', label: 'Disconnected' },
  error: { color: 'var(--error)', label: 'Error' },
}

interface ConnectionStatusProps {
  state: RealtimeConnectionState
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const config = STATE_CONFIG[state]

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color }}
      />
      <span className="text-xs" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  )
}
