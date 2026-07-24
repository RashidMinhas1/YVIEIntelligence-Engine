# AI Provider Migration Plan

## 7. Provider Abstraction Plan

To support multiple AI providers (OpenAI, Gemini, OpenRouter, and future models like Claude or local Ollama) without changing the core application logic, the architecture must transition to a **Strategy Pattern** via a unified Abstraction Layer.

### Proposed Architecture

1. **The Interface (`AIProvider`)**
   Define a strict contract that all providers must follow.
   ```typescript
   export interface AIProvider {
     generateText(prompt: string, options: { mode: "docs" | "text" }): Promise<string>;
   }
   ```

2. **Concrete Implementations**
   Create individual classes/modules for each provider that handle SDK initialization and API mapping internally.
   - `OpenAIProvider`
   - `GeminiProvider`
   - `OpenRouterProvider`

3. **Provider Factory**
   A factory method determines which provider to instantiate based on environment variables.
   ```typescript
   export function getAIProvider(): AIProvider {
     const providerName = process.env.ACTIVE_AI_PROVIDER || "openai";
     
     switch(providerName) {
       case "gemini": return new GeminiProvider();
       case "openrouter": return new OpenRouterProvider();
       case "openai":
       default: return new OpenAIProvider();
     }
   }
   ```

4. **Refactoring `callAI`**
   The existing `callAI` wrapper in `src/lib/ai.ts` will simply act as a delegate.
   ```typescript
   export async function callAI(userPrompt: string, outputMode: "docs" | "text"): Promise<string> {
     return await getAIProvider().generateText(userPrompt, { mode: outputMode });
   }
   ```

By using this architecture, adding "Claude" in the future requires only creating `ClaudeProvider` and adding one line to the switch statement. No API routes will need modification.

---

## 8. Migration Risk Analysis

### Files Requiring Modification

| File Path | Modification Required | Estimated Complexity |
|-----------|-----------------------|----------------------|
| `src/lib/ai.ts` | Complete refactor to implement the Provider factory and interface. | Medium |
| `src/lib/providers/` | Create directory and new files for specific provider logic. | Low |
| `package.json` | Install new SDKs (e.g., `@google/generative-ai`). | Low |
| `.env.example` | Document new keys (`GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `ACTIVE_AI_PROVIDER`). | Low |

### Identified Breaking Points

1. **Output Formatting Consistency (High Risk):** 
   Different LLMs have different syntax quirks. For example, `api/titles/generate/route.ts` uses strict Regex (`/^\d+[.)]\s/`) to extract numbered titles from the AI response. If Gemini formats a list slightly differently than OpenAI, the API will crash or return an empty array.
2. **Context Window Limitations (Medium Risk):**
   Providing entire competitor scripts to smaller models might exceed their token limits, causing 400 Bad Request errors.
3. **Response Timeouts (Medium Risk):**
   Some providers (like local models or congested OpenRouter endpoints) take significantly longer to respond, potentially triggering Next.js serverless function timeouts.

### Safest Migration Order

To guarantee 100% preservation of existing functionality during the migration, the following order must be strictly followed:

1. **Step 1: Structural Refactoring**
   - Create the `AIProvider` interface.
   - Move the existing OpenAI implementation into an `OpenAIProvider` class.
   - Update `callAI` to use the factory pattern hardcoded to OpenAI.
   - *Validation*: Verify the app works exactly as before.

2. **Step 2: Configuration & Environment Setup**
   - Introduce `ACTIVE_AI_PROVIDER` to `.env`.
   - Update the factory to read from the environment variable.

3. **Step 3: New Provider Implementations**
   - Install SDKs and build `GeminiProvider` and `OpenRouterProvider`.
   - *Validation*: Run prompt integration tests specifically analyzing the Regex parsing compatibility.

4. **Step 4: Centralize Prompts (Optional but Recommended)**
   - Move the hardcoded System prompt and Mode instructions out of the AI layer and into `prompts.ts` to ensure all providers receive identical context.
