'use client'

import { useCallback } from 'react'
import { CoverLetterTone } from '@/types/coverLetter'

const STORAGE_KEY = 'resugpt_cover_letter_form_draft'

export interface StoredCoverLetterFormState {
  pdf: string | null
  pdfFileName: string | null
  jobTitle: string
  jobDescription: string
  companyName: string
  location: string
  tone: CoverLetterTone
  timestamp: number
}

export function useCoverLetterFormPersistence() {
  const saveFormData = useCallback((data: Omit<StoredCoverLetterFormState, 'timestamp'>) => {
    try {
      const storageData: StoredCoverLetterFormState = {
        ...data,
        timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
    } catch (error) {
      console.error('Failed to save form data to localStorage:', error)
    }
  }, [])

  const getFormData = useCallback((): StoredCoverLetterFormState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored) as StoredCoverLetterFormState

      // Check if data is older than 30 minutes (1800000 ms)
      const MAX_AGE_MS = 30 * 60 * 1000
      if (Date.now() - parsed.timestamp > MAX_AGE_MS) {
        clearFormData()
        return null
      }

      return parsed
    } catch (error) {
      console.error('Failed to retrieve form data from localStorage:', error)
      return null
    }
  }, [])

  const clearFormData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear form data from localStorage:', error)
    }
  }, [])

  return {
    saveFormData,
    getFormData,
    clearFormData,
  }
}
