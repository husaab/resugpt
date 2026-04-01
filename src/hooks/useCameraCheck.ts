'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { UseCameraCheckReturn } from '@/types/interviewRealtime'

export function useCameraCheck(): UseCameraCheckReturn {
  const [hasCameraPermission, setHasCameraPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)

  const cameraStreamRef = useRef<MediaStream | null>(null)

  const requestCamera = useCallback(async () => {
    try {
      setIsRequesting(true)
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      })
      cameraStreamRef.current = stream
      setHasCameraPermission(true)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Camera access was denied. Please allow camera access in your browser settings and reload.')
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.')
      } else {
        setError('Failed to access camera. Please check your device settings.')
      }
    } finally {
      setIsRequesting(false)
    }
  }, [])

  const stopCameraCheck = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop())
      cameraStreamRef.current = null
    }
    setHasCameraPermission(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return { hasCameraPermission, cameraStreamRef, error, isRequesting, requestCamera, stopCameraCheck }
}
