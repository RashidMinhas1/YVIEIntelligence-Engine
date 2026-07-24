import { AIProvider, AIRequestOptions } from "./types";
import { getActiveProviderName } from "./config";
import { getProviderInstance } from "./registry";
import { getSmartRoutingChain } from "./router";
import { markSuccess, markFailure } from "./health";
import { AIProviderError } from "./errors";

class SmartRoutingProvider implements AIProvider {
  async generateText(prompt: string, options: AIRequestOptions = {}): Promise<string> {
    const chain = await getSmartRoutingChain(options.featureKey);
    let lastError: Error | null = null;
    
    // If router chain is empty, fallback to default behavior
    if (!chain || chain.length === 0) {
      const name = getActiveProviderName();
      return getProviderInstance(name).generateText(prompt, options);
    }

    // Try candidates in order
    for (const candidate of chain) {
      const startMs = Date.now();
      try {
        const provider = getProviderInstance(candidate.provider);
        const res = await provider.generateText(prompt, {
          ...options,
          modelOverride: candidate.model,
          apiKey: candidate.apiKey // Pass the specific key we want to use
        });
        
        markSuccess(candidate.provider, candidate.model, candidate.apiKey, Date.now() - startMs, 0); // Need to estimate tokens later
        return res;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Router] Candidate failed: ${candidate.provider}:${candidate.model}. Reason: ${err.message}`);
        
        const isRateLimit = err instanceof AIProviderError && err.reason === "RATE_LIMIT";
        const isAuthError = err instanceof AIProviderError && err.reason === "INVALID_API_KEY";
        
        markFailure(candidate.provider, candidate.model, candidate.apiKey, err instanceof AIProviderError && err.reason === "TIMEOUT", isRateLimit);
        
        // If it's a critical non-retryable error for this request structure, maybe abort, but normally we failover
      }
    }
    
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  async streamText(prompt: string, options: AIRequestOptions = {}): Promise<any> {
    const chain = await getSmartRoutingChain(options.featureKey);
    let lastError: Error | null = null;
    
    if (!chain || chain.length === 0) {
      const name = getActiveProviderName();
      const provider = getProviderInstance(name);
      if (!provider.streamText) throw new Error("Provider does not support streaming");
      return provider.streamText(prompt, options);
    }

    for (const candidate of chain) {
      const startMs = Date.now();
      try {
        const provider = getProviderInstance(candidate.provider);
        if (!provider.streamText) throw new Error("Provider does not support streaming");
        const res = await provider.streamText!(prompt, {
          ...options,
          modelOverride: candidate.model,
          apiKey: candidate.apiKey
        });
        
        // Cannot record success easily here because it's a stream, assume success if connection opened
        markSuccess(candidate.provider, candidate.model, candidate.apiKey, Date.now() - startMs, 0); 
        return res;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Router] Stream candidate failed: ${candidate.provider}:${candidate.model}. Reason: ${err.message}`);
        
        const isRateLimit = err instanceof AIProviderError && err.reason === "RATE_LIMIT";
        markFailure(candidate.provider, candidate.model, candidate.apiKey, err instanceof AIProviderError && err.reason === "TIMEOUT", isRateLimit);
      }
    }
    
    throw new Error(`All AI stream providers failed. Last error: ${lastError?.message}`);
  }
}

export function getAIProvider(): AIProvider {
  return new SmartRoutingProvider();
}
