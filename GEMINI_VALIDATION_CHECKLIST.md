# Gemini Validation Checklist

Before marking the Gemini Provider Integration as complete, the following checks must pass to ensure 100% backward compatibility and stability from the application's perspective.

## 1. Setup & Environment
- [ ] `GEMINI_API_KEY` is documented in `.env.example`.
- [ ] `ACTIVE_AI_PROVIDER=gemini` correctly triggers the `GeminiProvider` via the Factory.
- [ ] The `@google/generative-ai` SDK is properly installed and builds successfully.

## 2. Response Normalization Verification
- [ ] The provider successfully returns a standard `Promise<string>`.
- [ ] Empty or malformed responses from Google's API are caught and return a fallback string, preventing unhandled runtime TypeErrors.

## 3. Error & Retry Logic Verification
- [ ] **Invalid API Key:** Passing an invalid Gemini key throws an `AIProviderError` with the reason `Invalid API Key`, mirroring the OpenAI error behavior.
- [ ] **Timeout:** A simulated delayed response triggers the 45-second timeout and bubbles up correctly.
- [ ] **Safety Block:** If Gemini blocks a response due to safety filters, the application throws a graceful error rather than crashing the API route.
- [ ] **Retry Execution:** Simulating a 429 Rate Limit proves that the exponential backoff logic triggers up to 3 times before failing.

## 4. Workflow / Output Compatibility Verification
- [ ] **Title Analysis (`/api/titles/analyze`):** Gemini successfully returns structured markdown `(docs mode)`.
- [ ] **Title Generation (`/api/titles/generate`):** Gemini returns 5 titles. The API route's existing Regex successfully parses Gemini's numbered list into a JSON array without modification.
- [ ] **Script Analysis (`/api/scripts/analyze`):** Gemini successfully parses the long context window and outputs the expected Markdown.
- [ ] **Script Generation (`/api/scripts/generate`):** Gemini successfully outputs a plain-text voiceover script `(text mode)` exceeding 1000 words without hitting Max Token limitations.

## 5. End-to-End Regression Test
- [ ] Switch `ACTIVE_AI_PROVIDER` back to `openai`. Ensure the OpenAI provider still passes all of the above tests with the new unified retry and timeout wrappers in place.
