# Interview Data Pipeline — Design Document

**Date:** 2026-02-18
**Status:** Approved
**Author:** Hussein Saab + Claude
**Complexity:** 6/10
**Estimated Timeline:** 4-5 days

---

## Overview

A separate microservice that automates the collection and structuring of companies, roles, and interview question banks for the Interview Prep feature. Instead of manually entering hundreds of questions, the pipeline scrapes real interview experiences from Glassdoor (and later Reddit, LeetCode, Blind), uses Claude AI to structure the raw data into the app's schema, and submits it to the `external_submissions` table for admin review and approval.

### Problem

The Interview Prep feature requires rich, authentic data: companies with profiles, roles with multi-round interview structures, and question banks with follow-ups, evaluation criteria, and sample answers. Manually creating this for even 10 companies would take weeks and produce hundreds of individual entries.

### Solution

Automate data collection and structuring:
1. **Firecrawl** scrapes interview pages and returns clean markdown
2. **Claude API** transforms raw text into structured JSON matching the app's schema
3. **Pipeline upserts** into `external_submissions` table with `source = 'scraper'` and `status = 'pending'`
4. **Admin reviews** submissions in the admin panel — can approve, edit, link to existing company, or reject

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Scraping tool | Firecrawl API | Handles JS rendering, anti-bot, clean markdown output; no need to build/maintain custom scrapers |
| AI structuring | Claude API (Anthropic) | Best at structured JSON extraction from messy text; tool_use guarantees valid JSON |
| Data push | Via `external_submissions` table (`source = 'scraper'`) | Scraped data goes through same approval workflow as user submissions; admin reviews before anything goes live |
| Pipeline hosting | Standalone Node.js microservice | Clean separation from Next.js app; can run locally or deploy independently |
| Primary data source | Glassdoor (Phase 1) | Best structured interview data; Firecrawl handles complexity |
| Expansion sources | Reddit API, LeetCode GraphQL, Blind | Tiered rollout; each adds an input adapter to the same pipeline |
| Raw data storage | Never stored in production DB | Raw scrapes cached locally; only AI-structured derivative data published |

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│              DATA PIPELINE MICROSERVICE                     │
│                                                             │
│  ┌─────────────┐    ┌───────────────┐    ┌─────────────┐  │
│  │  Firecrawl   │───>│  Claude API    │───>│  Upsert to   │  │
│  │  (scrape     │    │  (structure    │    │  external_    │  │
│  │   Glassdoor) │    │   into JSON)   │    │  submissions) │  │
│  └─────────────┘    └───────────────┘    └──────┬──────┘  │
└──────────────────────────────────────────────────┘        │
                                                             │
        ┌────────────────────────────────────────────┐       │
        │  Backend (Supabase)                         │<──────┘
        │  POST /interview-prep/external-submissions  │
        │  → external_submissions table               │
        │  → source='scraper', status='pending'       │
        └────────────────────────────────────────────┘
               │
               v
        ┌────────────────────────────────────────────┐
        │  Admin Panel (Next.js)                      │
        │  Review → Approve/Edit/Reject               │
        │  On approve → creates company + role        │
        └────────────────────────────────────────────┘
```

### Data Flow

1. **Scrape:** Firecrawl fetches Glassdoor interview pages for a target company → returns clean markdown
2. **Cache:** Raw markdown saved to `output/raw/{company}.md` for debugging/reprocessing
3. **Structure:** Claude API processes raw markdown → outputs structured JSON matching the `external_submissions.data` JSONB schema
4. **Validate:** JSON validated against TypeScript types before submission
5. **Submit:** Upsert into `external_submissions` with `source = 'scraper'`, `status = 'pending'`, and `scraper_metadata` populated
6. **Admin review:** Admin sees pending submissions in admin panel → can approve (creates company + role), edit before approving, link to existing company, or reject with reason

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js / TypeScript | Matches existing stack, reuses types |
| Scraping | `firecrawl-js` | Glassdoor scraping with JS rendering and anti-bot handling |
| AI | `@anthropic-ai/sdk` | Structured JSON extraction from raw interview text |
| Publishing | `fetch` / external-submissions endpoint | Upsert structured data into `external_submissions` staging table |
| Hosting | Local CLI initially | Run on demand; deploy to Cloud Function later if needed |

---

## Project Structure

```
resugpt-data-pipeline/
├── src/
│   ├── scrapers/
│   │   ├── glassdoor.ts          # Firecrawl-based Glassdoor scraper
│   │   ├── reddit.ts             # Reddit API scraper (Phase 2)
│   │   ├── leetcode.ts           # LeetCode GraphQL scraper (Phase 3)
│   │   └── blind.ts              # Firecrawl-based Blind scraper (Phase 4)
│   ├── processors/
│   │   └── aiStructurer.ts       # Claude API: raw text → structured JSON
│   ├── publishers/
│   │   └── submissionPublisher.ts # Upsert to external_submissions table
│   ├── types/
│   │   └── pipeline.ts           # Pipeline types (extends main app types)
│   ├── config/
│   │   └── companies.ts          # Target companies with Glassdoor URLs
│   └── index.ts                  # CLI orchestrator
├── output/
│   ├── raw/                      # Cached raw scrapes (markdown)
│   └── structured/               # Cached structured JSON
├── .env                          # FIRECRAWL_API_KEY, ANTHROPIC_API_KEY, BACKEND_URL
├── package.json
└── tsconfig.json
```

---

## Scraping Strategy

### Phase 1: Glassdoor (Primary)

**URL pattern:**
```
https://www.glassdoor.com/Interview/{Company}-Interview-Questions-{ID}.htm
```

**Firecrawl configuration:**
- Scrape interview review pages (paginated — may need multiple page fetches)
- Extract: interview questions, role/level, difficulty, outcome, date
- Rate limit: 1 request per 5-10 seconds to avoid blocking
- Cache: save raw markdown per company to `output/raw/`

**Target companies (initial batch):**
- Google, Meta, Amazon, Apple, Microsoft, Netflix, Stripe, Uber, Airbnb, Tesla
- Expand to 50+ companies over time

### Phase 2: Reddit API

- Official API (OAuth, 100 requests/min)
- Subreddits: r/cscareerquestions, r/experienceddevs
- Search: "{company} interview experience"
- Lower risk, official API usage

### Phase 3: LeetCode

- Undocumented GraphQL API (stable, widely used)
- Company-tagged problems with difficulty and discussion
- Best source for technical interview questions

### Phase 4: Blind

- Firecrawl scrape (similar to Glassdoor)
- Requires authentication handling
- Rich interview experience data

---

## AI Structuring Layer

### Prompt Strategy

```
System: You are an expert interview data analyst. Given raw interview
experiences scraped from job review sites, extract and structure the
data into a specific JSON schema for an interview preparation app.

Rules:
- Extract actual interview questions from the text
- Categorize each question (behavioral, technical, system_design)
- Rate difficulty based on role level and question complexity
- Generate follow-up questions based on the context
- Create evaluation criteria for each question
- Write sample answers that demonstrate strong responses
- Deduplicate similar questions across reviews
- Infer round structure from descriptions

User: Here are {N} interview experiences for {Company}:

{raw_markdown}

Output the following JSON structure:
{schema}
```

### Quality Assurance

- **Structured output:** Use Claude's tool_use for guaranteed valid JSON
- **Two-pass processing:** Extract → then review/fix inconsistencies
- **Validation:** Check output against TypeScript types before publishing
- **Batch size:** Process 20-50 reviews per Claude call for best results

---

## Publishing Strategy

The pipeline submits structured data to the `external_submissions` table via a backend endpoint. Scraped data **never goes directly into production tables** — it always goes through admin approval first.

### Submission Endpoint

```
POST /interview-prep/external-submissions
```

**Request body:**
```json
{
  "source": "scraper",
  "data": {
    "company": { "name", "logo", "industry", "description", "interviewStyle" },
    "role": { "title", "level", "department", "description", "rounds": [...], "tips": [...] }
  },
  "scraper_metadata": {
    "sourceUrl": "https://glassdoor.com/Interview/Google-Interview-...",
    "scrapedAt": "2026-02-18T12:00:00Z",
    "scraperVersion": "1.0.0",
    "rawDataPath": "output/raw/google.md"
  }
}
```

Each submission = **one full role** (company info + role + rounds + questions bundled). If a single scrape produces 4 roles for Google, the pipeline creates 4 separate submissions — one per role. The company info is duplicated in each submission; on approval, the admin links to an existing company or creates a new one.

### Approval Workflow

1. Pipeline upserts submission → `status = 'pending'`
2. Admin sees pending submissions in admin panel
3. Admin can:
   - **Approve as-is** → backend creates company (or links to existing) + role in production tables, sets `created_company_id` and `created_role_id`
   - **Edit then approve** → admin modifies the `data` JSONB before approving
   - **Link to existing company** → sets `linked_company_id` instead of creating a new company
   - **Reject** → sets `status = 'rejected'` with `rejection_reason`

### Idempotency

- Before submitting, the pipeline queries `external_submissions` for existing pending/approved entries matching the same company name + role title (using the GIN index on `data`)
- If a pending submission already exists for the same company+role, the pipeline **updates** the existing row instead of creating a duplicate
- If an approved submission exists, the pipeline skips (or optionally creates a new submission for re-review)
- Raw scrape cache in `output/raw/` prevents redundant Firecrawl calls

---

## `external_submissions` Table Schema

The pipeline writes to the `external_submissions` table in Supabase. This table is shared with user-submitted interview experiences — both go through the same admin approval workflow.

### Table Structure

| Column | Type | Pipeline Usage |
|--------|------|----------------|
| `id` | UUID (auto) | Auto-generated |
| `source` | TEXT | Always `'scraper'` |
| `submitted_by` | TEXT | `NULL` (no user for scraper) |
| `data` | JSONB | Full company + role payload (see below) |
| `status` | TEXT | `'pending'` on insert |
| `reviewed_by` | TEXT | Set by admin on review |
| `reviewed_at` | TIMESTAMP | Set by admin on review |
| `review_notes` | TEXT | Admin's internal notes |
| `rejection_reason` | TEXT | Set if admin rejects |
| `linked_company_id` | UUID | Set if admin links to existing company |
| `created_company_id` | UUID | Set on approval (new company created) |
| `created_role_id` | UUID | Set on approval (role created) |
| `scraper_metadata` | JSONB | Source URL, scrape timestamp, version (see below) |
| `created_at` | TIMESTAMP (auto) | Auto-generated |
| `updated_at` | TIMESTAMP (auto) | Auto-generated |

### `data` JSONB Structure

Each submission bundles a full role (company info + role + rounds + questions):

```json
{
  "company": {
    "name": "Google",
    "logo": null,
    "industry": "Technology",
    "description": "...",
    "interviewStyle": "Google values structured problem-solving..."
  },
  "role": {
    "title": "Software Engineer",
    "level": "mid",
    "department": "Engineering",
    "description": "...",
    "rounds": [
      {
        "roundNumber": 1,
        "type": "behavioral",
        "title": "Phone Screen",
        "description": "30-minute behavioral interview",
        "duration": 30,
        "questions": [
          {
            "id": "uuid-here",
            "question": "Tell me about a time you dealt with a difficult team member",
            "category": "leadership",
            "difficulty": "medium",
            "followUps": ["How did that change your approach?"],
            "evaluationCriteria": ["Shows empathy", "Demonstrates conflict resolution"],
            "sampleAnswer": "In my previous role...",
            "source": "scraper",
            "submittedBy": null
          }
        ]
      }
    ],
    "tips": ["Prepare STAR format answers"]
  }
}
```

### `scraper_metadata` JSONB Structure

Populated only by the scraper pipeline (`NULL` for user submissions):

```json
{
  "sourceUrl": "https://www.glassdoor.com/Interview/Google-Interview-Questions-E9079.htm",
  "scrapedAt": "2026-02-18T12:00:00Z",
  "scraperVersion": "1.0.0",
  "rawDataPath": "output/raw/google.md",
  "platform": "glassdoor",
  "reviewCount": 47
}
```

### Key Indexes

- `idx_external_submissions_status` — fast filter by pending/approved/rejected
- `idx_external_submissions_pending` — partial index for the most common admin query (pending submissions sorted by date)
- `idx_external_submissions_data_gin` — GIN index on `data` JSONB for idempotency checks (lookup by company name + role title)

---

## CLI Interface

```bash
# Scrape and process a single company
npm run pipeline -- --company google

# Scrape and process all target companies
npm run pipeline -- --all

# Only scrape (don't process or submit)
npm run pipeline -- --company google --scrape-only

# Only process cached scrapes (don't re-scrape)
npm run pipeline -- --company google --process-only

# Submit previously processed data to external_submissions
npm run pipeline -- --company google --submit-only

# Dry run (show what would be submitted)
npm run pipeline -- --company google --dry-run
```

---

## Cost Analysis

| Component | Cost |
|-----------|------|
| Firecrawl API | ~$16/mo for 3,000 page credits |
| Claude API (structuring) | ~$0.50-2.00 per company |
| **Total for 50 companies** | **~$30-50 one-time** |

Compare: building custom scrapers would cost weeks of development + $100-200/mo for proxies.

---

## Prerequisites

The following must exist before the pipeline can submit:

1. **`external_submissions` table** — must exist in Supabase (see schema below)
2. **Backend submission endpoint** — `POST /interview-prep/external-submissions` must accept scraper submissions
3. **Firecrawl API key** — sign up at firecrawl.dev
4. **Anthropic API key** — for Claude structuring calls

If the backend endpoint isn't ready, the pipeline can still scrape and structure data, saving to local JSON files in `output/structured/` for later submission.

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Firecrawl can't access Glassdoor | Test with one page immediately; fallback: use for public pages only, supplement with AI generation |
| Claude outputs inconsistent JSON | Use tool_use for structured output; validate against types; retry on failures |
| Glassdoor blocks after many requests | Rate-limit (1 req per 5-10s); cache aggressively; scrape in batches over days |
| Low quality scraped data | Multi-pass AI processing: extract → structure → quality-check |
| Submissions pile up without review | Pipeline logs submission count after each run; admin dashboard shows pending count badge |
| Duplicate submissions | Idempotency check via GIN index on `data` JSONB before upserting |
| Submission endpoint not ready | Pipeline outputs to local JSON in `output/structured/`; submission step can wait |
| Glassdoor ToS concerns | Never store raw data in production; only submit AI-structured derivatives; transform, don't redistribute |

---

## Implementation Timeline

| Task | Effort | Dependency |
|------|--------|------------|
| Set up microservice repo + Firecrawl SDK | 0.5 day | None |
| Glassdoor scraper (URL construction, Firecrawl calls, caching) | 1 day | Firecrawl SDK |
| AI structuring layer (Claude prompts, JSON validation) | 1-2 days | Scraper |
| Submission publisher (upserts to `external_submissions`) | 0.5 day | Submission endpoint exists |
| CLI orchestrator (per-company and batch modes) | 0.5 day | All above |
| Test with 3-5 companies, iterate on prompt quality | 1 day | All above |
| **Total** | **~4-5 days** | — |

---

## Expansion Roadmap

| Phase | Source | Method | Timeline |
|-------|--------|--------|----------|
| 1 | Glassdoor | Firecrawl scrape | Week 1 |
| 2 | Reddit | Official API | Week 2 |
| 3 | LeetCode | GraphQL endpoint | Week 3 |
| 4 | Blind | Firecrawl scrape | Week 4 |
| 5 | Community | User submissions in app | Phase 2 of main feature |
