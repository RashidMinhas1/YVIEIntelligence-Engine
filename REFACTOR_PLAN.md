# REFACTOR_PLAN.md

## Overview
This document serves as the single source of truth for the entire YouTube Viral Intelligence Engine project roadmap. It outlines the step-by-step strategy to transition the codebase from a Replit export to a robust, scalable, and secure application.

### Important
- The first objective is **NOT** adding new features.
- The first objective is to make the downloaded Replit project run locally with exactly the same behavior and functionality as the original Replit application.
- No feature additions, refactoring, architecture improvements, database migrations, AI provider changes, or UI changes are allowed until the existing application is fully functional locally (Milestones 1-3).

---

## Validation Rules
After every completed milestone, the roadmap must only mark it as completed if:
- The project builds successfully.
- No new TypeScript errors exist.
- No runtime errors exist.
- Existing functionality is preserved.
- Manual verification passes.
- Any available tests pass.

*If any verification fails, the milestone must remain incomplete.*

---

## Milestones

### Milestone 1: Run the Replit project locally without changing functionality (✅ Completed)
- **Goal**: Successfully spin up the application on a local development environment without altering any underlying logic.
- **Scope**: Start the Next.js development server and ensure the application mounts without crashing.
- **Files expected to change**: None (Read-only execution phase).
- **Dependencies**: Node.js, pnpm/npm.
- **Completion Status**:
  - [x] Completed

### Milestone 2: Fix environment variables, configuration, and missing dependencies (✅ Completed)
- **Goal**: Configure the local environment to correctly connect to required services (DB, APIs) and resolve any package issues.
- **Scope**: Identify missing environment variables, set up local `.env`, configure local database access, and fix any broken package dependencies.
- **Completion Status**:
  - [x] Completed

### Milestone 3: Verify every existing feature works exactly like the Replit version (✅ Completed)
- **Goal**: Ensure the local version has 100% feature parity with the original Replit app.
- **Scope**: Test the entire user journey (authentication, dashboard, wizard, generation, library, history).
- **Completion Status**:
  - [x] Completed

### Milestone 4: AI Provider Abstraction & Universal Library (✅ Completed)
- **Goal**: Establish an extensible structure to swap AI providers, build a generic knowledge base, and create an intelligence dashboard.

#### Milestone 4A: AI Provider Foundation (✅ Completed)
- **Scope**: Implemented `AIProvider` interface, Factory, and Registry patterns in `src/lib/ai/`. Maintained 100% legacy OpenAI functionality.

#### Milestone 4B: Gemini Implementation (✅ Completed)
- **Scope**: Implemented `GeminiProvider` utilizing the `@google/generative-ai` SDK. Upgraded the underlying Foundation to include unified error handling, 45-second timeouts, and exponential backoff retry logic.

#### Milestone 4C: OpenRouter Implementation (✅ Completed)
- **Scope**: Implemented `OpenRouterProvider` for generic completions.

#### Milestone 4D: Universal Library Architecture (✅ Completed)
- **Scope**: Transformed the library into a scalable, generic knowledge base supporting custom folders and various content types.

#### Milestone 4E: Script Analysis Intelligence Dashboard (✅ Completed)
- **Scope**: Upgraded the generic script analysis report into a modular intelligence gathering platform with strict JSON schemas and reusable components.

### Milestone 5: Architecture Planning & AI Settings (✅ Completed)
- **Goal**: Plan architectural changes and implement the AI settings backend.

#### Milestone 5A: Design scalable backend architecture (✅ Completed)
- **Scope**: Created `ARCHITECTURE.md`, designed background job queues, determined API boundaries, and planned real-time UI updates.

#### Milestone 5B: AI Settings Backend (✅ Completed)
- **Scope**: Implemented the backend for the AI Settings module with local configuration fallback using `.ai-settings.json`.

### Milestone 6: Knowledge Extraction & Assembly Engines (✅ Completed)
- **Goal**: Build the atomic extraction and assembly engines.

#### Milestone 6A: Knowledge Extraction Engine (✅ Completed)
- **Scope**: Transformed the Script Analysis module into an atomic Knowledge Extraction Engine, decomposing competitor scripts into 28 standardized, highly reusable knowledge modules.

#### Milestone 6B: AI Knowledge Assembly Engine (✅ Completed)
- **Scope**: Developed a dedicated Builder UI (`/builder`) with Hybrid Conflict Detection, 5-Pillar Assembly Scoring, Live Prompt Compilation, AI Memory Profiling, Priority Weight Systems, and Assembly Template saving/loading.

### Milestone 7: Viral Intelligence & Optimization Engine (✅ Completed)
- **Goal**: Transform the application into a complete YouTube Viral Intelligence Platform.
- **Scope**: Implemented an Explainable AI (XAI) Intelligence Layer, Intelligence Graph, AI Coach, and Optimization Sandbox with multi-level scoring for Hooks, Titles, CTAs, Thumbnails, Story, and SEO.
- **Completion Status**:
  - [x] Completed

### Milestone 8: Complete Library & Builder UX Redesign (✅ Completed)
- **Goal**: Transform the Library and Builder into a professional, configuration-driven AI Knowledge Base.
- **Scope**: Replaced horizontal tabs with a configuration-driven left sidebar, implemented universal knowledge editors, and integrated "Save From AI Analysis" with plain text intelligence reports and atomic extraction.
- **Completion Status**:
  - [x] Completed

### Milestone 9: Implement the backend architecture (✅ Completed)
- **Goal**: Implement background processing for long-running AI requests without hitting Vercel limits.
- **Scope**: Re-architecture of script generation, extraction, and assembly endpoints to use local JobSystem patterns and a `jobs` database. Implementation of polling APIs, automatic retries, cancellation, and progressive loading UI via generic `useJob` hook.
- **Dependencies**: Milestone 8.
- **Acceptance Criteria**: All AI requests complete successfully and asynchronously. UI progressively updates.
- **Completion Status**: 
  - [x] Completed

### Milestone 10: Secure API Key Management from the UI
- **Goal**: Allow every user to securely manage their own AI provider API keys directly from the application.
- **Scope**: Build a complete API Key Management System. Add support for OpenAI, Gemini, and OpenRouter in a new `/settings` page. Securely encrypt keys on the server and mask them on the frontend.
- **Dependencies**: Milestone 9.
- **Completion Status**:
  - [x] Completed

### Milestone 11: Add authentication and user accounts
- **Goal**: Replace the global `PASSWORD` gate with a robust multi-tenant authentication system.
- **Scope**: Integrate NextAuth.js (Auth.js) or similar. Implement registration, login, and secure sessions. Map database records to specific `userId`s.
- **Dependencies**: Milestone 10.
- **Completion Status**:
  - [ ] Not Started

### Milestone 12: Improve security, API protection, validation, logging, and error handling
- **Goal**: Harden the application against abuse and ensure observability.
- **Scope**: Implement IP-based rate limiting (e.g., Vercel KV), strict Zod validation on all API inputs/outputs, structured server logging, and global error boundaries on the frontend.
- **Dependencies**: Milestone 11.
- **Completion Status**:
  - [ ] Not Started

### Milestone 13: Production readiness, testing, deployment, and documentation
- **Goal**: Prepare the codebase for production deployment and ensure long-term maintainability.
- **Scope**: Write end-to-end (E2E) tests or integration tests, finalize Vercel deployment configuration, set up custom domains, and update README.md/developer docs.
- **Dependencies**: Milestone 12.
- **Completion Status**:
  - [ ] Not Started

### Milestone 14: AI Script Writer Pro Studio
- **Goal**: Build a professional AI-powered Script Writing Studio where users can create, edit, optimize, and assemble complete YouTube scripts using reusable Knowledge Library components.
- **Scope**:
  - New `/studio` workspace
  - Section-based editor: Hook, Opening, Story, Body, CTA, Ending, Thumbnail Notes, Visual Prompt, Voice Prompt, B-roll Notes, Timeline Notes.
  - Every section supports: Add From Library, AI Rewrite, AI Improve, AI Expand, AI Shorten, AI Merge, AI Compare, Save To Library.
  - Live Analysis: Word Count, Reading Time, Retention Score, Curiosity Score, Emotional Score, Story Flow Score, Engagement Score.
- **Dependencies**: Milestone 13.
- **Completion Status**:
  - [x] Completed

### Milestone 15: AI Research & Intelligence Workspace
- **Goal**: Transform the Studio into a complete AI-powered Research Workspace where users can collect, organize, analyze, and reuse research before writing scripts.
- **Scope**:
  - Research Notebook, intelligent sourcing, extraction, collections
- **Dependencies**: Milestone 14.
- **Completion Status**:
  - [x] Completed

### Milestone 16: Knowledge Analytics & Intelligence (Re-mapped to AI Storyboard & Timeline Engine)
- **Goal**: Transform the Studio into a complete visual script planning workspace by introducing a Storyboard & Timeline Engine.
- **Scope**:
  - Storyboard Panel, Scene Cards, Timeline Analysis, Auto Duration, Scene Generation.
- **Dependencies**: Milestone 15.
- **Completion Status**:
  - [x] Completed

### Milestone 17: Content Production Suite
- **Goal**: Transform every generated script into complete production assets.
- **Scope**:
  - Generate: Thumbnail Prompt, Image Prompt, Midjourney Prompt, Flux Prompt, Veo Prompt, Kling Prompt, ElevenLabs Voice Prompt, Shot List, Camera Angles, Scene Breakdown, Captions, Description, SEO Tags, Chapters, Shorts Version, Community Post.
  - Export: PDF, DOCX, Markdown, Google Docs, Notion.
- **Dependencies**: Milestone 16.
- **Completion Status**:
  - [ ] Not Started

### Milestone 18: AI Thumbnail Prompt & Image Generation Foundation
- **Goal**: Extend the Studio Production Suite with robust AI Image Prompt packages and a provider-agnostic preview generation framework.
- **Scope**:
  - Expanded `ThumbnailConcept` metadata (Subject, Composition, Lens, Lighting).
  - Background `Thumbnail Quality Analyzer` with multi-metric Readiness Score (CTR Potential, Face Visibility, Readability, etc.).
  - `AIImageProvider` interface allowing scalable integration of any future image generator.
  - Template saving to Universal Library.
  - Formatted Production Exports (.md, .txt).
- **Dependencies**: Milestone 17.
- **Completion Status**:
  - [x] Completed

### Workspace Reorganization: Creator Studio
- **Goal**: Reorganize the app into a professional 8-module Creator Studio.
- **Scope**:
  - New global nav item "Creator Studio".
  - Flexible 3-panel workspace system (`Left Panel`, `Center Panel`, `Right Panel`).
  - 8 distinct modules: Script Editor, Research, Storyboard, Production, Thumbnail AI, Versions, AI Assistant, Export.
- **Completion Status**:
  - [x] Completed

### Milestone 19 — Creator Studio Stability & Critical Bug Resolution

**Goal**
Make Creator Studio production-ready by eliminating all critical bugs, runtime errors, state synchronization issues, and export formatting problems without changing business logic.

**Scope**
- Permanent Script Loading Fix
- React hydration/state synchronization fixes
- Dashboard → Creator Studio navigation errors
- Local DB fallback reliability
- Storyboard API 500 error investigation and permanent resolution
- Professional DOCX/Markdown/TXT/JSON exports
- Premium formatting
- Script Editor Focus Mode
- Full-screen editor
- Runtime stability
- Zero console errors
- Zero regressions

**Dependencies**
- No breaking changes.
- Existing APIs remain unchanged.
- Existing Studio workflows remain functional.
- Existing database schema remains compatible unless absolutely necessary.
- Existing user projects remain fully compatible.

**Verification Plan**
- Script always loads
- Draft Recovery works
- Export works
- No React warnings
- No console errors
- No hydration issues
- Build passes
- TypeScript passes

**Completion Status**
- [ ] Not Started

---

### Milestone 20 — Intelligence Engine v2

**Goal**
Upgrade the Intelligence workspace into a professional AI Script Director.

**Scope**
- Intent Validation Engine
- Dynamic Tone & Mood Engine
- Universal Script Quality Score
- Documentary Director Mode
- Visual Thinking Engine
- Curiosity Loop Engine
- Callback Engine
- Transition Engine
- Recommendation Engine
- The Intelligence Engine should think like a Writer, Documentary Director, Editor, Narrator, and Viewer before returning analysis.

**Dependencies**
- No breaking changes.
- Existing APIs remain unchanged.
- Existing Studio workflows remain functional.
- Existing database schema remains compatible unless absolutely necessary.
- Existing user projects remain fully compatible.

**Verification Plan**
- All engine modules generate robust responses.
- Build passes
- TypeScript passes

**Completion Status**
- [ ] Not Started

---

### Milestone 21 — Creator Studio AI Builder Completion

**Goal**
Complete every AI-assisted field.

**Scope**
- Every production field should support: ✨ AI Suggest
- Including: Voice Over, Tone, Emotion, Camera, Lens, Lighting, Color Palette, Art Direction, Environment, Motion, Screen Text, Subtitle Style, Timeline, Music, Sound, Editing Notes, AI Prompt, Negative Prompt.
- Upgrade the Prompt Editor: Editable, Full Screen, Copy, Undo, Redo, Syntax Highlighting, Better Editing Experience.
- Prompt quality should match Wizard AI.

**Dependencies**
- No breaking changes.
- Existing APIs remain unchanged.
- Existing Studio workflows remain functional.
- Existing database schema remains compatible unless absolutely necessary.
- Existing user projects remain fully compatible.

**Verification Plan**
- AI generation targets individual fields without overwriting scripts.
- Build passes
- TypeScript passes

**Completion Status**
- [ ] Not Started

---

### Milestone 22 — YouTube Intelligence Dashboard

**Goal**
Transform Dashboard into a professional YouTube Research Workspace.

**Scope**
- **Channel Discovery:** Search by niche. Filters: Subscribers, Views, Total Videos, Upload Frequency, Channel Age, Country, Language, Last Upload.
- **Similar Channel Finder:** Paste any YouTube channel URL. Find highly related channels. Support advanced filters.
- **Outlier Detection:** Automatically detect outlier videos, viral titles, view velocity, performance ratio, outlier score.
- **Reverse Engineering:** Extract Title Psychology, Thumbnail Psychology, Hook Structure, Storytelling Framework, Editing Style, Retention Strategy, CTA Strategy, SEO Pattern, Upload Pattern, Emotional Curve, Viral Formula, Audience Targeting, Repeatable Frameworks.
- Generate a complete Channel Intelligence Report.

**Dependencies**
- No breaking changes.
- Existing APIs remain unchanged.
- Existing Studio workflows remain functional.
- Existing database schema remains compatible unless absolutely necessary.
- Existing user projects remain fully compatible.

**Verification Plan**
- Dashboard queries resolve correctly with no UI regressions.
- Build passes
- TypeScript passes

**Completion Status**
- [ ] Not Started

---

## Progress Tracking

- **Overall Progress**: ~63% Complete
- **Completed Milestones**: 14
- **Remaining Milestones**: 8
- **Planned Milestones**: 22

### Next Recommended Steps
- **Current Focus**: Milestone 19 — Creator Studio Stability & Critical Bug Resolution
- **Next Recommended Milestone**: Proceed with Milestone 19 to stabilize the Creator Studio.
