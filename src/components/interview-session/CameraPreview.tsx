'use client'

import { useRef, useEffect } from 'react'
import { VideoCameraIcon, VideoCameraSlashIcon } from '@heroicons/react/24/outline'

interface CameraPreviewProps {
  cameraStreamRef: React.RefObject<MediaStream | null>
  isCameraOff: boolean
  onToggleCamera: () => void
  className?: string
}

export function CameraPreview({
  cameraStreamRef,
  isCameraOff,
  onToggleCamera,
  className = '',
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Attach stream to video — poll briefly since ref may be set after mount
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const attach = () => {
      const stream = cameraStreamRef.current
      if (stream && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream
      }
    }

    attach()
    // Re-check a few times in case the ref is set slightly after mount
    const id = setInterval(attach, 500)
    const timeout = setTimeout(() => clearInterval(id), 3000)

    return () => {
      clearInterval(id)
      clearTimeout(timeout)
      if (videoEl) videoEl.srcObject = null
    }
  }, [cameraStreamRef])

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-md ${className}`}
      style={{ width: 220, height: 165 }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Camera off / no stream overlay */}
      {(isCameraOff || !cameraStreamRef.current) && (
        <div className="absolute inset-0 bg-[var(--bg-elevated)] flex items-center justify-center">
          <VideoCameraSlashIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={onToggleCamera}
        className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
      >
        {isCameraOff ? (
          <VideoCameraSlashIcon className="w-3.5 h-3.5" />
        ) : (
          <VideoCameraIcon className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}
