# Interview Prep Feature — Design Document

**Date:** 2026-02-18
**Status:** Approved
**Author:** Hussein Saab + Claude
**Complexity:** 8/10
**Estimated Timeline:** 4-5 weeks

---

## Overview

A voice-based AI mock interview simulator. Users select a company and role, then go through a realistic multi-round interview process with an AI interviewer that speaks and listens. The system scores each round and provides a hire/no-hire recommendation.

### Core Value Proposition

- Curated, real interview data (manually sourced from Glassdoor, Blind, LeetCode)
- Voice-based interaction (AI speaks, user speaks via microphone)
- Multi-round simulation matching real company processes
- Detailed per-round scoring with actionable feedback

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Interaction mode | Voice-based (AI speaks + user speaks via mic) | Most immersive, differentiator |
| AI presentation | Voice + text overlay (captions) | Pragmatic, accessible, no video avatar needed |
| Data sourcing | Manually curated by founder | Authentic data, no legal scraping risk, community submissions later |
| Interview rounds (MVP) | Behavioral + Technical Coding | Highest value, system design in Phase 2 |
| Code editor | In-browser (Monaco Editor) | LeetCode-like experience |
| Scoring | Detailed per-round (1-10, strengths, weaknesses, tips) | Maximum user value |
| Monetization | Credit-based (fits existing model) | 2-3 credits per interview |
| Voice pipeline | OpenAI Realtime API | Simplifies architecture, ~500ms latency, cuts dev time |
| Timeline | MVP in 4-5 weeks | Aggressive but achievable with Realtime API |

---

## Data Model

### Companies Collection

```
{
  id: string
  name: string                    // "Google", "Meta", "Amazon"
  logo: string                    // URL to company logo
  industry: string                // "Tech", "Finance", etc.
  description: string
  interviewStyle: string          // "Google values structured problem-solving..."
  createdAt: Date
  updatedAt: Date
}
```

### Roles Collection

```
{
  id: string
  companyId: string               // FK to companies
  title: string                   // "Software Engineer", "Product Manager"
  level: string                   // "junior" | "mid" | "senior" | "staff"
  department: string              // "Engineering", "Product", "Design"
  description: string
  rounds: InterviewRound[]        // The interview process structure
  tips: string[]                  // Company/role-specific tips
  createdAt: Date
  updatedAt: Date
}
```

### InterviewRound (embedded in roles)

```
{
  roundNumber: number             // 1, 2, 3...
  type: "behavioral" | "technical" | "system_design" | "phone_screen" | "hiring_manager"
  title: string                   // "Phone Screen", "Technical Round 1"
  description: string             // "45-min coding interview focusing on algorithms"
  duration: number                // In minutes
  questions: InterviewQuestion[]  // Pool of questions for this round
}
```

### InterviewQuestion (embedded in rounds)

```
{
  id: string
  question: string
  category: string                // "arrays", "trees", "leadership"
  difficulty: "easy" | "medium" | "hard"
  followUps: string[]
  evaluationCriteria: string[]
  sampleAnswer: string
  source: "manual" | "user_submitted"
  submittedBy?: string
}
```

### InterviewSessions Collection (user data)

```
{
  id: string
  userId: string                  // Google ID
  companyId: string
  roleId: string
  status: "in_progress" | "completed" | "abandoned"
  currentRound: number
  rounds: SessionRound[]
  overallScore: number            // 1-10
  recommendation: "strong_hire" | "hire" | "lean_no_hire" | "no_hire"
  feedback: string
  startedAt: Date
  completedAt: Date
  creditsUsed: number
}
```

### SessionRound (embedded in interviewSessions)

```
{
  roundNumber: number
  type: string
  status: "pending" | "in_progress" | "completed"
  exchanges: Exchange[]
  score: number                   // 1-10
  strengths: string[]
  weaknesses: string[]
  feedback: string
  duration: number                // Seconds
  codeSubmission?: string
  codeLanguage?: string
}
```

### Exchange (conversation turns)

```
{
  role: "interviewer" | "candidate"
  content: string                 // Text transcription
  audioUrl?: string               // Optional stored audio
  timestamp: Date
}
```

---

## System Architecture

### Voice Pipeline (OpenAI Realtime API)

```
Browser (mic) → WebSocket → Your Backend → OpenAI Realtime API
                                         ↓
Browser (speaker) ← WebSocket ← Your Backend ← OpenAI Realtime API
```

The backend acts as a relay/proxy:
- Injects system prompts and question data
- Logs all transcriptions for scoring
- Manages round transitions via function calling
- Controls session state
- Hides API keys from client

### Why Backend Relay (Not Direct Client → OpenAI)

1. Control system prompts and question selection
2. Log transcriptions for post-round scoring
3. Manage round transitions
4. Users never see API key
5. Can add rate limiting and abuse prevention

### Latency Mitigation

- OpenAI Realtime API provides ~500ms end-to-end latency
- Show live transcription as user speaks
- "Interviewer is thinking..." animation during gaps
- Pre-load round data before transitions

---

## Page Structure & Routing

```
/interview-prep                         → Company Selection (grid of companies)
/interview-prep/[companyId]             → Role Selection (roles for that company)
/interview-prep/[companyId]/[roleId]    → Interview Briefing (round overview, mic test, start)
/interview-prep/session/[sessionId]     → Live Interview (voice + transcript + code editor)
/interview-prep/session/[sessionId]/results → Results & Scoring
/interview-prep/history                 → Past Interview Sessions
```

### Live Interview Page — Behavioral Layout

```
┌──────────────────────────────────────────────────────────┐
│  Round 1 of 3: Behavioral │ Timer: 32:15 │ [End]        │
├──────────────────────────────────────────────────────────┤
│  AI Interviewer Section (avatar + current question text) │
│  Live Transcript (scrolling conversation log)            │
│  Controls: 🎤 Speaking... │ Mute │ Skip Question         │
└──────────────────────────────────────────────────────────┘
```

### Live Interview Page — Technical Layout

```
┌─────────────────────────┬────────────────────────────────┐
│ Problem + AI Chat       │ Monaco Code Editor              │
│                         │ Language selector                │
│                         │ Run Code / Submit Solution       │
│                         │ Output / Test Results            │
├─────────────────────────┴────────────────────────────────┤
│ Collapsible Transcript                                    │
└──────────────────────────────────────────────────────────┘
```

### Results Page

- Overall score (1-10) + hire/no-hire recommendation
- Per-round breakdown: score, strengths, weaknesses, tips
- Retake / View Transcript / Back to Companies

---

## Backend API Endpoints

### Company & Role Data

```
GET    /interview-prep/companies              → List companies
GET    /interview-prep/companies/:id          → Company + roles
GET    /interview-prep/roles/:id              → Role + round details
```

### Interview Sessions

```
POST   /interview-prep/sessions               → Create session (deduct credits)
GET    /interview-prep/sessions               → User's past sessions
GET    /interview-prep/sessions/:id           → Session details
DELETE /interview-prep/sessions/:id           → Delete session
PATCH  /interview-prep/sessions/:id/abandon   → Abandon in-progress session
```

### Real-time Interview

```
WS     /interview-prep/sessions/:id/connect   → WebSocket for audio relay
```

### Code Execution

```
POST   /interview-prep/sessions/:id/run-code     → Execute in sandbox
POST   /interview-prep/sessions/:id/submit-code   → Submit final solution
```

### Scoring

```
POST   /interview-prep/sessions/:id/score-round   → Score a completed round
GET    /interview-prep/sessions/:id/results        → Final results
```

### Admin (Data Seeding)

```
POST   /interview-prep/admin/companies         → Create company
POST   /interview-prep/admin/roles             → Create role
PUT    /interview-prep/admin/roles/:id         → Update role
```

---

## AI Prompting Strategy

### Interviewer Prompt (Behavioral)

System prompt includes:
- Interviewer persona for the specific company
- Questions from the curated database
- Evaluation criteria
- Candidate's resume for personalized follow-ups
- Rules: stay in character, don't give feedback, don't help

### Interviewer Prompt (Technical)

System prompt includes:
- Problem statement from database
- Guide candidate through solving (think aloud)
- Hint system (if stuck > 2 min, give small hint)
- Ask about complexity after solution
- Function calls: `evaluate_code`, `end_round`

### Scoring Prompt (Post-Round, Separate LLM Call)

Input: full transcript, evaluation criteria, code/test results
Output: structured JSON with score, strengths, weaknesses, feedback, sub-scores

---

## Technology Additions

### Frontend

| Package | Purpose |
|---|---|
| `@monaco-editor/react` | Code editor for technical rounds |
| Browser-native APIs | MediaRecorder, Web Audio API for audio I/O |

### Backend

| Package | Purpose |
|---|---|
| `openai` Node SDK | Realtime API, scoring LLM calls |
| `ws` or `socket.io` | WebSocket server |
| Judge0 or Piston API | Sandboxed code execution |

---

## Cost Analysis

| Component | Cost per 45-min interview |
|---|---|
| OpenAI Realtime API (input) | ~$0.36 (at $0.06/min × ~6 min user speech) |
| OpenAI Realtime API (output) | ~$0.48 (at $0.24/min × ~2 min AI speech) |
| Scoring LLM calls | ~$0.10 |
| Code execution | ~$0.01 |
| **Total** | **~$0.95** |

**Recommendation:** Each interview costs 2-3 credits.

---

## Implementation Roadmap

### Week 1: Foundation

- Database schema + models
- Admin API endpoints for seeding data
- Seed 5-10 companies with real interview data
- Company selection + role selection pages
- Interview briefing page
- Navbar integration

### Week 2: Behavioral Interview (Text-First)

- Session creation flow
- Live interview page (text chat first)
- Interview engine: prompts, question selection, conversation flow
- Round state management
- Transcript display

### Week 3: Voice Integration

- OpenAI Realtime API integration
- WebSocket relay through backend
- Browser mic capture + audio streaming
- AI audio playback
- Mic permission handling + audio test
- Voice activity detection

### Week 4: Technical Rounds + Scoring

- Monaco Editor integration
- Code execution via Judge0/Piston
- Technical round AI prompts
- Scoring engine (post-round LLM calls)
- Results page with breakdown
- Final recommendation generation

### Week 5: Polish & Ship

- Interview history page
- Session reconnect/resume
- Credit deduction integration
- Error handling (mic failures, API failures, disconnects)
- Mobile responsive (behavioral rounds)
- Testing + bug fixes

---

## MVP Scope (What's In / What's Out)

### In (MVP)

- Company/role selection from curated database (5-10 companies)
- Behavioral rounds (voice-based)
- Technical coding rounds (Monaco editor)
- OpenAI Realtime API for voice
- Per-round scoring with detailed feedback
- Hire/no-hire recommendation
- Interview history list
- Credit-based monetization

### Out (Phase 2+)

- System design rounds
- User-submitted interview experiences
- Resume-aware personalized questions
- Progress analytics/charts
- Difficulty level selection
- Mobile support for technical rounds
- Peer comparison scores
- Warm-up/quick practice mode
- Share results socially

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| OpenAI Realtime API latency | Test early; fallback to DIY pipeline (Whisper + TTS) |
| Browser audio compatibility | Test Chrome/Firefox/Safari; graceful text fallback |
| Cost per interview too high | Monitor usage; adjust credit pricing; set round time limits |
| WebSocket disconnects | Session persistence; auto-reconnect; resume capability |
| Scoring inconsistency | Structured scoring prompts; calibration testing; score normalization |
