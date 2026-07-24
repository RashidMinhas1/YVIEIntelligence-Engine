import OpenAI from "openai";
import { AIProvider, AIRequestOptions } from "../types";
import { AIProviderError, AIErrorReason } from "../errors";
import { withRetry, createTimeoutSignal } from "../utils";
import { getAISettings } from "../settings";

export class OpenAIProvider implements AIProvider {
  private getClient(overrideApiKey?: string): OpenAI {
    const settings = getAISettings().providers?.openai;
    const apiKey = overrideApiKey || settings?.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AIProviderError("OpenAI API key is not configured", "openai", "INVALID_API_KEY");
    }

    return new OpenAI({
      apiKey,
      baseURL: settings?.baseUrl || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1",
      dangerouslyAllowBrowser: true // For client side fallback if needed
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
    const settings = getAISettings().providers?.openai;
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (settings?.model || process.env.OPENAI_MODEL || "gpt-4o-mini");

    try {
      const response = await client.chat.completions.create({
        model: targetModel,
        messages: [
          { role: "system", content: options.systemPrompt || "" },
          { role: "user", content: prompt }
        ],
        temperature: settings?.temperature ?? 0.7,
        max_tokens: settings?.maxTokens,
        response_format: options.responseFormat === "json_object" ? { type: "json_object" } : undefined
      }, { signal: options.abortSignal });

      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      throw new AIProviderError(error.message, "openai", this.mapErrorReason(error));
    }
  }

  async streamText(prompt: string, options: AIRequestOptions): Promise<any> {
    const client = this.getClient(options.apiKey);
    const settings = getAISettings().providers?.openai;
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (settings?.model || process.env.OPENAI_MODEL || "gpt-4o-mini");

    try {
      return await client.chat.completions.create({
        model: targetModel,
        messages: [
          { role: "system", content: options.systemPrompt || "" },
          { role: "user", content: prompt }
        ],
        temperature: settings?.temperature ?? 0.7,
        max_tokens: settings?.maxTokens,
        response_format: options.responseFormat === "json_object" ? { type: "json_object" } : undefined,
        stream: true
      }, { signal: options.abortSignal });
    } catch (error: any) {
      throw new AIProviderError(error.message, "openai", this.mapErrorReason(error));
    }
  }
}
