import { getProviderInstance } from "./ai/registry";
import { getAISettings } from "./ai/settings";
import { logAIRequest } from "./ai/logger";
import { AIRequestOptions } from "./ai/types";
import { aiQueue, AIJobPriority } from "./ai/queue";
import { getCachedResponse, setCachedResponse, generatePromptHash } from "./ai/cache";

const SYSTEM_PROMPT =
  "You are a world-class YouTube growth strategist specializing in faceless channels that generate millions of views. You understand CTR psychology, retention engineering, and viral content structure deeply. You have analyzed thousands of YouTube channels and written hundreds of viral scripts.";

function getFinalSystemPrompt(options: AIRequestOptions): string {
  if (options.systemPrompt) {
    const formatInstruction = options.responseFormat === "json_object"
      ? " CRITICAL: You must return a strict JSON object. Do not wrap it in markdown codeblocks."
      : "";
    return `${options.systemPrompt}${formatInstruction}`;
  }
  const modeInstruction = options.mode === "docs"
    ? "Return a structured markdown report with clear headings (##), bullet points, and sections. Format like a professional document with: Summary, Key Insights, Analysis, Keywords, Strategy, and Final Output sections."
    : "Return plain conversational text only. No markdown headings, no special formatting. Use simple paragraphs and bullet points only where absolutely necessary. Write like you're explaining to a friend.";
  const formatInstruction = options.responseFormat === "json_object"
    ? " CRITICAL: You must return a strict JSON object. Do not wrap it in markdown codeblocks."
    : ` OUTPUT FORMAT RULE: ${modeInstruction}`;
  return `${SYSTEM_PROMPT}\n\n${formatInstruction}`;
}

function getRetryDelay(errorMsg: string, attempt: number): number {
  const isRateLimit = errorMsg.includes("429") || errorMsg.includes("rate limit");
  const isServer = errorMsg.includes("503") || errorMsg.includes("504");
  const isTimeout = errorMsg.includes("Timeout");
  
  if (isRateLimit || isServer || isTimeout) {
    if (attempt === 1) return 500;
    if (attempt === 2) return 1000;
    return 2000;
  }
  return 0;
}

function getTimeoutLimit(providerName: string, modelId: string): number {
  const settings = getAISettings();
  const providerConfig = settings.providers?.[providerName as keyof typeof settings.providers];
  if (providerConfig?.timeout) {
     return providerConfig.timeout;
  }

  const lower = modelId.toLowerCase();
  if (lower.includes("flash") || lower.includes("haiku") || lower.includes("mini") || lower.includes("lite")) {
    return 45000; // Increased for generating long JSON scripts
  }
  if (lower.includes("pro") || lower.includes("gpt-4") || lower.includes("opus") || lower.includes("o1")) {
    return 90000; // Increased for reasoning models
  }
  return 60000;
}

async function tryCandidate(
  candidate: any,
  userPrompt: string,
  options: AIRequestOptions,
  finalSystemPrompt: string,
  isStream: boolean,
  isCacheable: boolean,
  fallbackChain: string[],
  parentAbortSignal?: AbortSignal
): Promise<{ success: boolean; data?: any; error?: any; skipped?: boolean }> {
  const providerName = candidate.provider;
  const modelOverride = candidate.model;
  const apiKey = candidate.apiKey;
  const providerStartTime = Date.now();
  let attempt = 1;
  const maxAttempts = 3;
  const settings = getAISettings();

  const { markSuccess, markFailure, tryAcquireProbe } = await import("./ai/health");

  while (attempt <= maxAttempts) {
    if (parentAbortSignal?.aborted) {
      return { success: false, error: new Error("Aborted by hedged request"), skipped: true };
    }

    try {
      if (!tryAcquireProbe(providerName, modelOverride, apiKey)) {
        return { success: false, error: new Error("Circuit breaker probe acquire failed"), skipped: true };
      }

      const provider = getProviderInstance(providerName);
      const { getModelCapabilities } = await import("./ai/registry");
      const caps = getModelCapabilities(modelOverride);
      
      // Pre-flight capability checks
      if (isStream && !caps.streaming) {
         return { success: false, error: new Error(`Model ${modelOverride} does not support streaming`), skipped: true };
      }
      if (options.responseFormat === "json_object" && !caps.jsonMode) {
         return { success: false, error: new Error(`Model ${modelOverride} does not support JSON mode`), skipped: true };
      }
      
      const controller = new AbortController();
      const timeoutMs = getTimeoutLimit(providerName, modelOverride);
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      parentAbortSignal?.addEventListener("abort", () => controller.abort());

      const requestOptions: AIRequestOptions = {
        ...options,
        modelOverride,
        apiKey,
        systemPrompt: finalSystemPrompt,
        abortSignal: controller.signal,
      };

      let responseData: any;

      if (isStream) {
        if (!provider.streamText) {
          throw new Error(`Provider ${providerName} does not support streaming`);
        }
        responseData = await provider.streamText(userPrompt, requestOptions);
        clearTimeout(timeoutId);
        markSuccess(providerName, modelOverride, apiKey, Date.now() - providerStartTime, 0);
        return { success: true, data: responseData };
      } else {
        responseData = await provider.generateText(userPrompt, requestOptions);
        clearTimeout(timeoutId);
        
        const requestDurationMs = Date.now() - providerStartTime;
        const approxTokens = Math.floor((userPrompt.length + responseData.length) / 4);
        
        markSuccess(providerName, modelOverride, apiKey, requestDurationMs, approxTokens);

        if (isCacheable) {
           const hash = generatePromptHash(userPrompt, { systemPrompt: finalSystemPrompt, temperature: settings.providers?.[providerName as keyof typeof settings.providers]?.temperature, responseFormat: options.responseFormat });
           setCachedResponse(hash, userPrompt, responseData, modelOverride, providerName, approxTokens);
        }

        logAIRequest({
          timestamp: new Date().toISOString(),
          provider: providerName,
          model: modelOverride !== "auto" ? modelOverride : "unknown",
          requestDurationMs,
          retries: attempt - 1,
          success: true,
          fallbackChain: fallbackChain.length > 0 ? fallbackChain : undefined
        });

        return { success: true, data: responseData };
      }
    } catch (error: any) {
      if (parentAbortSignal?.aborted || error.name === 'AbortError' && !error.message?.includes('Timeout')) {
        return { success: false, error: new Error("Aborted"), skipped: true };
      }

      const errorMsg = error.message || String(error);
      const isTimeout = error.name === 'AbortError' || errorMsg.includes("Timeout");
      const isRateLimit = errorMsg.includes("429");
      const isQuotaExhausted = errorMsg.includes("QUOTA_EXHAUSTED") || errorMsg.includes("PAYMENT_REQUIRED") || error.reason === "PAYMENT_REQUIRED" || errorMsg.includes("Billing") || errorMsg.includes("credit");
      
      markFailure(providerName, modelOverride, apiKey, isTimeout, isRateLimit, isQuotaExhausted);
      
      const delay = getRetryDelay(errorMsg, attempt);
      if (delay > 0 && attempt < maxAttempts) {
         console.warn(`[AI] ${providerName}:${modelOverride} failed: ${errorMsg}. Retrying in ${delay}ms...`);
         await new Promise(resolve => setTimeout(resolve, delay));
         attempt++;
      } else {
         const requestDurationMs = Date.now() - providerStartTime;
         logAIRequest({
           timestamp: new Date().toISOString(),
           provider: providerName,
           model: modelOverride !== "auto" ? modelOverride : "unknown",
           requestDurationMs,
           retries: attempt - 1,
           success: false,
           error: errorMsg,
           fallbackChain: fallbackChain.length > 0 ? fallbackChain : undefined
         });
         
         console.warn(`[AI] ${providerName}:${modelOverride} failed fatally: ${errorMsg}. Falling back.`);
         fallbackChain.push(`${providerName}:${modelOverride}`);
         return { success: false, error };
      }
    }
  }
  return { success: false, error: new Error("Max attempts exceeded") };
}

const inflightRequests = new Map<string, Promise<any>>();

async function executeAIRequestInternal(userPrompt: string, options: AIRequestOptions, isStream: boolean): Promise<any> {
  const finalSystemPrompt = getFinalSystemPrompt(options);
  const settings = getAISettings();
  const { getSmartRoutingChain } = await import("./ai/router");
  
  const isCacheable = !isStream && options.mode === "docs"; 
  
  if (isCacheable) {
    const hash = generatePromptHash(userPrompt, { systemPrompt: finalSystemPrompt, temperature: settings.providers?.[(settings.activeProvider || "gemini") as keyof typeof settings.providers]?.temperature, responseFormat: options.responseFormat });
    const cached = getCachedResponse(hash);
    if (cached) {
      logAIRequest({
        timestamp: new Date().toISOString(),
        provider: "cache",
        model: "cache",
        requestDurationMs: 0,
        retries: 0,
        success: true
      });
      import("./ai/analytics").then(m => m.trackCacheHit());
      return cached.response;
    }
  }

  const chain = await getSmartRoutingChain(options.featureKey);
  let lastError: Error | null = null;
  const fallbackChain: string[] = [];

  if (chain.length === 0) {
    chain.push({ provider: settings.activeProvider || "gemini", model: "auto", apiKey: "" });
  }

  const useHedgedRequests = options.latencySensitive === true;
  const hedgeDelayMs = 2000;

  // Fire and forget background benchmark (throttled internally)
  import("./ai/benchmark").then(m => m.runBackgroundBenchmark().catch(console.error));

  if (useHedgedRequests) {
    let resolved = false;
    let finalData: any = null;
    let globalError: Error | null = null;
    const controllers: AbortController[] = [];
    let completedCount = 0;

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < chain.length; i++) {
      if (resolved) break;
      
      const candidate = chain[i];
      const controller = new AbortController();
      controllers.push(controller);

      tryCandidate(candidate, userPrompt, options, finalSystemPrompt, isStream, isCacheable, fallbackChain, controller.signal)
        .then((result) => {
          completedCount++;
          if (result.success && !resolved) {
            resolved = true;
            finalData = result.data;
            controllers.forEach(c => c.abort()); // Cancel all other inflight
          } else if (!result.success && !result.skipped) {
            globalError = result.error;
          }
        })
        .catch(e => { 
          completedCount++;
          if (!resolved) globalError = e; 
        });

      let elapsed = 0;
      while (elapsed < hedgeDelayMs && !resolved) {
        await sleep(100);
        elapsed += 100;
      }
    }

    // Wait for resolution if all candidates launched but still pending
    while (!resolved && completedCount < chain.length) {
      await sleep(100);
    }

    if (resolved) {
      return finalData;
    } else {
      throw globalError || new Error("All AI providers failed or were aborted.");
    }
  } else {
    // Sequential fallback
    for (const candidate of chain) {
      const result = await tryCandidate(candidate, userPrompt, options, finalSystemPrompt, isStream, isCacheable, fallbackChain);
      if (result.success) {
        return result.data;
      } else if (!result.skipped) {
        lastError = result.error;
      }
    }
    console.error(`[AI] Complete failure after ${fallbackChain.length} model attempts.`);
    throw lastError || new Error("All AI providers and models failed.");
  }
}

async function executeAIRequest(userPrompt: string, options: AIRequestOptions, isStream: boolean): Promise<any> {
  const isCacheable = !isStream && options.mode === "docs";
  if (!isCacheable) {
    return executeAIRequestInternal(userPrompt, options, isStream);
  }

  // Deduplication hashing
  const hashKey = `${options.modelOverride || "auto"}:${options.featureKey || "default"}:${userPrompt.length}:${userPrompt.substring(0, 50)}`;
  if (inflightRequests.has(hashKey)) {
    return inflightRequests.get(hashKey)!;
  }

  const promise = executeAIRequestInternal(userPrompt, options, isStream);
  inflightRequests.set(hashKey, promise);
  try {
    return await promise;
  } finally {
    inflightRequests.delete(hashKey);
  }
}

export async function callAI(userPrompt: string, outputModeOrOptions: "docs" | "text" | AIRequestOptions): Promise<string> {
  const options: AIRequestOptions = typeof outputModeOrOptions === "string" 
    ? { mode: outputModeOrOptions } 
    : outputModeOrOptions;
    
  return aiQueue.enqueue(AIJobPriority.CRITICAL, () => executeAIRequest(userPrompt, options, false), { abortSignal: options.abortSignal, isStream: false, featureKey: options.featureKey });
}

export async function streamAI(userPrompt: string, options: AIRequestOptions = {}): Promise<any> {
  return aiQueue.enqueue(AIJobPriority.INTERACTIVE, () => executeAIRequest(userPrompt, options, true), { abortSignal: options.abortSignal, isStream: true, featureKey: options.featureKey });
}
