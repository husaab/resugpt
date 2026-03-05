'use client'

import { useState } from 'react'
import type { CodingProblemFrontend } from '@/types/codingProblem'
import type { Exchange, CurrentSpeaker } from '@/types/interviewRealtime'
import { TranscriptPanel } from './TranscriptPanel'
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'

interface ProblemStatementPanelProps {
  problem: CodingProblemFrontend
  exchanges: Exchange[]
  aiPartialTranscript: string
  currentSpeaker: CurrentSpeaker
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  hard: 'bg-red-500/15 text-red-400 border-red-500/30',
}

type Tab = 'problem' | 'chat'

export function ProblemStatementPanel({
  problem,
  exchanges,
  aiPartialTranscript,
  currentSpeaker,
}: ProblemStatementPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('problem')

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
        <button
          onClick={() => setActiveTab('problem')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'problem'
              ? 'text-[var(--accent-color)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <BookOpenIcon className="w-4 h-4" />
          Problem
          {activeTab === 'problem' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-color)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'chat'
              ? 'text-[var(--accent-color)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
          Chat
          {exchanges.length > 0 && activeTab !== 'chat' && (
            <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" />
          )}
          {activeTab === 'chat' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-color)]" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'problem' ? (
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Title + Difficulty */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
              {problem.title}
            </h2>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize flex-shrink-0 ${
                DIFFICULTY_STYLES[problem.difficulty] || ''
              }`}
            >
              {problem.difficulty}
            </span>
          </div>

          {/* Tags */}
          {problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-[var(--bg-muted)] text-[var(--text-tertiary)] rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Statement (rendered as text with basic markdown-like formatting) */}
          <div className="prose-sm mb-6">
            {problem.statement.split('\n').map((line, i) => {
              if (!line.trim()) return <br key={i} />
              // Code blocks
              if (line.trim().startsWith('```')) return null
              // Inline code
              const rendered = line.replace(
                /`([^`]+)`/g,
                '<code class="px-1.5 py-0.5 bg-[var(--bg-muted)] text-[var(--accent-color)] text-xs rounded font-mono">$1</code>'
              )
              // Bold
              const withBold = rendered.replace(
                /\*\*([^*]+)\*\*/g,
                '<strong class="font-semibold text-[var(--text-primary)]">$1</strong>'
              )
              return (
                <p
                  key={i}
                  className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2"
                  dangerouslySetInnerHTML={{ __html: withBold }}
                />
              )
            })}
          </div>

          {/* Examples */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Examples</h3>
            {problem.examples.map((ex, i) => (
              <div
                key={i}
                className="mb-3 p-3 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)]"
              >
                <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1.5">
                  Example {i + 1}
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-mono text-[var(--text-secondary)]">
                    <span className="text-[var(--text-tertiary)]">Input: </span>
                    {ex.input}
                  </p>
                  <p className="text-sm font-mono text-[var(--text-secondary)]">
                    <span className="text-[var(--text-tertiary)]">Output: </span>
                    {ex.output}
                  </p>
                  {ex.explanation && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5 italic">
                      {ex.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Constraints */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Constraints</h3>
            <ul className="space-y-1">
              {problem.constraints.map((c, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                >
                  <span className="text-[var(--text-tertiary)] mt-0.5 flex-shrink-0">&bull;</span>
                  <span className="font-mono text-xs">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <TranscriptPanel
          exchanges={exchanges}
          aiPartialTranscript={aiPartialTranscript}
          currentSpeaker={currentSpeaker}
        />
      )}
    </div>
  )
}
