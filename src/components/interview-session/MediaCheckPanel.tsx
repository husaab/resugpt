'use client'

import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface MediaCheckPanelProps {
  // Mic
  hasMicPermission: boolean
  audioLevel: number
  micError: string | null
  onRequestMic: () => void
  // Camera
  hasCameraPermission: boolean
  cameraStreamRef: React.RefObject<MediaStream | null>
  cameraEnabled: boolean
  cameraError: string | null
  onRequestCamera: () => void
  onToggleCameraEnabled: () => void
  // Screen
  hasScreenPermission: boolean
  screenEnabled: boolean
  screenError: string | null
  isScreenSupported: boolean
  onRequestScreen: () => void
  onToggleScreenEnabled: () => void
  // Flow
  isConnecting: boolean
  onStartInterview: () => void
}

export function MediaCheckPanel({
  hasMicPermission,
  audioLevel,
  micError,
  onRequestMic,
  hasCameraPermission,
  cameraStreamRef,
  cameraEnabled,
  cameraError,
  onRequestCamera,
  onToggleCameraEnabled,
  hasScreenPermission,
  screenEnabled,
  screenError,
  isScreenSupported,
  onRequestScreen,
  onToggleScreenEnabled,
  isConnecting,
  onStartInterview,
}: MediaCheckPanelProps) {
  const cameraPreviewRef = useRef<HTMLVideoElement>(null)

  // Attach camera stream to preview
  useEffect(() => {
    const videoEl = cameraPreviewRef.current
    if (!videoEl) return
    const stream = cameraStreamRef.current
    if (stream) {
      videoEl.srcObject = stream
    }
    return () => {
      if (videoEl) videoEl.srcObject = null
    }
  }, [cameraStreamRef, hasCameraPermission])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-8">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 text-center">
          Set Up Your Interview
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-8 text-center">
          Test your microphone and optionally enable camera and screen recording.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* ─── Microphone ─────────────────────────── */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-3 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
              <MicrophoneIcon className="w-6 h-6 text-[var(--accent-color)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Microphone</h3>

            {hasMicPermission ? (
              <>
                <div className="w-full h-2.5 bg-[var(--bg-muted)] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${Math.max(2, audioLevel * 100)}%`,
                      backgroundColor:
                        audioLevel > 0.3 ? 'var(--success)'
                          : audioLevel > 0.1 ? 'var(--warning)'
                            : 'var(--text-tertiary)',
                    }}
                  />
                </div>
                <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  {audioLevel > 0.1 ? 'Mic working!' : 'Speak to test...'}
                </span>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={onRequestMic} className="mt-2 w-full">
                Allow Mic
              </Button>
            )}

            {micError && (
              <div className="mt-2 p-2 bg-[var(--error-light)] rounded-lg flex items-start gap-1.5 text-left">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-[var(--error)] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--error)]">{micError}</p>
              </div>
            )}
          </div>

          {/* ─── Camera ─────────────────────────────── */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-3 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
              <VideoCameraIcon className="w-6 h-6 text-[var(--accent-color)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Camera</h3>

            {hasCameraPermission ? (
              <>
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-[var(--bg-muted)] mb-2 border border-[var(--border-color)]">
                  <video
                    ref={cameraPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cameraEnabled}
                    onChange={onToggleCameraEnabled}
                    className="rounded border-[var(--border-color)]"
                  />
                  Record camera
                </label>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={onRequestCamera} className="mt-2 w-full">
                Allow Camera
              </Button>
            )}

            {cameraError && (
              <div className="mt-2 p-2 bg-[var(--error-light)] rounded-lg flex items-start gap-1.5 text-left">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-[var(--error)] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--error)]">{cameraError}</p>
              </div>
            )}
          </div>

          {/* ─── Screen Recording ──────────────────── */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-3 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
              <ComputerDesktopIcon className="w-6 h-6 text-[var(--accent-color)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Screen</h3>

            {!isScreenSupported ? (
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                Not supported in this browser
              </p>
            ) : hasScreenPermission ? (
              <>
                <span className="flex items-center gap-1 text-xs text-[var(--success)] mb-2">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Tab sharing active
                </span>
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={screenEnabled}
                    onChange={onToggleScreenEnabled}
                    className="rounded border-[var(--border-color)]"
                  />
                  Record screen
                </label>
              </>
            ) : (
              <div className="mt-2 space-y-2 w-full">
                <Button variant="outline" size="sm" onClick={onRequestScreen} className="w-full">
                  Share Tab
                </Button>
                <p className="text-xs text-[var(--text-tertiary)]">Optional</p>
              </div>
            )}

            {screenError && (
              <div className="mt-2 p-2 bg-[var(--error-light)] rounded-lg flex items-start gap-1.5 text-left">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-[var(--error)] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--error)]">{screenError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Start button */}
        <Button
          variant="primary"
          size="lg"
          onClick={onStartInterview}
          isLoading={isConnecting}
          disabled={!hasMicPermission}
          className="w-full"
        >
          Start Interview
        </Button>

        {!hasMicPermission && (
          <p className="text-xs text-[var(--text-tertiary)] text-center mt-3">
            Microphone access is required to start the interview
          </p>
        )}
      </div>
    </div>
  )
}
