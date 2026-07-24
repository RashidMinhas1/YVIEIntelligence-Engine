# YouTube Viral Intelligence Engine (YVIE)

## Overview

A full-stack SaaS web application for YouTube creators. Analyzes competitor channels, generates viral titles using AI, analyzes and generates retention-optimized scripts, with dual output modes (Docs/Plain Text).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (dark theme, Tailwind CSS, shadcn/ui)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Replit AI Integrations (OpenAI-compatible, no API key needed)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

1. **Competitor Intelligence** — Input 1–3 YouTube channel names, fetch their 10 latest videos (real data with YouTube API key, or demo data without)
2. **Title Analyzer** — Paste up to 21 competitor titles, get AI analysis of winning patterns, CTR psychology, keyword positioning
3. **Title Generator** — Generate 5 viral titles based on analysis results
4. **Script Analyzer** — Paste a competitor script, extract tone, mood, hook structure, retention formula
5. **Script Generator** — Generate a full retention-optimized YouTube script with retention hooks every 15-25 seconds
6. **Dual Output Modes** — Toggle between "Docs Mode" (structured markdown) and "Plain Text Mode" for all AI results
7. **Export/Copy** — Copy to clipboard, download as .txt or .md on every result
8. **History** — Browse all past analyses and generated scripts

## DB Schema

- `videos` — competitor channel videos
- `title_analyses` — saved title analysis results
- `script_analyses` — saved script analysis results
- `generated_scripts` — saved generated scripts

## API Routes

- `POST /api/videos/fetch` — fetch competitor videos
- `GET /api/videos` — list saved videos
- `POST /api/titles/analyze` — AI title analysis
- `POST /api/titles/generate` — AI title generation
- `POST /api/scripts/analyze` — AI script analysis
- `POST /api/scripts/generate` — AI script generation
- `GET /api/history/title-analyses` — list analyses
- `GET /api/history/script-analyses` — list script analyses
- `GET /api/history/generated-scripts` — list generated scripts
- `GET /api/stats/dashboard` — dashboard summary stats

## YouTube API Key (optional)

Add `YOUTUBE_API_KEY` in Secrets to enable real YouTube data. Without it, the app uses realistic demo data with a clear notice.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
