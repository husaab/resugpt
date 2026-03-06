'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import type { CompanyListItem } from '@/types/interviewPrep'

export interface CompanyFormData {
  name: string
  industry: string
  description: string
  interviewStyle: string
  logoFile?: File
}

interface CompanyFormProps {
  initial?: Partial<CompanyListItem>
  onSubmit: (data: CompanyFormData) => void
  onCancel: () => void
  isSubmitting: boolean
  submitLabel: string
}

export function CompanyForm({ initial, onSubmit, onCancel, isSubmitting, submitLabel }: CompanyFormProps) {
  const [name, setName] = useState(initial?.name || '')
  const [industry, setIndustry] = useState(initial?.industry || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [interviewStyle, setInterviewStyle] = useState(initial?.interviewStyle || '')
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined)
  const [logoPreview, setLogoPreview] = useState<string | null>(initial?.logo || null)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      const url = URL.createObjectURL(file)
      blobUrlRef.current = url
      setLogoFile(file)
      setLogoPreview(url)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, industry, description, interviewStyle, logoFile })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          Company Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Google"
          className="w-full px-4 py-2.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          Company Logo
        </label>
        <div className="flex items-center gap-4">
          {logoPreview && (
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1.5" />
            </div>
          )}
          <label className="flex-1 cursor-pointer">
            <div className="w-full px-4 py-2.5 bg-[var(--bg-muted)] border border-dashed border-[var(--border-color)] rounded-xl text-center hover:bg-[var(--bg-elevated)] transition-colors">
              <span className="text-sm text-[var(--text-secondary)]">
                {logoFile ? logoFile.name : 'Click to upload logo (max 2MB)'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          Industry
        </label>
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Tech, Finance, Healthcare"
          className="w-full px-4 py-2.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the company..."
          rows={3}
          className="w-full px-4 py-2.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          Interview Style
        </label>
        <textarea
          value={interviewStyle}
          onChange={(e) => setInterviewStyle(e.target.value)}
          placeholder="e.g. Google values structured problem-solving..."
          rows={3}
          className="w-full px-4 py-2.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 resize-none"
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
