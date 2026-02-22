'use client'

import { Button } from '@/components/ui/button'
import {
  MicrophoneIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface MicCheckPanelProps {
  hasMicPermission: boolean
  audioLevel: number
  error: string | null
  isConnecting: boolean
  onRequestMic: () => void
  onStartInterview: () => void
}

export function MicCheckPanel({
  hasMicPermission,
  audioLevel,
  error,
  isConnecting,
  onRequestMic,
  onStartInterview,
}: MicCheckPanelProps) {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-8">
        {/* Mic icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
          <MicrophoneIcon className="w-8 h-8 text-[var(--accent-color)]" />
        </div>

        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Test Your Microphone
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {hasMicPermission
            ? 'Speak to test your microphone. You should see the level bar respond.'
            : 'We need access to your microphone for the voice interview.'}
        </p>

        {/* Audio level visualizer */}
        {hasMicPermission && (
          <div className="mb-6">
            <div className="h-3 bg-[var(--bg-muted)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${Math.max(2, audioLevel * 100)}%`,
                  backgroundColor:
                    audioLevel > 0.3
                      ? 'var(--success)'
                      : audioLevel > 0.1
                        ? 'var(--warning)'
                        : 'var(--text-tertiary)',
                }}
              />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              {audioLevel > 0.1 ? 'Mic working!' : 'Speak to test...'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-[var(--error-light)] rounded-lg flex items-start gap-2 text-left">
            <ExclamationTriangleIcon className="w-4 h-4 text-[var(--error)] mt-0.5 shrink-0" />
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {/* Actions */}
        {!hasMicPermission ? (
          <Button variant="primary" size="lg" onClick={onRequestMic} className="w-full">
            <MicrophoneIcon className="w-5 h-5" />
            Allow Microphone
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={onStartInterview}
            isLoading={isConnecting}
            className="w-full"
          >
            Start Interview
          </Button>
        )}
      </div>
    </div>
  )
}
