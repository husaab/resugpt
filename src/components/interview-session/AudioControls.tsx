'use client'

import {
  MicrophoneIcon,
} from '@heroicons/react/24/outline'
import { ConnectionStatus } from './ConnectionStatus'
import type { RealtimeConnectionState, CurrentSpeaker } from '@/types/interviewRealtime'

interface AudioControlsProps {
  isMuted: boolean
  connectionState: RealtimeConnectionState
  currentSpeaker: CurrentSpeaker
  onToggleMute: () => void
}

export function AudioControls({
  isMuted,
  connectionState,
  currentSpeaker,
  onToggleMute,
}: AudioControlsProps) {
  return (
    <div className="bg-[var(--bg-elevated)] border-t border-[var(--border-color)] px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Connection status */}
        <ConnectionStatus state={connectionState} />

        {/* Center: speaking indicator */}
        <div className="flex items-center gap-2">
          {currentSpeaker === 'candidate' && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--accent-color)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" />
              Speaking
            </span>
          )}
          {currentSpeaker === 'interviewer' && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--success)]">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              AI responding
            </span>
          )}
        </div>

        {/* Mute button */}
        <button
          onClick={onToggleMute}
          className={`relative p-2.5 rounded-full transition-colors ${
            isMuted
              ? 'bg-[var(--error)] text-white'
              : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          <MicrophoneIcon className="w-5 h-5" />
          {isMuted && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="block w-7 h-0.5 bg-current rotate-45 rounded" />
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
