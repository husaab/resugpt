import type { AnalysisStatus } from '@/types/interviewAnalysis'

interface AnalysisPendingBannerProps {
  status: AnalysisStatus
}

export function AnalysisPendingBanner({ status }: AnalysisPendingBannerProps) {
  if (status === 'completed') return null

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--error-light)] border border-[var(--error)]/20">
        <div className="w-2 h-2 rounded-full bg-[var(--error)]" />
        <p className="text-sm text-[var(--text-secondary)]">
          AI analysis could not be completed for this session.
        </p>
      </div>
    )
  }

  // pending or processing
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[var(--accent-light)] border border-[var(--accent-color)]/20">
      <div className="w-4 h-4 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[var(--text-secondary)]">
        {status === 'processing'
          ? 'AI is analyzing your interview moments...'
          : 'Analysis queued — will begin shortly...'}
      </p>
    </div>
  )
}
