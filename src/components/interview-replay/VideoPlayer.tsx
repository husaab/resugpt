'use client'

import { useEffect, forwardRef } from 'react'

interface VideoPlayerProps {
  videoUrl: string | null
  className?: string
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer({ videoUrl, className = '' }, ref) {

    useEffect(() => {
      if (ref && 'current' in ref && ref.current && videoUrl) {
        ref.current.src = videoUrl
        ref.current.load()
      }
    }, [videoUrl, ref])

    if (!videoUrl) return null

    return (
      <div className={`relative overflow-hidden rounded-xl border border-[var(--border-color)] bg-black ${className}`}>
        <video
          ref={ref}
          className="w-full aspect-video object-contain"
          playsInline
          preload="metadata"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>
    )
  }
)
