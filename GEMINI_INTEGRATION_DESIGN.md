# Gemini Provider Integration Design

## 1. Response Normalization

To ensure that the rest of the application (e.g., API routes, parsers) remains completely unaware of which provider is fulfilling the request, the `AIProvider` interface expects a `Promise<string>`.

**Implementation Strategy:**
- **OpenAI:** Extracts `response.choices[0]?.message?.content`.
- **Gemini:** Extracts `response.text()` from the `GenerateContentResponse`.
- **Normalization:** Every provider implementation will aggressively fall back to a safe empty state (e.g., `"No response generated."`) rather than returning `undefined` or throwing unhandled TypeError exceptions if the nested response object is missing.

---

## 2. Error Normalization

Each SDK throws proprietary error objects. We will expand the existing `AIProviderError` class to support a standardized `reason` or `code` property.

**Mapping Strategy for Gemini (and future providers):**

| Unified Error Condition | Gemini Trigger | OpenAI Trigger |
|-------------------------|----------------|----------------|
| **Invalid API Key** | `400 Bad Request` with API key payload / `403 Forbidden` | `401 Unauthorized` |
| **Rate Limit** | `429 Too Many Requests` | `429 Too Many Requests` |
| **Timeout** | `AbortError` | `AbortError` / `Timeout` |
| **Network Error** | `FetchError` / `502`, `503`, `504` | `APIConnectionError` / `50x` |
| **Invalid Request** | `400 Bad Request` | `400 Bad Request` |
| **Empty Response** | Response object is empty | `choices.length === 0` |
| **Provider Internal Error** | `500 Internal Server Error` | `500 Internal Server Error` |
| **Safety Filter Block** | `FinishReason.SAFETY` / `FinishReason.BLOCKLIST` | `FinishReason.CONTENT_FILTER` |
| **Malformed JSON** | Invalid structure passed to API | Invalid JSON payload |

---

## 3. Retry Strategy

Because AI APIs are inherently flaky, all providers will share a unified retry wrapper.

- **Eligible for Retry:** Rate Limit (`429`), Timeout, Network Error (`502`, `503`, `504`), Provider Internal Error (`500`).
- **Never Retry:** Invalid API Key (`401`, `403`), Invalid Request (`400`), Safety Filter Block (`SAFETY`).
- **Maximum Retry Count:** 3 attempts.
- **Backoff Strategy:** Exponential Backoff (e.g., `Wait time = 2^attempt * 1000ms`, with a randomized jitter of ±500ms to prevent thundering herd problems).

---

## 4. Timeout Strategy

Currently, `callAI` awaits indefinitely, which risks triggering Vercel/Next.js 60-second function timeouts without a graceful fallback.

**Design:**
- Both OpenAI and Gemini support native `AbortSignal` parameters in their SDK fetch configs.
- The `AIProvider` interface will implement a standard 45-second `AbortSignal.timeout(45000)`.
- If the 45-second threshold is breached, an `AIProviderError` with the type `TIMEOUT` is thrown, caught by the retry logic (if eligible), or bubbled up to the frontend for a clean UI error message.

---

## 5. Prompt Compatibility

**System Prompt Injection:**
- **OpenAI** uses `messages: [{ role: "system" }, { role: "user" }]`.
- **Gemini** uses `systemInstruction` in the model instantiation (in the latest `@google/generative-ai` SDK). Older payload patterns forced appending the system prompt to the first user message. We will use the `systemInstruction` natively.

**Normalization Recommendation:**
The content of the prompts (`SYSTEM_PROMPT` in `ai.ts` and `build*Prompt` in `prompts.ts`) is fully compatible. No text content changes are required.

---

## 6. Output Compatibility

**Formatting Quirks & Parsing Risks:**
- The application relies heavily on Regex `/^\d+[.)]\s/` in `/api/titles/generate` to parse lists.
- **Risk:** Gemini often hallucinates extra markdown, such as wrapping lists in bold tags (`**1.** Title`). Our regex does account for `.` and `)` but extra asterisks could break it.
- **Mitigation:** The provider abstraction will not touch the application's parsing logic. Instead, if Gemini begins failing to parse, we will append a strict formatting rule to the Gemini developer prompt during implementation (e.g., *"Do not use markdown bolding on list numbers"*).

**Max Tokens:**
- Script generation (targeting ~1300 words) can easily exceed the hardcoded `max_tokens: 2000` limit.
- **Mitigation:** We will raise the normalized configuration to `maxTokens: 4000` (or `maxOutputTokens` for Gemini) across all providers.

---

## 7. Provider Configuration (Gemini Specifics)

To instantiate `GeminiProvider`, the following configuration will be used:

- **API Key:** `process.env.GEMINI_API_KEY`
- **Model Selection:** `gemini-1.5-flash` (Fast, cost-effective, directly competitive with `gpt-4o-mini`).
- **Max Output Tokens:** `4000`
- **Safety Settings:** 
  Gemini is notorious for false-positive safety flags on completely benign content (like "viral growth strategies"). We will configure `HarmCategory` settings to `BlockThreshold.BLOCK_NONE` or `BLOCK_ONLY_HIGH` for Harassment, Hate Speech, Sexually Explicit, and Dangerous Content.

---

## 8. Provider Health Check Design

To ensure reliable operations without wasting tokens or causing unnecessary latency, we will introduce a `testConnection()` method to the `AIProvider` interface.

**Implementation Flow:**
1. **API Route:** A new diagnostic route `/api/settings/health-check` is created.
2. **Provider Method:** `getAIProvider().testConnection()` is invoked.
3. **Validation Payload:** The provider fires a minimum-token request (e.g., prompt: "ping", `max_tokens: 1`) or queries a specific native `/models` endpoint if available (e.g., OpenAI's `/v1/models`).
4. **Metrics Gathered:**
   - **API Key Validity:** Confirmed by a successful HTTP 200 response.
   - **Model Availability:** Confirmed if the specific model string (e.g., `gemini-1.5-flash`) resolves successfully.
   - **Network Connectivity:** Validated natively.
   - **Response Time:** Measured wrapping the call in `performance.now()` to benchmark latency.

---

## 9. Future Versioning Strategy

To maintain backward compatibility while supporting the rapid release cycle of AI models:

**1. Configuration-Driven Model Selection:**
Models will not be hardcoded in the provider files. They will be resolved via `.env.local` (e.g., `GEMINI_MODEL=gemini-1.5-pro`). When Google releases `gemini-2.0`, updating the application simply requires updating the environment variable.

**2. Adding New Providers:**
Adding a new provider (e.g., Claude) requires zero changes to existing business logic. A developer simply creates `src/lib/ai/providers/claude.ts` implementing `AIProvider` and maps the string "claude" to it in `src/lib/ai/registry.ts`.

**3. Deprecation Guidance:**
If an older model or provider SDK is being sunset:
- Keep the legacy provider registered in `registry.ts`.
- Inject a `console.warn` upon initialization noting the deprecation timeline.
- Gracefully map the legacy model string to its successor directly inside the provider implementation as a fallback (e.g., mapping `gpt-3.5-turbo` requests implicitly to `gpt-4o-mini`).
