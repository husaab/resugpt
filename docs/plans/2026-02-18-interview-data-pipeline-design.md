# Interview Data Pipeline — Design Document

**Date:** 2026-02-18
**Status:** Approved
**Author:** Hussein Saab + Claude
**Complexity:** 6/10
**Estimated Timeline:** 4-5 days

---

## Overview

A separate microservice that automates the creation of companies, roles, and interview question banks for the Interview Prep feature. Instead of manually entering hundreds of questions, the pipeline scrapes real interview experiences from Glassdoor (and later Reddit, LeetCode, Blind), uses Claude AI to structure the raw data into the app's schema, and publishes it through the existing admin API.

### Problem

The Interview Prep feature requires rich, authentic data: companies with profiles, roles with multi-round interview structures, and question banks with follow-ups, evaluation criteria, and sample answers. Manually creating this for even 10 companies would take weeks and produce hundreds of individual entries.

### Solution

Automate data collection and structuring:
1. **Firecrawl** scrapes interview pages and returns clean markdown
2. **Claude API** transforms raw text into structured JSON matching the app's schema
3. **Backend admin API** receives and stores the structured data in Supabase
4. **Existing admin UI** used for human review and editing

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Scraping tool | Firecrawl API | Handles JS rendering, anti-bot, clean markdown output; no need to build/maintain custom scrapers |
| AI structuring | Claude API (Anthropic) | Best at structured JSON extraction from messy text; tool_use guarantees valid JSON |
| Data push | Via existing admin API endpoints | No direct DB access; reuses existing validation, auth, and schema |
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
│  │  Firecrawl   │───>│  Claude API    │───>│  Push via    │  │
│  │  (scrape     │    │  (structure    │    │  admin API   │  │
│  │   Glassdoor) │    │   into JSON)   │    │  endpoints)  │  │
│  └─────────────┘    └───────────────┘    └──────┬──────┘  │
└──────────────────────────────────────────────────┘        │
                                                             │
        ┌────────────────────────────────────────────┐       │
        │  Existing Backend (Supabase)                │<──────┘
        │  POST /interview-prep/admin/companies       │
        │  POST /interview-prep/admin/roles           │
        └────────────────────────────────────────────┘
               │
               v
        ┌────────────────────────────────────────────┐
        │  Next.js Frontend                           │
        │  (Review/edit in existing admin UI)          │
        └────────────────────────────────────────────┘
```

### Data Flow

1. **Scrape:** Firecrawl fetches Glassdoor interview pages for a target company → returns clean markdown
2. **Cache:** Raw markdown saved to `output/raw/{company}.md` for debugging/reprocessing
3. **Structure:** Claude API processes raw markdown → outputs structured JSON matching app types
4. **Validate:** JSON validated against TypeScript types from `src/types/interviewPrep.ts`
5. **Review:** Quick terminal preview before publishing ("Google: 4 roles, 47 questions. Publish?")
6. **Publish:** Structured data pushed via admin API → stored in Supabase → visible in admin UI

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js / TypeScript | Matches existing stack, reuses types |
| Scraping | `firecrawl-js` | Glassdoor scraping with JS rendering and anti-bot handling |
| AI | `@anthropic-ai/sdk` | Structured JSON extraction from raw interview text |
| Publishing | `fetch` / existing admin API | Push data through validated endpoints |
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
│   │   └── backendPublisher.ts   # Push structured data via admin API
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

The pipeline uses the existing admin API endpoints:

1. `POST /interview-prep/admin/companies` — create company with profile
2. `POST /interview-prep/admin/roles` — create each role with rounds and questions

Company logos can be sourced separately (company websites, Clearbit Logo API) and uploaded via the existing logo upload endpoint.

### Idempotency

- Check if company already exists before creating
- Allow re-running pipeline to add new roles or update questions
- Track which companies have been processed in a local manifest

---

## CLI Interface

```bash
# Scrape and process a single company
npm run pipeline -- --company google

# Scrape and process all target companies
npm run pipeline -- --all

# Only scrape (don't process or publish)
npm run pipeline -- --company google --scrape-only

# Only process cached scrapes (don't re-scrape)
npm run pipeline -- --company google --process-only

# Publish previously processed data
npm run pipeline -- --company google --publish-only

# Dry run (show what would be published)
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

The following must exist before the pipeline can publish:

1. **Backend admin API endpoints** — `POST /interview-prep/admin/companies` and `POST /interview-prep/admin/roles` must be implemented and accepting requests
2. **Firecrawl API key** — sign up at firecrawl.dev
3. **Anthropic API key** — for Claude structuring calls

If the backend isn't ready, the pipeline can still scrape and structure data, saving to local JSON files for later publishing.

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Firecrawl can't access Glassdoor | Test with one page immediately; fallback: use for public pages only, supplement with AI generation |
| Claude outputs inconsistent JSON | Use tool_use for structured output; validate against types; retry on failures |
| Glassdoor blocks after many requests | Rate-limit (1 req per 5-10s); cache aggressively; scrape in batches over days |
| Low quality scraped data | Multi-pass AI processing: extract → structure → quality-check |
| Backend API not ready | Pipeline outputs to local JSON; publish step is separate and can wait |
| Glassdoor ToS concerns | Never store raw data in production; only publish AI-structured derivatives; transform, don't redistribute |

---

## Implementation Timeline

| Task | Effort | Dependency |
|------|--------|------------|
| Set up microservice repo + Firecrawl SDK | 0.5 day | None |
| Glassdoor scraper (URL construction, Firecrawl calls, caching) | 1 day | Firecrawl SDK |
| AI structuring layer (Claude prompts, JSON validation) | 1-2 days | Scraper |
| Backend publisher (calls admin API endpoints) | 0.5 day | Backend API exists |
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
