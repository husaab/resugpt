# Task: Build the Interview Data Pipeline Microservice

You are building a **standalone Node.js/TypeScript microservice** called `resugpt-data-pipeline`. This is a CLI tool that scrapes interview experiences from Glassdoor (Phase 1), uses Claude AI to structure the raw data into a specific JSON schema, and submits the structured data to a backend API endpoint that upserts into an `external_submissions` Supabase table for admin review.

**This is a separate repo/project — NOT part of the main Next.js app.** It runs locally as a CLI tool.

---

## Architecture

```
Firecrawl (scrape Glassdoor) → Claude API (structure into JSON) → POST /interview-prep/external-submissions (upsert to staging table)
```

The pipeline NEVER creates companies/roles directly. It submits structured data with `source = 'scraper'` and `status = 'pending'` to a staging table. Admins review and approve before data goes live.

---

## Project Structure

Create this exact structure:

```
resugpt-data-pipeline/
├── src/
│   ├── scrapers/
│   │   └── glassdoor.ts          # Firecrawl-based Glassdoor scraper
│   ├── processors/
│   │   └── aiStructurer.ts       # Claude API: raw markdown → structured JSON
│   ├── publishers/
│   │   └── submissionPublisher.ts # Upsert structured data to external_submissions via API
│   ├── types/
│   │   └── pipeline.ts           # All TypeScript types
│   ├── config/
│   │   └── companies.ts          # Target companies with Glassdoor URLs/IDs
│   └── index.ts                  # CLI orchestrator (entry point)
├── output/
│   ├── raw/                      # Cached raw scrapes (markdown files)
│   └── structured/               # Cached structured JSON files
├── .env.example                  # Template for required env vars
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "latest",
    "@anthropic-ai/sdk": "latest",
    "firecrawl-js": "latest",
    "commander": "latest",
    "dotenv": "latest",
    "uuid": "latest"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/uuid": "latest",
    "tsx": "latest"
  }
}
```

Use `tsx` for running TypeScript directly. Scripts:
```json
{
  "scripts": {
    "pipeline": "tsx src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Environment Variables (.env)

```
FIRECRAWL_API_KEY=your_firecrawl_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
BACKEND_URL=http://localhost:4000/api/
SCRAPER_VERSION=1.0.0
```

---

## Type Definitions (src/types/pipeline.ts)

Define these types. They must match the `external_submissions.data` JSONB structure exactly:

```typescript
// ─── Submission Data Shape (matches external_submissions.data JSONB) ───

export interface SubmissionData {
  company: CompanyData;
  role: RoleData;
}

export interface CompanyData {
  name: string;
  logo: string | null;
  industry: string;
  description: string;
  interviewStyle: string;
}

export interface RoleData {
  title: string;
  level: 'intern' | 'junior' | 'mid' | 'senior' | 'staff';
  department: string;
  description: string;
  rounds: InterviewRound[];
  tips: string[];
}

export interface InterviewRound {
  roundNumber: number;
  type: 'behavioral' | 'technical' | 'system_design' | 'phone_screen' | 'hiring_manager';
  title: string;
  description: string;
  duration: number; // minutes
  questions: InterviewQuestion[];
}

export interface InterviewQuestion {
  id: string; // UUID
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  followUps: string[];
  evaluationCriteria: string[];
  sampleAnswer: string;
  source: 'scraper';
  submittedBy: null;
}

// ─── Scraper Metadata (matches external_submissions.scraper_metadata JSONB) ───

export interface ScraperMetadata {
  sourceUrl: string;
  scrapedAt: string; // ISO 8601
  scraperVersion: string;
  rawDataPath: string;
  platform: 'glassdoor' | 'reddit' | 'leetcode' | 'blind';
  reviewCount: number;
}

// ─── API Request (what we POST to the backend) ───

export interface SubmissionRequest {
  source: 'scraper';
  data: SubmissionData;
  scraper_metadata: ScraperMetadata;
}

// ─── Company Config ───

export interface CompanyConfig {
  name: string;
  glassdoorSlug: string; // e.g. "Google-Interview-Questions"
  glassdoorId: string;   // e.g. "E9079"
}

// ─── Pipeline Result ───

export interface PipelineResult {
  company: string;
  scrapedReviews: number;
  rolesGenerated: number;
  questionsGenerated: number;
  submissionsCreated: number;
  errors: string[];
}
```

---

## Company Config (src/config/companies.ts)

```typescript
import { CompanyConfig } from '../types/pipeline';

export const targetCompanies: CompanyConfig[] = [
  { name: "Google", glassdoorSlug: "Google-Interview-Questions", glassdoorId: "E9079" },
  { name: "Meta", glassdoorSlug: "Meta-Interview-Questions", glassdoorId: "E40772" },
  { name: "Amazon", glassdoorSlug: "Amazon-Interview-Questions", glassdoorId: "E6036" },
  { name: "Apple", glassdoorSlug: "Apple-Interview-Questions", glassdoorId: "E1138" },
  { name: "Microsoft", glassdoorSlug: "Microsoft-Interview-Questions", glassdoorId: "E1651" },
  { name: "Netflix", glassdoorSlug: "Netflix-Interview-Questions", glassdoorId: "E11891" },
  { name: "Stripe", glassdoorSlug: "Stripe-Interview-Questions", glassdoorId: "E671932" },
  { name: "Uber", glassdoorSlug: "Uber-Technologies-Interview-Questions", glassdoorId: "E575263" },
  { name: "Airbnb", glassdoorSlug: "Airbnb-Interview-Questions", glassdoorId: "E391850" },
  { name: "Tesla", glassdoorSlug: "Tesla-Motors-Interview-Questions", glassdoorId: "E43129" },
];
```

---

## Module Specifications

### 1. Glassdoor Scraper (src/scrapers/glassdoor.ts)

**Exports:** `scrapeGlassdoor(company: CompanyConfig): Promise<string>`

**Behavior:**
1. Check if cached markdown exists at `output/raw/{company-name-lowercase}.md` — if yes and less than 24 hours old, return cached version
2. Construct Glassdoor URL: `https://www.glassdoor.com/Interview/{glassdoorSlug}-{glassdoorId}.htm`
3. Call Firecrawl's `scrapeUrl()` method to fetch the page as clean markdown
4. If the page has pagination, attempt to scrape pages 2-5 as well (construct URL with `_IP2.htm`, `_IP3.htm` etc.)
5. Concatenate all pages into a single markdown string
6. Save to `output/raw/{company-name-lowercase}.md`
7. Return the markdown string
8. Rate limit: wait 5 seconds between Firecrawl calls
9. On Firecrawl errors, log the error and return whatever was collected (partial results are OK)

**Firecrawl setup:**
```typescript
import FirecrawlApp from '@mendable/firecrawl-js';
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const result = await firecrawl.scrapeUrl(url, { formats: ['markdown'] });
```

### 2. AI Structurer (src/processors/aiStructurer.ts)

**Exports:** `structureInterviewData(rawMarkdown: string, companyName: string): Promise<SubmissionData[]>`

**Behavior:**
1. Takes raw Glassdoor markdown and company name
2. Calls Claude API using `tool_use` (structured output) to extract and structure the data
3. The prompt should instruct Claude to:
   - Extract all distinct roles mentioned in the reviews
   - For each role, build the full round structure and question bank
   - Categorize questions (behavioral, technical, system_design, phone_screen, hiring_manager)
   - Rate difficulty per question
   - Generate follow-up questions from context
   - Write evaluation criteria for each question
   - Write sample strong answers
   - Deduplicate similar questions
   - Generate a company profile (industry, description, interview style)
   - Generate tips per role
4. Returns an array of `SubmissionData` — one per role found (all sharing the same company data)
5. Generate UUIDs for each question's `id` field
6. Set `source: 'scraper'` and `submittedBy: null` on all questions
7. Save structured JSON to `output/structured/{company-name-lowercase}.json`

**Claude API setup — use tool_use for guaranteed JSON:**

```typescript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic(); // uses ANTHROPIC_API_KEY env var

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 8192,
  tools: [{
    name: 'submit_structured_data',
    description: 'Submit structured interview data extracted from raw reviews',
    input_schema: {
      type: 'object',
      properties: {
        company: { /* CompanyData schema */ },
        roles: {
          type: 'array',
          items: { /* RoleData schema */ }
        }
      },
      required: ['company', 'roles']
    }
  }],
  tool_choice: { type: 'tool', name: 'submit_structured_data' },
  messages: [{ role: 'user', content: prompt }]
});
```

**System prompt for Claude:**
```
You are an expert interview data analyst for a tech interview preparation platform. You are given raw interview experiences scraped from Glassdoor for a specific company. Your job is to extract and structure this data into a clean, comprehensive interview preparation dataset.

Instructions:
1. Identify all distinct roles mentioned (e.g., "Software Engineer", "Product Manager", "Data Scientist")
2. For each role, determine the seniority level (intern, junior, mid, senior, staff) based on context
3. Build the interview round structure for each role based on descriptions (e.g., phone screen → technical → behavioral → hiring manager)
4. Extract every interview question mentioned, categorize it, and rate its difficulty
5. Generate 2-3 realistic follow-up questions for each extracted question
6. Write evaluation criteria that an interviewer would use to score answers
7. Write a sample strong answer (STAR format for behavioral, structured approach for technical)
8. Deduplicate similar questions — merge them into one with the best phrasing
9. Write a company profile: industry, 2-3 sentence description, and a paragraph about their interview style/culture
10. Generate 3-5 preparation tips specific to each role at this company

Be thorough. It's better to extract too many questions than too few. If a review mentions "they asked algorithm questions" without specifics, generate realistic algorithm questions that match the company's known style.

Each question needs a unique UUID (use the format "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx").
Set source to "scraper" and submittedBy to null for all questions.
```

**If the raw markdown is very long (>100K chars), split into chunks of ~50K chars and make multiple Claude calls, then merge the results.**

### 3. Submission Publisher (src/publishers/submissionPublisher.ts)

**Exports:** `submitToBackend(submissions: SubmissionRequest[]): Promise<{ created: number; updated: number; skipped: number; errors: string[] }>`

**Behavior:**
1. Takes an array of `SubmissionRequest` objects
2. For each submission, POST to `${BACKEND_URL}interview-prep/external-submissions`
3. Request body is the `SubmissionRequest` object as JSON
4. Handle responses:
   - 201 Created → count as created
   - 200 OK → count as updated (idempotent upsert)
   - 409 Conflict → count as skipped (already approved)
   - Other errors → log and add to errors array
5. Log progress: "Submitted role {n}/{total}: {companyName} - {roleTitle}"
6. Return summary counts

**If the backend is not available** (connection refused, 5xx), save the submissions to `output/structured/{company}-submissions.json` as a fallback for later `--submit-only` mode.

### 4. CLI Orchestrator (src/index.ts)

**Uses `commander` for CLI parsing.**

**Commands:**

```bash
# Full pipeline for one company
npm run pipeline -- --company google

# Full pipeline for all companies in config
npm run pipeline -- --all

# Scrape only (save to output/raw/)
npm run pipeline -- --company google --scrape-only

# Process only (read from output/raw/, save to output/structured/)
npm run pipeline -- --company google --process-only

# Submit only (read from output/structured/, POST to backend)
npm run pipeline -- --company google --submit-only

# Dry run (full pipeline but don't actually submit — just show what would be sent)
npm run pipeline -- --company google --dry-run
```

**Full pipeline flow for `--company google`:**
1. Look up "google" in `targetCompanies` config (case-insensitive match on name)
2. Call `scrapeGlassdoor(company)` → get raw markdown
3. Call `structureInterviewData(rawMarkdown, company.name)` → get `SubmissionData[]`
4. Build `SubmissionRequest[]` — one per role, each with `source: 'scraper'` and `scraper_metadata` populated
5. Print summary: "Google: {N} roles, {M} total questions across {R} rounds"
6. If `--dry-run`, print the JSON and exit
7. Call `submitToBackend(submissions)` → get results
8. Print final report: "Created: X, Updated: Y, Skipped: Z, Errors: W"

**For `--all`:** iterate through all companies in config, running the full pipeline for each with a 10-second pause between companies.

**Error handling:** Never crash on a single company failure. Log the error, continue to next company, report failures at the end.

---

## external_submissions Table (for context — already exists in Supabase)

The backend endpoint you're POSTing to upserts into this table:

```sql
CREATE TABLE IF NOT EXISTS public.external_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                          -- 'scraper' for this pipeline
  submitted_by TEXT,                             -- NULL for scraper
  data JSONB NOT NULL,                           -- {company: {...}, role: {...}}
  status TEXT NOT NULL DEFAULT 'pending',         -- pending → approved/rejected
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  rejection_reason TEXT,
  linked_company_id UUID,
  created_company_id UUID,
  created_role_id UUID,
  scraper_metadata JSONB,                        -- {sourceUrl, scrapedAt, scraperVersion, rawDataPath, platform, reviewCount}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT external_submissions_source_check CHECK (source IN ('user', 'scraper')),
  CONSTRAINT external_submissions_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);
```

The `data` JSONB column receives the `SubmissionData` object. The `scraper_metadata` column receives the `ScraperMetadata` object. Both are defined in the types above.

---

## Key Requirements

1. **TypeScript strict mode** — `tsconfig.json` should have `strict: true`
2. **No direct database access** — all data goes through the backend API endpoint
3. **Caching** — raw scrapes and structured JSON are cached to `output/` to avoid redundant API calls
4. **Rate limiting** — 5 seconds between Firecrawl requests
5. **Graceful failures** — never crash on individual company/role errors; log and continue
6. **Structured output** — use Claude `tool_use` to guarantee valid JSON (no regex parsing)
7. **UUIDs** — generate proper v4 UUIDs for question IDs
8. **Idempotency** — if re-running, check for existing submissions before creating duplicates (the backend handles this, but log when it returns 409)
9. **Console output** — clear, formatted progress logs with emoji-free, professional output (e.g., "[SCRAPE] Google: fetching page 1...", "[AI] Google: structuring 47 reviews into roles...", "[SUBMIT] Google - Software Engineer: 201 Created")

---

## What NOT to Build

- No web UI — this is CLI only
- No database client — no Supabase SDK, no pg driver
- No tests yet — focus on working pipeline first
- No Reddit/LeetCode/Blind scrapers yet — Glassdoor only for Phase 1
- No authentication — the backend endpoint will handle auth if needed later
- No Docker — just a local Node.js CLI
