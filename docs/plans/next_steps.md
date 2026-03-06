Remaining Week 1 (Foundation)                                                                                                                              
                                                                                                                                                           
  1. Seed data — Manually add 5-10 real companies with interview data (Google, Meta, Amazon, etc.) into the DB                                               
  2. Interview Briefing Page (/interview-prep/[companyId]/[roleId]) — Shows the selected role's round overview (round cards with type/duration/description), 
  a mic permission test, and a "Start Interview" button. This is the pre-interview screen.

  Week 2 (Behavioral Interview - Text First)

  3. Session backend — Build the interview session endpoints (POST create session with credit deduction, GET session details, PATCH abandon, DELETE)
  4. Live Interview Page (/interview-prep/session/[sessionId]) — Text chat first: AI asks questions, user types responses, transcript scrolls, round
  transitions, timer
  5. Interview engine — Backend prompting logic: system prompts per company persona, question selection from the pool, conversation flow management, round
  state machine

  Week 3 (Voice Integration)

  6. OpenAI Realtime API — WebSocket relay through backend, browser mic capture, AI audio playback, voice activity detection

  Week 4 (Technical Rounds + Scoring)

  7. Monaco Editor integration for coding rounds
  8. Code execution sandbox (Judge0/Piston)
  9. Scoring engine — Post-round LLM scoring calls, results page with per-round breakdown, hire/no-hire recommendation

  Week 5 (Polish)

  10. Interview history page (/interview-prep/history)
  11. Credit deduction integration, error handling, session reconnect, mobile responsiveness

  The natural next step after the role page is the Interview Briefing Page — it's the last pure frontend/data page before you need to build the real-time
  interview engine.



  Feb 22, 2026


  Step 2: Create the interview_sessions table

  Add the PostgreSQL schema matching the InterviewSessions / SessionRound / Exchange data model from your design doc.
   This is the backbone everything else depends on.

  Step 3: Build session API endpoints

  Following your existing pattern (routes → controller → queries):
  - POST /sessions — create session, deduct credits
  - GET /sessions — user's past sessions
  - GET /sessions/:id — session details
  - PATCH /sessions/:id/abandon — abandon session

  Step 4: Build the Interview Briefing page

  /interview-prep/[companyId]/[roleId] — shows round overview, mic test placeholder, "Start Interview" button that
  creates a session.

  Step 5: Build the Live Interview page (text-only MVP)

  /interview-prep/session/[sessionId] — text-based chat interface with the AI interviewer. Voice comes in Week 3.

  Step 6: Interview engine + scoring

  Backend logic for AI prompting (behavioral first), question selection, and post-round scoring.

  ---
  Do you want me to start with Step 2 (the interview_sessions database schema + session endpoints), or would you
  prefer to tackle things in a different order? Also — should I check on that submissions route file first?