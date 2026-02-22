'use client'

import { useEffect, useRef } from 'react'
import { MicrophoneIcon } from '@heroicons/react/24/outline'
import type { Exchange, CurrentSpeaker } from '@/types/interviewRealtime'

interface TranscriptPanelProps {
  exchanges: Exchange[]
  aiPartialTranscript: string
  currentSpeaker: CurrentSpeaker
}

export function TranscriptPanel({
  exchanges,
  aiPartialTranscript,
  currentSpeaker,
}: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [exchanges, aiPartialTranscript, currentSpeaker])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {exchanges.length === 0 && !aiPartialTranscript && currentSpeaker !== 'candidate' && (
          <p className="text-center text-sm text-[var(--text-tertiary)] py-12">
            Interview will begin shortly...
          </p>
        )}

        {exchanges.map((ex, i) => (
          <div
            key={i}
            className={`flex ${ex.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                ex.role === 'candidate'
                  ? 'bg-[var(--accent-color)] text-white rounded-br-md'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-md'
              }`}
            >
              <p className={`text-xs font-medium mb-1 ${
                ex.role === 'candidate' ? 'text-white/70' : 'text-[var(--accent-color)]'
              }`}>
                {ex.role === 'candidate' ? 'You' : 'Interviewer'}
              </p>
              <p className="text-sm leading-relaxed">{ex.content}</p>
            </div>
          </div>
        ))}

        {/* User speaking — live indicator bubble in the conversation flow */}
        {currentSpeaker === 'candidate' && !aiPartialTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-3 bg-[var(--accent-color)] text-white">
              <p className="text-xs font-medium text-white/70 mb-1">You</p>
              <div className="flex items-center gap-2">
                <MicrophoneIcon className="w-4 h-4 text-white/80 animate-pulse" />
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-white/60 rounded-full animate-[soundbar_0.6s_ease-in-out_infinite]" />
                  <span className="w-1 h-5 bg-white/70 rounded-full animate-[soundbar_0.6s_ease-in-out_infinite_0.15s]" />
                  <span className="w-1 h-3.5 bg-white/60 rounded-full animate-[soundbar_0.6s_ease-in-out_infinite_0.3s]" />
                  <span className="w-1 h-4.5 bg-white/70 rounded-full animate-[soundbar_0.6s_ease-in-out_infinite_0.1s]" />
                  <span className="w-1 h-3 bg-white/60 rounded-full animate-[soundbar_0.6s_ease-in-out_infinite_0.25s]" />
                </div>
                <span className="text-sm text-white/80">Speaking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Streaming AI partial text */}
        {aiPartialTranscript && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-color)]">
              <p className="text-xs font-medium text-[var(--accent-color)] mb-1">
                Interviewer
              </p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                {aiPartialTranscript}
                <span className="inline-block w-1.5 h-4 bg-[var(--accent-color)] ml-0.5 animate-pulse rounded-sm" />
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
