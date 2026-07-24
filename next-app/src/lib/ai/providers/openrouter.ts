import OpenAI from "openai";
import { AIProvider, AIRequestOptions } from "../types";
import { AIProviderError, AIErrorReason } from "../errors";
import { withRetry, createTimeoutSignal } from "../utils";
import { getAISettings } from "../settings";

export class OpenRouterProvider implements AIProvider {
  private getClient(overrideApiKey?: string): OpenAI {
    const settings = getAISettings().providers?.openrouter;
    const apiKey = overrideApiKey || settings?.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new AIProviderError("OpenRouter API key is not configured", "openrouter", "INVALID_API_KEY");
    }

    return new OpenAI({
      apiKey,
      baseURL: settings?.baseUrl || process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "YouTube Viral Intelligence Engine",
      },
      dangerouslyAllowBrowser: true
    });
  }

  private mapErrorReason(error: any): AIErrorReason {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401 || error.status === 403) return "INVALID_API_KEY";
      if (error.status === 402) return "PAYMENT_REQUIRED";
      if (error.status === 404) return "MODEL_NOT_FOUND";
      if (error.status === 429) return "RATE_LIMIT";
      if (error.status === 400) return "INVALID_REQUEST";
      if (error.status && error.status >= 500) return "INTERNAL_ERROR";
    }
    if (error.name === "AbortError" || error.name === "TimeoutError") return "TIMEOUT";
    if (error.type === "system") return "NETWORK_ERROR";
    return "UNKNOWN";
  }

  async generateText(prompt: string, options: AIRequestOptions): Promise<string> {
    const client = this.getClient(options.apiKey);
    const settings = getAISettings().providers?.openrouter;
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (settings?.model || process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash");

    try {
      const response = await client.chat.completions.create({
        model: targetModel,
        messages: [
          { role: "system", content: options.systemPrompt || "" },
          { role: "user", content: prompt }
        ],
        temperature: settings?.temperature ?? 0.7,
        max_tokens: options.maxTokens || settings?.maxTokens,
        response_format: options.responseFormat === "json_object" ? { type: "json_object" } : undefined
      }, { signal: options.abortSignal });

      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      throw new AIProviderError(error.message, "openrouter", this.mapErrorReason(error));
    }
  }

  async streamText(prompt: string, options: AIRequestOptions): Promise<any> {
    const client = this.getClient(options.apiKey);
    const settings = getAISettings().providers?.openrouter;
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (settings?.model || process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash");

    try {
      return await client.chat.completions.create({
        model: targetModel,
        messages: [
          { role: "system", content: options.systemPrompt || "" },
          { role: "user", content: prompt }
        ],
        temperature: settings?.temperature ?? 0.7,
        max_tokens: options.maxTokens || settings?.maxTokens,
        response_format: options.responseFormat === "json_object" ? { type: "json_object" } : undefined,
        stream: true
      }, { signal: options.abortSignal });
    } catch (error: any) {
      throw new AIProviderError(error.message, "openrouter", this.mapErrorReason(error));
    }
  }
}
