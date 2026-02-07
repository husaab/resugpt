'use client'

import { useCallback } from 'react'

const STORAGE_KEY = 'resugpt_qa_form_draft'

export interface StoredQAFormState {
  resumeText: string | null
  pdfFileName: string | null
  questions: Array<{
    question: string
    wordLimit?: number
  }>
  timestamp: number
}

export function useApplicationQAFormPersistence() {
  const saveFormData = useCallback((data: Omit<StoredQAFormState, 'timestamp'>) => {
    try {
      const storageData: StoredQAFormState = {
        ...data,
        timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
    } catch (error) {
      // localStorage may be unavailable (Safari private mode, quota exceeded)
      console.error('Failed to save Q&A form data to localStorage:', error)
    }
  }, [])

  const getFormData = useCallback((): StoredQAFormState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored) as StoredQAFormState

      // Check if data is older than 30 minutes (1800000 ms)
      const MAX_AGE_MS = 30 * 60 * 1000
      if (Date.now() - parsed.timestamp > MAX_AGE_MS) {
        // Data is stale, clear it
        clearFormData()
        return null
      }

      return parsed
    } catch (error) {
      console.error('Failed to retrieve Q&A form data from localStorage:', error)
      return null
    }
  }, [])

  const clearFormData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear Q&A form data from localStorage:', error)
    }
  }, [])

  return {
    saveFormData,
    getFormData,
    clearFormData,
  }
}
