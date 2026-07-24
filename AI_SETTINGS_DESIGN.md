# AI Settings Module Design

## 1. Overview
The AI Settings module allows users to dynamically configure their AI preferences directly from the UI, removing the need to edit `.env` files locally. It supports selecting the active provider, entering API keys, securely storing them, and validating connections before saving.

## 2. User Interface (UI) Design
**Location**: `/settings/ai` (or a dedicated tab in a global `/settings` page)

**Components**:
- **Active Provider Dropdown**: Select between `OpenAI`, `Gemini`, and `OpenRouter` (Coming Soon).
- **API Key Input Field**: A password-masked input field for the selected provider.
- **Save Configuration Button**: Persists the changes.
- **Test Connection Button**: Pings the selected provider to verify key validity.
- **Clear API Key Button**: Securely removes the key from the database.
- **Status Indicator**: Displays current connection status (e.g., `Connected`, `Invalid Key`, `Not Configured`).

**Flow**:
1. User navigates to the Settings page.
2. The UI fetches the current active provider and checks if a key exists (it will not return the actual key, only a boolean `isConfigured`).
3. User selects a provider and enters a new key.
4. User clicks "Test Connection". The frontend calls `/api/settings/ai/test` with the temporary key.
5. If successful, user clicks "Save Settings" which posts to `/api/settings/ai`.

## 3. Database Schema
To support future multi-user capabilities, the settings must be tied to a `user_id`. For the current single-tenant local version, we can default to a dummy `user_id` or `system`.

**New Table**: `user_settings` (or `ai_settings`)
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const aiSettingsTable = pgTable("ai_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(), // Unique for 1:1 mapping
  activeProvider: text("active_provider").notNull().default("openai"),
  openaiApiKey: text("openai_api_key"),
  geminiApiKey: text("gemini_api_key"),
  openrouterApiKey: text("openrouter_api_key"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## 4. Encryption Strategy
Storing raw API keys in the database is a massive security risk. 
- **Encryption**: Keys will be symmetrically encrypted before insertion using AES-256-GCM.
- **Master Key**: A single `ENCRYPTION_KEY` environment variable will be required in `.env.local` to encrypt/decrypt the payload.
- **Decryption**: Keys are only decrypted in memory during the execution of an API route that invokes `callAI()`.

## 5. Backend Flow
**1. `GET /api/settings/ai`**
- Retrieves the current user's settings.
- Returns the `activeProvider` and boolean flags for which keys are configured (e.g., `hasOpenAIKey: true`, `hasGeminiKey: false`).
- **Crucial**: Never returns the decrypted string to the frontend.

**2. `POST /api/settings/ai`**
- Accepts `{ activeProvider, apiKey?, providerToUpdate? }`.
- Encrypts the `apiKey` using the `ENCRYPTION_KEY`.
- Upserts the `ai_settings` table for the current user.

**3. `POST /api/settings/ai/test`**
- Accepts `{ provider, apiKey }`.
- Does NOT save the key.
- Temporarily instantiates the requested `AIProvider` using the provided key.
- Executes a minimal prompt (e.g., `"Respond with the word 'OK'."`) with `maxTokens: 5`.
- Returns `{ success: true }` or `{ error: "Invalid API Key" }`.

**4. `AI Provider Factory Refactor`**
- `src/lib/ai/config.ts` currently reads from `process.env`.
- Refactor the factory to dynamically fetch the decrypted API key and `activeProvider` from the database at runtime.
- Fallback to `.env` variables if the database has no overrides (preserves local development ease).

## 6. Validation & Error Handling
**Validation (Zod)**:
- Ensure the selected provider matches the exact union `enum(["openai", "gemini", "openrouter"])`.
- Ensure API key strings are within reasonable length limits and formatting (e.g., OpenAI starts with `sk-`, Gemini has specific formats).

**Error Handling**:
- If `ENCRYPTION_KEY` is missing in production, throw a fatal error on app boot.
- If decryption fails (e.g., `ENCRYPTION_KEY` changed), securely wipe the corrupted key and prompt the user to re-enter it.
- If the AI request fails due to a revoked key, `AIProviderError` will be caught and surface a clean "API Key is Invalid or Revoked" message to the client.

## 7. Future Multi-User Support
- The schema is designed with a `userId` column. 
- When NextAuth / Clerk is implemented in the future, the backend will extract the `userId` from the authenticated session context rather than using a hardcoded `"system"` ID.
- The encryption strategy securely isolates keys per user, assuming the global master key remains secure. (For enterprise-grade multi-tenant, an envelope encryption strategy with AWS KMS/Google Cloud KMS could be adopted later).

---
### Review Required
Please review this design and provide feedback or approval before I begin the implementation phase.
