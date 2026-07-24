# AI & Backend Architecture Audit

## 1. AI Architecture

AI is heavily utilized throughout the application to automate YouTube strategy tasks. All AI calls pass through a centralized wrapper function.

### AI Features Summary

| Feature | API Route | Core Function | Input | Output | Model | Streaming |
|---------|-----------|---------------|-------|--------|-------|-----------|
| Title Analysis | `/api/titles/analyze` | `callAI()` | Formatted list of titles & custom prompt | Markdown analysis string | `gpt-4o-mini` | No |
| Title Generation | `/api/titles/generate` | `callAI()` | Analysis context & niche | Plain text (Parsed into JSON array) | `gpt-4o-mini` | No |
| Script Analysis | `/api/scripts/analyze` | `callAI()` | Full script & metadata | Markdown analysis string | `gpt-4o-mini` | No |
| Script Generation | `/api/scripts/generate` | `callAI()` | Title & Script Analysis | Plain text script | `gpt-4o-mini` | No |

**File Path for Wrapper:** `src/lib/ai.ts`
**JSON Schema:** None directly enforced via OpenAI `response_format`. The application relies on prompt engineering and regex to parse specific structures (e.g., `api/titles/generate/route.ts` parses numbered lists manually).
**Error Handling:** Throws synchronous errors if API key is missing. No explicit catch blocks in the wrapper for API timeouts.

---

## 2. Prompt System

Prompts are currently split between the wrapper layer and a dedicated prompt generation library.

### Prompt Classifications

1. **System Prompt** (`src/lib/ai.ts`):
   - *Static*: Defines the AI persona ("world-class YouTube growth strategist").
2. **Developer Prompts** (`src/lib/ai.ts`):
   - *Dynamic/Instructional*: The `outputMode` variable appends formatting rules (either structured markdown `docs` or plain text `text`).
3. **Dynamic Prompts** (`src/lib/prompts.ts`):
   - Contains 4 builder functions (`buildTitleAnalysisPrompt`, `buildTitleGeneratePrompt`, `buildScriptAnalysisPrompt`, `buildScriptGeneratePrompt`) that interpolate variables.
4. **User Prompts** (`src/lib/prompts.ts`):
   - Custom instructions passed from the frontend (e.g., `customGeneratePrompt`) are embedded directly into the dynamic prompt string.

**Recommendation:**
Prompts should be entirely decoupled from `src/lib/ai.ts`. The System Prompt and Developer Formatting Prompts should be moved into `src/lib/prompts.ts` to ensure the AI wrapper is agnostic to the domain logic.

---

## 3. OpenAI Usage

OpenAI is implemented using the official `openai` Node SDK (`^4.104.0`).

- **Initialization File:** `src/lib/ai.ts`
- **Client Creation:** Uses a singleton pattern (`let client: OpenAI | null`).
- **Model Configuration:** Hardcoded to `gpt-4o-mini`.
- **Base URL Overrides:** Supports custom base URLs via `AI_INTEGRATIONS_OPENAI_BASE_URL` (useful for proxies).
- **Temperature:** Default (Not explicitly set).
- **Max Tokens:** Hardcoded to `2000`.
- **Response Format:** Standard text (`chat.completions.create`).
- **Retry Logic:** None implemented.
- **Timeout Handling:** None implemented.

---

## 4. API Flow

1. **User Action:** User clicks "Analyze" or "Generate" in a Wizard step component.
2. **Frontend Component:** React Query / fetch calls the specific Next.js App Router API route.
3. **API Route:** Validates the request body using Zod (`@/lib/validators`).
4. **Service Layer:** Calls a builder in `src/lib/prompts.ts` to construct the prompt string.
5. **AI Wrapper:** Calls `callAI(prompt, mode)` in `src/lib/ai.ts`.
6. **OpenAI:** Makes the HTTP request to the OpenAI REST API.
7. **Response Processing:** The API Route parses the returned string (e.g., extracting title arrays via regex) and structures it into JSON.
8. **Frontend UI:** Receives JSON and updates the React state.

---

## 5. Database Usage

The application uses **PostgreSQL** connected via **Drizzle ORM**.

- **Connection Setup:** `src/db/index.ts` uses the `postgres` driver.
- **Schema Location:** `src/db/schema/`
- **Tables (8 Total):**
  1. `videosTable` (YouTube video metadata cache)
  2. `titleAnalysesTable`
  3. `scriptAnalysesTable`
  4. `generatedScriptsTable`
  5. `conversationsTable`
  6. `messagesTable`
  7. `titleFormatsTable`
  8. `videoIdeasTable`
- **Operations:** Read/Write operations are intended to be executed from API routes using the `getDb()` factory.

---

## 6. Supabase Usage

Supabase usage in this application is **strictly for PostgreSQL hosting (Transaction Pooler)**.

- **PostgreSQL:** Used as the primary data store via `DATABASE_URL` (`aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`).
- **Authentication:** NOT used for app authentication. The app uses a custom global `PASSWORD` environment variable to protect routes.
- **Storage/Realtime/Edge:** Not utilized. There is an unused initialization file (`lib/supabase.ts`) and a test route (`api/test-supabase`), but they are not integrated into the core workflow.
