Interview Replay & Analysis System — Implementation Plan

 Context

 After an interview completes, users currently see only round-level scores with generic strengths/weaknesses. There's no way to
 revisit the conversation, hear how they actually sounded, understand which specific moments were strong or weak, see how code
 evolved during coding rounds, or track improvement across sessions. This plan builds a comprehensive replay & analysis system with
 full audio playback and moment-by-moment AI coaching.

 Design decisions (confirmed with user):
 - Replay UX: Both — results page as summary + dedicated /replay page for immersive timeline
 - Analysis trigger: Automatic on completion (fire-and-forget, non-blocking)
 - Code snapshots: Yes — capture timestamped snapshots during coding rounds
 - Progress tracking: Both role-specific trends AND cross-session skill category tracking
 - Audio recording: Yes — record both user mic and AI voice via MediaRecorder; animated text fallback for old sessions
 - Audio storage: Supabase Storage buckets

 Recent changes already completed (do not redo)

 These changes were made in a parallel terminal and affect file contents/line numbers:

 1. Transcription is enabled — audio.input.transcription: { model: 'gpt-4o-transcribe' } is already configured in
 interviewRealtime.controller.js:91-93. Candidate transcripts now work.
 2. useRealtimeInterview.ts has changed — Added userPartialTranscript state, userPartialRef, a new
 conversation.item.input_audio_transcription.delta handler (line 141-145), and debug console.log statements. Line numbers in this
 plan reference the CURRENT file state.
 3. interviewRealtime.ts types have changed — Added TranscriptionDeltaEvent (line 73-78) and userPartialTranscript: string to
 UseRealtimeInterviewReturn (line 167). MediaRecorder type additions must merge with these.
 4. interviewRealtime.controller.js has changed — Voice is now marin (env-configurable), turn detection is semantic_vad (not
 server_vad), transcription is configured. The analysis trigger insertion point in the last-round branch is at lines 280-291.
 5. TranscriptPanel and ProblemStatementPanel interfaces now accept userPartialTranscript?: string. The replay's
 TranscriptReplayPanel should be aware of this prop but doesn't need it (replay is static text).

 Cleanup to do during implementation

 - Remove debug console.logs — When Phase 2.3 modifies useRealtimeInterview.ts, remove the 5 console.log('[Realtime]...') statements
 (lines 71, 77, 87, 110, 114, 120, 235).

 ---
 Architecture Overview

 DURING INTERVIEW:
   User mic stream ──► MediaRecorder ──► user audio blob
   AI remote stream ──► MediaRecorder ──► interviewer audio blob
   Code editor ──► useCodeObserver ──► snapshot queue (in-memory)

 AT ROUND END:
   ├─► endRoundApi() ← scores round (existing)
   ├─► uploadAudio(userBlob, aiBlob) → Supabase Storage (non-critical)
   └─► saveCodeSnapshots(queue) → code_snapshots table (non-critical)

 AT SESSION COMPLETION (last round):
   ├─► res.json(results) ← user gets results immediately
   └─► runAnalysis(sessionId) ← fire-and-forget async pipeline
         ├─► segment exchanges into Q&A moments
         ├─► attach code snapshots to moments
         ├─► GPT-4o moment-level analysis (one call per session, ~$0.013)
         └─► store in interview_analyses table

 REPLAY PAGE:
   ├─► GET /interview-sessions/:id              (existing — full session + audio URLs)
   ├─► GET /interview-sessions/:id/analysis     (new — moments + skill scores)
   ├─► GET /interview-sessions/:id/code-snapshots (new — code evolution)
   └─► Audio playback synced to transcript timeline

 Key architectural choices:
 - Separate interview_analyses table — avoids deepening the already 10-level jsonb_set nesting
 - Q&A pair segmentation — consecutive interviewer→candidate exchange pairs form one "moment" (3–8 per round)
 - Single GPT-4o call per session — all moments batched in one prompt
 - Two-track audio recording — user + AI recorded as separate WebM blobs via MediaRecorder on existing MediaStream objects from the
 WebRTC flow
 - Graceful degradation — old sessions (no audio) get animated text replay; new sessions get full audio
 - Pure SVG charts — no chart library dependency

 ---
 Phase 1: Database & Backend Foundation

 1.1 Create Database Tables

 Run in Supabase SQL editor:

 -- Moment-level analysis results (one row per completed session)
 CREATE TABLE interview_analyses (
   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   session_id      UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
   user_id         TEXT NOT NULL,
   status          TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
   error_message   TEXT,
   started_at      TIMESTAMPTZ,
   completed_at    TIMESTAMPTZ,
   moments         JSONB NOT NULL DEFAULT '[]'::jsonb,
   skill_scores    JSONB NOT NULL DEFAULT '{}'::jsonb,
   top_improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
   created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   CONSTRAINT interview_analyses_session_id_unique UNIQUE (session_id)
 );

 CREATE INDEX idx_interview_analyses_user_id ON interview_analyses(user_id);
 CREATE INDEX idx_interview_analyses_status ON interview_analyses(status)
   WHERE status IN ('pending', 'processing');

 -- Timestamped code snapshots captured during coding rounds
 CREATE TABLE code_snapshots (
   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   session_id      UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
   user_id         TEXT NOT NULL,
   round_number    INTEGER NOT NULL,
   code            TEXT NOT NULL,
   language        TEXT NOT NULL,
   snapshot_index  INTEGER NOT NULL,
   captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   relative_seconds INTEGER
 );

 CREATE INDEX idx_code_snapshots_session_round
   ON code_snapshots(session_id, round_number, snapshot_index);

 -- Audio recording URLs per round (separate table to avoid JSONB nesting)
 CREATE TABLE round_audio (
   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   session_id      UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
   user_id         TEXT NOT NULL,
   round_number    INTEGER NOT NULL,
   user_audio_url  TEXT,
   ai_audio_url    TEXT,
   created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   CONSTRAINT round_audio_session_round_unique UNIQUE (session_id, round_number)
 );

 CREATE INDEX idx_round_audio_session ON round_audio(session_id);

 Also create a Supabase Storage bucket:
 - Bucket name: interview-audio
 - Public: No (use signed URLs for playback)
 - File size limit: 20MB per file
 - Allowed MIME types: audio/webm, audio/ogg, audio/mp4

 Moment JSONB shape (each element in moments[]):
 {
   "roundNumber": 1,
   "momentIndex": 0,
   "skillCategory": "communication",
   "qualityScore": 7,
   "annotation": "Clear explanation of the approach",
   "improvementTip": "Quantify the impact — mention specific metrics",
   "isKeyMoment": false,
   "exchangeStartIndex": 0,
   "exchangeEndIndex": 1
 }

 Skill categories: communication, problem_solving, technical_depth, behavioral_examples, code_quality

 1.2 Create Backend Queries

 Create: resugpt-backend/queries/interviewAnalysis.queries.js

 Queries:
 - insertAnalysisRecord — INSERT with ON CONFLICT DO NOTHING (prevents duplicates)
 - setAnalysisProcessing — UPDATE status + started_at
 - completeAnalysis — UPDATE moments, skill_scores, top_improvements, status, completed_at
 - failAnalysis — UPDATE status='failed', error_message
 - getAnalysisBySessionId — SELECT by session_id with user_id ownership check (JOIN interview_sessions)
 - insertCodeSnapshots — bulk INSERT using unnest arrays
 - getCodeSnapshotsBySessionRound — SELECT ordered by snapshot_index
 - insertRoundAudio — INSERT or UPDATE audio URLs for a round
 - getRoundAudioBySession — SELECT all round_audio rows for a session
 - getProgressData — JOIN interview_sessions + interview_analyses, with optional role_id filter

 1.3 Create Analysis Service

 Create: resugpt-backend/services/interviewAnalysis.service.js

 Functions:

 segmentMoments(rounds) — Groups exchanges into Q&A pairs per round:
 - Walk exchanges; collect consecutive interviewer messages as the "question"
 - Collect consecutive candidate messages as the "response"
 - Skip empty candidate turns and [Code Submitted] synthetic exchanges
 - Returns [{ roundNumber, momentIndex, interviewerText, candidateText, exchangeStartIndex, exchangeEndIndex }]

 buildMomentAnalysisPrompt({ session, segmentedMoments, codeSnapshots }) — Follows the exact pattern of buildScoringPrompt in
 interviewPrompts.service.js (ref: services/interviewPrompts.service.js:159-226):
 - Single user message, expects JSON-only response
 - Includes session context (company, role, overall score)
 - Includes all round transcripts organized by moment
 - Attaches nearest code snapshot to coding moments
 - Scoring rubric: 9-10 exceptional, 7-8 strong, 5-6 adequate, 3-4 below par, 1-2 poor
 - Skill categories constrained to the 5 defined categories
 - Asks for isKeyMoment when quality delta from round avg ≥ 2 points

 parseMomentAnnotations(content) — Strips markdown fences, JSON.parse, validates array structure (same fence-stripping +
 structure-validation pattern as scoreRound in interviewScoring.service.js:66-85)

 aggregateSkillScores(annotations) — Groups by skillCategory, averages qualityScore

 selectTopImprovements(annotations, roundScores, limit=3) — Ranks moments where qualityScore is furthest below round's average score,
  takes top 3

 runAnalysis(sessionId, googleId) — Async orchestrator:
 1. INSERT analysis record (pending)
 2. UPDATE to processing
 3. SELECT full session data via existing getSessionWithRoleData query
 4. segmentMoments(rounds)
 5. SELECT code snapshots, attach nearest to each moment by timestamp
 6. buildMomentAnalysisPrompt(...) → GPT-4o call (model gpt-4o, temperature 0.3, max_tokens 3000)
 7. parseMomentAnnotations(response)
 8. aggregateSkillScores(annotations)
 9. selectTopImprovements(annotations, ...)
 10. UPDATE analysis to completed
 11. On ANY error → UPDATE to failed with error_message (double try/catch to protect the failure write)

 1.4 Create Audio Storage Service

 Create: resugpt-backend/services/audioStorage.service.js

 Uses Supabase Storage REST API (not the JS SDK — keep consistent with the existing raw pg pattern):
 - uploadAudioBlob(sessionId, roundNumber, role, buffer, mimeType) — PUT to
 {SUPABASE_URL}/storage/v1/object/interview-audio/{sessionId}/round-{N}-{role}.webm with Authorization: Bearer
 {SUPABASE_SERVICE_ROLE_KEY}
 - getSignedUrl(path, expiresIn=3600) — POST to Supabase Storage createSignedUrl endpoint
 - Env vars needed: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (may already exist for the DB connection)

 1.5 Create Analysis Controller

 Create: resugpt-backend/controllers/interviewAnalysis.controller.js

 Handlers (follow exact pattern of existing controllers — async (req, res), throw { status, message }, catch block at bottom):
 - getAnalysis(req, res) — GET /:id/analysis?googleId= — returns analysis data or { status: 'pending' }
 - saveCodeSnapshots(req, res) — POST /:id/code-snapshots — bulk insert snapshots
 - getCodeSnapshots(req, res) — GET /:id/code-snapshots?googleId=&roundNumber=
 - uploadRoundAudio(req, res) — POST /:id/upload-audio — accepts multipart/form-data with userAudio and aiAudio file fields +
 googleId + roundNumber. Uploads to Supabase Storage, stores URLs in round_audio table. Uses multer or express.raw for multipart
 parsing
 - getRoundAudio(req, res) — GET /:id/audio?googleId= — returns signed URLs for all rounds
 - getProgress(req, res) — GET /progress?googleId=&roleId= — aggregated skill trends

 1.6 Add Routes

 Modify: resugpt-backend/routes/interviewSession.routes.js

 const multer = require('multer')
 const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })
 const {
   getAnalysis, saveCodeSnapshots, getCodeSnapshots,
   uploadRoundAudio, getRoundAudio, getProgress
 } = require('../controllers/interviewAnalysis.controller')

 router.get('/progress', getProgress)  // BEFORE /:id routes
 router.get('/:id/analysis', getAnalysis)
 router.post('/:id/code-snapshots', saveCodeSnapshots)
 router.get('/:id/code-snapshots', getCodeSnapshots)
 router.post('/:id/upload-audio', upload.fields([
   { name: 'userAudio', maxCount: 1 },
   { name: 'aiAudio', maxCount: 1 }
 ]), uploadRoundAudio)
 router.get('/:id/audio', getRoundAudio)

 Install: npm install multer in the backend

 1.7 Trigger Analysis on Session Completion

 Modify: resugpt-backend/controllers/interviewRealtime.controller.js

 ▎ Note: This file has changed — voice is now marin (env-configurable), turn detection is semantic_vad, and transcription is
 configured. Read the CURRENT file before editing.

 In endRound, in the last-round branch (lines 280-291), before the return res.status(200).json(...):

 // Fire-and-forget async analysis — do NOT await
 const { runAnalysis } = require('../services/interviewAnalysis.service')
 runAnalysis(id, googleId).catch((err) => {
   logger.error(`Analysis failed for session ${id}:`, err)
 })

 Verification

 - Complete a test interview session end-to-end
 - Check interview_analyses table has a row with status='completed'
 - Check moments JSONB contains annotated Q&A pairs
 - Check skill_scores has aggregated values
 - Test audio upload endpoint with sample WebM files

 ---
 Phase 2: Audio Recording & Code Snapshot Capture

 2.1 Frontend Types

 Create: resugpt/src/types/interviewAnalysis.ts

 export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'
 export type SkillCategory = 'communication' | 'problem_solving' | 'technical_depth'
   | 'behavioral_examples' | 'code_quality'

 export interface MomentAnnotation {
   roundNumber: number
   momentIndex: number
   skillCategory: SkillCategory
   qualityScore: number
   annotation: string
   improvementTip: string
   isKeyMoment: boolean
   keyMomentReason?: string
   exchangeStartIndex: number
   exchangeEndIndex: number
 }

 export interface SkillScores { /* one optional number per SkillCategory */ }
 export interface TopImprovement { momentId: string; roundNumber: number; tip: string; skillCategory: SkillCategory }
 export interface InterviewAnalysis { id, sessionId, status, moments, skillScores, topImprovements, completedAt }
 export interface CodeSnapshot { id, roundNumber, snapshotIndex, code, language, capturedAt, relativeSeconds }
 export interface RoundAudioUrls { roundNumber: number; userAudioUrl: string | null; aiAudioUrl: string | null }
 export interface SessionSkillPoint { sessionId, completedAt, overallScore, roleTitle, companyName, skillScores }
 export interface ProgressData { sessions: SessionSkillPoint[]; skillTrends; roundTypeTrends }

 // API response wrappers
 export interface GetAnalysisResponse { success: boolean; data: InterviewAnalysis }
 export interface GetCodeSnapshotsResponse { success: boolean; data: CodeSnapshot[] }
 export interface SaveCodeSnapshotsResponse { success: boolean; message: string }
 export interface UploadAudioResponse { success: boolean; message: string }
 export interface GetRoundAudioResponse { success: boolean; data: RoundAudioUrls[] }
 export interface GetProgressResponse { success: boolean; data: ProgressData }

 2.2 Add Service Functions

 Modify: resugpt/src/services/interviewSessionService.ts

 Add 6 new functions (all follow existing apiClient<T> pattern):
 - getAnalysis(sessionId, googleId) — GET
 - saveCodeSnapshots(sessionId, googleId, roundNumber, snapshots) — POST
 - getCodeSnapshots(sessionId, googleId, roundNumber) — GET
 - uploadRoundAudio(sessionId, googleId, roundNumber, userAudioBlob, aiAudioBlob) — POST with FormData (not JSON — special case for
 blob upload)
 - getRoundAudio(sessionId, googleId) — GET, returns signed URLs
 - getProgress(googleId, roleId?) — GET

 The uploadRoundAudio function is the only one that doesn't use apiClient — it uses a raw fetch with FormData body:
 export const uploadRoundAudio = async (
   sessionId: string, googleId: string, roundNumber: number,
   userAudio: Blob | null, aiAudio: Blob | null
 ): Promise<UploadAudioResponse> => {
   const formData = new FormData()
   formData.append('googleId', googleId)
   formData.append('roundNumber', String(roundNumber))
   if (userAudio) formData.append('userAudio', userAudio, 'user-audio.webm')
   if (aiAudio) formData.append('aiAudio', aiAudio, 'ai-audio.webm')
   const res = await fetch(`${BASE_URL}/interview-sessions/${sessionId}/upload-audio`, {
     method: 'POST', body: formData
   })
   return res.json()
 }

 2.3 Add Audio Recording to useRealtimeInterview

 Modify: resugpt/src/hooks/useRealtimeInterview.ts

 ▎ IMPORTANT: Read the CURRENT file before editing. It now includes userPartialTranscript state (line 24), userPartialRef (line 36),
 a transcription.delta handler (lines 141-145), and debug console.log statements. Line numbers below reference the CURRENT file
 state.

 The hook has access to both audio streams:
 - User mic: localStreamRef.current (line 62-64, from getUserMedia)
 - AI voice: e.streams[0] from pc.ontrack (line 57-59, remote WebRTC stream)

 Changes:

 1. Remove debug console.logs — Remove all console.log('[Realtime]...') and console.error('[Realtime]...') statements at lines 71,
 77, 87, 110, 114, 120, 235.
 2. Add refs for MediaRecorders and chunk arrays (after userPartialRef at line 36):
 const userRecorderRef = useRef<MediaRecorder | null>(null)
 const aiRecorderRef = useRef<MediaRecorder | null>(null)
 const userChunksRef = useRef<Blob[]>([])
 const aiChunksRef = useRef<Blob[]>([])

 3. Start recording in connect() after streams are established:

 After localStreamRef.current = stream (line 63):
 // Start recording user audio
 try {
   const userRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
   userChunksRef.current = []
   userRecorder.ondataavailable = (e) => { if (e.data.size > 0) userChunksRef.current.push(e.data) }
   userRecorder.start(1000)  // 1-second chunks
   userRecorderRef.current = userRecorder
 } catch { /* MediaRecorder not supported — graceful fallback, no audio recording */ }

 In the pc.ontrack handler (line 57-59), after audioEl.srcObject = e.streams[0]:
 // Start recording AI audio
 try {
   const aiRecorder = new MediaRecorder(e.streams[0], { mimeType: 'audio/webm;codecs=opus' })
   aiChunksRef.current = []
   aiRecorder.ondataavailable = (ev) => { if (ev.data.size > 0) aiChunksRef.current.push(ev.data) }
   aiRecorder.start(1000)
   aiRecorderRef.current = aiRecorder
 } catch { /* graceful fallback */ }

 4. Add stopRecording() async method — called by the page BEFORE disconnect():
 const stopRecording = useCallback((): Promise<{ userAudio: Blob | null; aiAudio: Blob | null }> => {
   return new Promise((resolve) => {
     let pending = 0
     const tryResolve = () => {
       if (--pending <= 0) {
         resolve({
           userAudio: userChunksRef.current.length
             ? new Blob(userChunksRef.current, { type: 'audio/webm' }) : null,
           aiAudio: aiChunksRef.current.length
             ? new Blob(aiChunksRef.current, { type: 'audio/webm' }) : null,
         })
       }
     }

     if (userRecorderRef.current?.state === 'recording') {
       pending++
       userRecorderRef.current.onstop = tryResolve
       userRecorderRef.current.stop()
     }
     if (aiRecorderRef.current?.state === 'recording') {
       pending++
       aiRecorderRef.current.onstop = tryResolve
       aiRecorderRef.current.stop()
     }
     if (pending === 0) resolve({ userAudio: null, aiAudio: null })
   })
 }, [])

 5. Update disconnect() (currently lines 242-265) — also clear recorder refs:
 userRecorderRef.current = null
 aiRecorderRef.current = null
 userChunksRef.current = []
 aiChunksRef.current = []

 6. Update return object (currently lines 313-325) — add stopRecording
 7. Update cleanup effect (currently lines 303-311) — stop recorders on unmount

 Modify: resugpt/src/types/interviewRealtime.ts

 Add to UseRealtimeInterviewReturn (currently lines 161-173, which already includes userPartialTranscript):
 stopRecording: () => Promise<{ userAudio: Blob | null; aiAudio: Blob | null }>

 2.4 Capture Code Snapshots + Upload Audio in Session Page

 Modify: resugpt/src/app/interview-prep/session/[sessionId]/page.tsx

 1. Add snapshot queue ref alongside existing refs:
 const snapshotQueueRef = useRef<Array<{ code: string; language: string; capturedAt: string }>>([])

 2. Modify code snapshot callback to also queue for persistence:
 // In the existing handleCodeSnapshot / sendCodeContext callback:
 snapshotQueueRef.current.push({
   code: snapshot.code,
   language: snapshot.language,
   capturedAt: new Date().toISOString(),
 })

 3. Modify handleEndRound to stop recording + upload audio + save snapshots:
 // BEFORE realtime.disconnect():
 const audioBlobs = await realtime.stopRecording()
 realtime.disconnect()

 // After endRoundApi resolves successfully:
 // Upload audio (non-critical, fire-and-forget)
 if (audioBlobs.userAudio || audioBlobs.aiAudio) {
   uploadRoundAudio(sessionId, googleId, currentRoundNumber, audioBlobs.userAudio, audioBlobs.aiAudio)
     .catch(() => {}) // silent fail
 }
 // Save code snapshots (non-critical)
 if (snapshotQueueRef.current.length > 0) {
   const snapshots = [...snapshotQueueRef.current]
   snapshotQueueRef.current = []
   saveCodeSnapshots(sessionId, googleId, currentRoundNumber, snapshots)
     .catch(() => {})
 }

 4. Reset in handleNextRound: snapshotQueueRef.current = []

 Verification

 - Complete a coding round → check code_snapshots table has rows
 - Complete any round → check round_audio table has URLs
 - Download audio from Supabase Storage → plays back correctly
 - Complete an interview → interview_analyses table populated with moments
 - Test with MediaRecorder unsupported (mock) → graceful fallback, no crash

 ---
 Phase 3: Enhanced Results Page

 Modify: resugpt/src/app/interview-prep/session/[sessionId]/results/page.tsx

 1. Fetch analysis after session loads (non-blocking, separate analysis state):
 const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null)
 useEffect(() => {
   if (!session) return
   getAnalysis(sessionId, googleId).then(res => { if (res.success) setAnalysis(res.data) }).catch(() => {})
 }, [session])

 2. Poll if pending/processing — setInterval every 5s, cleanup on unmount or when completed
 3. Below the overall score card, add analysis preview section:
   - If completed: Show top 3 topImprovements as coaching tips with skill category Badge components and improvement text. Use
 bg-[var(--warning-light)] or similar warm background
   - If pending/processing: AnalysisPendingBanner with spinner
   - If failed: subtle note
 4. In the actions section, add "View Replay" button:
 <Link href={`/interview-prep/session/${sessionId}/replay`}>
   <Button variant="outline" size="md">
     <PlayIcon className="w-4 h-4" />
     View Replay & Analysis
   </Button>
 </Link>

 Create: resugpt/src/components/interview-replay/AnalysisPendingBanner.tsx

 Small component — shows spinner + "AI is analyzing your interview..." when processing, checkmark when done, error icon when failed.

 Verification

 - Open a completed session's results page
 - See analysis status banner, watch it resolve to completed
 - See top 3 improvement tips displayed inline
 - "View Replay & Analysis" button navigates correctly

 ---
 Phase 4: Replay Page (Main Feature)

 4.1 Replay Page

 Create: resugpt/src/app/interview-prep/session/[sessionId]/replay/page.tsx

 State management (all in page component, prop drilling 2 levels max):
 const [session, setSession] = useState<InterviewSession | null>(null)
 const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null)
 const [codeSnapshots, setCodeSnapshots] = useState<CodeSnapshot[]>([])
 const [roundAudio, setRoundAudio] = useState<RoundAudioUrls[]>([])
 const [activeRound, setActiveRound] = useState(1)
 const [currentTime, setCurrentTime] = useState(0)  // seconds from round start
 const [isPlaying, setIsPlaying] = useState(false)   // audio playback state

 Data loading:
 - getInterviewSession(sessionId, googleId) — existing endpoint
 - getAnalysis(sessionId, googleId) — with polling if pending
 - getCodeSnapshots(sessionId, googleId, activeRound) — on round change
 - getRoundAudio(sessionId, googleId) — on initial load

 Layout:
 Back link → results page
 Company/role header (company logo, role title, level badge)
 AnalysisPendingBanner (if analysis.status !== 'completed')
 RoundNavigation (tab row — round number, type badge, score circle)
 AudioPlaybackBar (play/pause, time display, volume — only if audio available)
 ReplayTimeline (full-width horizontal scrubber with moment markers)
 Main content (flex row):
   LEFT: TranscriptReplayPanel (w-2/5 for coding, full for behavioral)
   RIGHT: CodeSnapshotViewer (w-3/5, coding rounds only)

 Audio/text mode detection: Check if roundAudio has entries for the active round. If yes → audio replay mode (play audio, sync
 transcript). If no → animated text replay mode (step through exchanges using timestamps, typing animation).

 4.2 Audio Playback Bar

 Create: resugpt/src/components/interview-replay/AudioPlaybackBar.tsx

 Props: userAudioUrl, aiAudioUrl, currentTime, duration, isPlaying, onPlayPause, onSeek

 - Two hidden <audio> elements (one per track), synced via currentTime
 - Both play simultaneously — user hears the full conversation as it happened
 - Play/Pause button, current time display (MM:SS), volume slider
 - timeupdate event from the audio elements drives currentTime updates → timeline + transcript sync
 - When user seeks on the timeline, both audio elements have their .currentTime set
 - Fallback: if only one audio track exists, play just that one
 - If no audio at all, this component is hidden and the page uses animated text mode

 4.3 Timeline Component

 Create: resugpt/src/components/interview-replay/ReplayTimeline.tsx

 Props: exchanges, moments, currentTime, totalDuration, onSeek

 - Horizontal bar: background var(--bg-muted), fill var(--accent-color) up to currentTime/totalDuration
 - Exchange tick marks: thin vertical lines at relative timestamps (gray)
 - Key moment markers: colored diamonds using scoreColor(qualityScore) — green for strong, amber for adequate, red for weak
 - Click-to-seek: getBoundingClientRect() + pointer X → percentage × totalDuration → seconds
 - Draggable scrubber head via mousedown/mousemove/mouseup + touch events
 - Round duration labels at start/end

 Timestamp strategy: Relative time = (new Date(exchange.timestamp) - new Date(exchanges[0].timestamp)) / 1000. Fallback for old
 sessions without timestamps: distribute evenly across round.duration.

 4.4 Transcript Replay Panel

 Create: resugpt/src/components/interview-replay/TranscriptReplayPanel.tsx

 Props: exchanges, moments, currentTime, roundStartTimestamp, isAudioMode

 - Same bubble style as existing TranscriptPanel (src/components/interview-session/TranscriptPanel.tsx) — candidate right-aligned in
 --accent-color, interviewer left-aligned in --bg-muted
 - In audio mode: all exchanges visible, active exchange highlighted with border-l-3 border-[var(--accent-color)] + slight background
  tint. Auto-scrolls to active exchange as audio plays
 - In text mode (no audio): exchanges reveal progressively with typing animation, simulating the conversation pace from timestamps
 - Moment annotation cards appear inline below the candidate bubble at the corresponding exchangeEndIndex:
   - Skill category Badge (reuse CVA Badge with appropriate variant)
   - Quality score colored circle (reuse scoreColor — ≥7 green, ≥5 amber, <5 red)
   - annotation text (1 sentence)
   - improvementTip text (1-2 sentences, in bg-[var(--warning-light)] card)
   - Key moments get a star icon and keyMomentReason displayed
 - Clicking a moment in the timeline jumps to its position and scrolls this panel to it

 4.5 Code Snapshot Viewer

 Create: resugpt/src/components/interview-replay/CodeSnapshotViewer.tsx

 Props: snapshots, currentTime, language

 - Finds most recent snapshot where relativeSeconds <= currentTime
 - Read-only code display (reuse Monaco from @monaco-editor/react which is already installed, with readOnly: true option — same
 config as CodeEditorPanel but without editing)
 - Snapshot index/time label ("Snapshot 3 of 7 — 4:32")
 - Prev/Next navigation buttons to manually step through snapshots
 - Diff view option (toggle): show what changed from previous snapshot using Monaco diff editor
 - Placeholder if no snapshots exist for this round

 4.6 Round Navigation

 Create: resugpt/src/components/interview-replay/RoundNavigation.tsx

 Props: rounds, activeRound, onRoundChange, roundAudio

 - Tab row: each tab shows round number, type Badge (reuse ROUND_TYPE_VARIANT from RoleDetailsContent), score circle (reuse
 scoreColor)
 - Audio indicator icon on tabs that have audio recordings available
 - Active tab highlighted with accent underline (same pattern as ProblemStatementPanel tabs)
 - Clicking changes round → page resets currentTime to 0, loads new code snapshots

 4.7 Barrel Export

 Create: resugpt/src/components/interview-replay/index.ts

 Verification

 - Navigate to replay page for a completed session with audio
 - Audio plays back through both tracks in sync
 - Timeline scrubber navigates through exchanges, audio seeks correctly
 - Moment annotations display inline with correct categories and scores
 - Clicking a moment marker on timeline jumps to it in the transcript
 - Code snapshots animate through coding round progression
 - Round navigation switches between rounds, loads correct audio/snapshots
 - Navigate to replay for an OLD session (no audio) → text mode works with typing animation
 - Pause/resume audio → transcript position preserved

 ---
 Phase 5: Progress Dashboard

 5.1 Progress Page

 Create: resugpt/src/app/interview-prep/progress/page.tsx

 Loads getProgress(googleId) with optional role filter dropdown.

 Overall Score Trend — Pure SVG line chart (no chart library):
 - viewBox="0 0 400 120", <polyline> with points colored by scoreColor
 - X = session date, Y = overall score (0–10)
 - Hover dots with tooltip showing session details (company, role, date, score)
 - Grid lines at Y=5 and Y=7 (the threshold boundaries)

 Skill Category Breakdown — SVG grouped bar chart:
 - 5 categories per session, sessions grouped along X axis
 - Fixed color palette per category (e.g., communication=blue, problem_solving=purple, etc.)
 - Legend mapping colors to categories

 Role Filter — Dropdown to filter by specific company/role combination, or "All sessions"

 Round Type Trend Table — Standard table showing behavioral/technical/coding average scores per session. Same table styling as
 history page.

 5.2 History Page Link

 Modify: resugpt/src/app/interview-prep/history/page.tsx

 Add "Progress" button in the header area, linking to /interview-prep/progress.

 Verification

 - Navigate to progress page
 - See score trend chart with completed sessions plotted
 - See skill category bars for each session
 - Filter by role shows filtered data
 - With only 1 session → chart shows single point (no crash)
 - With 0 sessions → empty state message

 ---
 Build Sequence (Priority Order)

 1. Phase 1 — Database + backend foundation (unblocks everything)
 2. Phase 2 — Audio recording + code snapshot capture (captures data for future replays immediately)
 3. Phase 3 — Enhanced results page (user-facing value delivered quickly with analysis preview)
 4. Phase 4 — Replay page (the main feature — audio playback + timeline + annotations)
 5. Phase 5 — Progress dashboard (the cherry on top)

 ---
 Files Summary

 Backend — Create (4 files)

 - resugpt-backend/queries/interviewAnalysis.queries.js
 - resugpt-backend/services/interviewAnalysis.service.js
 - resugpt-backend/services/audioStorage.service.js
 - resugpt-backend/controllers/interviewAnalysis.controller.js

 Backend — Modify (2 files)

 - resugpt-backend/routes/interviewSession.routes.js — add 6 routes + multer middleware
 - resugpt-backend/controllers/interviewRealtime.controller.js — add fire-and-forget analysis trigger

 Backend — Install

 - multer — multipart form data parsing for audio upload

 Frontend — Create (10 files)

 - resugpt/src/types/interviewAnalysis.ts
 - resugpt/src/app/interview-prep/session/[sessionId]/replay/page.tsx
 - resugpt/src/app/interview-prep/progress/page.tsx
 - resugpt/src/components/interview-replay/ReplayTimeline.tsx
 - resugpt/src/components/interview-replay/TranscriptReplayPanel.tsx
 - resugpt/src/components/interview-replay/CodeSnapshotViewer.tsx
 - resugpt/src/components/interview-replay/RoundNavigation.tsx
 - resugpt/src/components/interview-replay/AudioPlaybackBar.tsx
 - resugpt/src/components/interview-replay/AnalysisPendingBanner.tsx
 - resugpt/src/components/interview-replay/index.ts

 Frontend — Modify (5 files)

 - resugpt/src/hooks/useRealtimeInterview.ts — add MediaRecorder for both streams + stopRecording()
 - resugpt/src/types/interviewRealtime.ts — add stopRecording to return type
 - resugpt/src/services/interviewSessionService.ts — add 6 service functions
 - resugpt/src/app/interview-prep/session/[sessionId]/page.tsx — code snapshot capture + audio upload at round end
 - resugpt/src/app/interview-prep/session/[sessionId]/results/page.tsx — analysis preview + replay link
 - resugpt/src/app/interview-prep/history/page.tsx — progress link

 Existing Patterns to Reuse

 - scoreColor() from results/page.tsx:30-33
 - ROUND_TYPE_VARIANT from src/components/interview-prep/RoleDetailsContent.tsx
 - RECOMMENDATION_CONFIG from results/page.tsx:23-28
 - apiClient<T>() from src/services/apiClient.ts
 - Badge / Button CVA components from src/components/ui/
 - Framer Motion initial={{ opacity: 0, y: 20 }} / animate patterns
 - Set<number> expand/collapse pattern from results/page.tsx:88-102
 - Monaco editor config from CodeEditorPanel.tsx (read-only mode)
 - CSS custom properties: --bg-elevated, --bg-muted, --accent-color, --success, --warning, --error
 - JSON fence stripping pattern from interviewScoring.service.js:66 for GPT-4o response parsing