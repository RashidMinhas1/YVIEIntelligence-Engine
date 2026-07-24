# AI Settings Backend Summary

## Architecture Overview
The AI Settings module manages dynamic API keys, base URLs, and model overrides for different providers without requiring a server restart or modifying `.env.local`.

### 1. Storage Mechanism
- **File System Persistence**: For local development, settings are persisted to a local file `.ai-settings.json` at the root directory (`src/lib/ai/settings.ts`).
- **Scalability**: The implementation isolates the configuration logic so that it can be easily replaced with a database store (like a `settings` table) in the future, without affecting the frontend.

### 2. Provider Abstraction
The backend leverages the unified AI Provider Foundation implemented in Milestone 4. Supported providers include:
- OpenAI
- Gemini
- OpenRouter

Each provider uses fallback logic: it first attempts to load overrides from `.ai-settings.json`. If no override exists, it safely falls back to standard `.env.local` defaults.

### 3. Validation Layer
Strict `zod` schemas were introduced in `src/lib/validators.ts`:
- `AIProviderConfigSchema`: Validates `apiKey`, `baseUrl` (must be a valid URL or empty), and `model`.
- `AISettingsSchema`: Validates the overall payload structure when saving.
- `AITestConnectionSchema`: Validates incoming connection test requests.

These schemas prevent malformed configurations from being written to disk.

### 4. API Endpoints
- **GET `/api/settings/ai`**: Loads current `.ai-settings.json` configuration.
- **POST `/api/settings/ai`**: Validates the payload using `AISettingsSchema` and writes the configuration. Returns a 400 Bad Request on validation failure.
- **POST `/api/settings/ai/test`**: Validates the payload using `AITestConnectionSchema`, initializes a lightweight client, and executes a minimum token test ("Reply OK"). Returns explicit error messages if the client initialization or completion request fails.
