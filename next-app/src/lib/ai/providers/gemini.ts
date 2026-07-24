import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { AIProvider, AIRequestOptions } from "../types";
import { AIProviderError, AIErrorReason } from "../errors";
import { withRetry, createTimeoutSignal } from "../utils";
import { getAISettings } from "../settings";

export class GeminiProvider implements AIProvider {
  private getClient(overrideApiKey?: string): GoogleGenerativeAI {
    const settings = getAISettings().providers?.gemini;
    const apiKey = overrideApiKey || settings?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIProviderError("Gemini API key is not configured", "gemini", "INVALID_API_KEY");
    }
    return new GoogleGenerativeAI(apiKey);
  }

  private mapErrorReason(error: any): AIErrorReason {
    const status = error.status || error.response?.status;
    if (status === 401 || status === 403) return "INVALID_API_KEY";
    if (status === 402) return "PAYMENT_REQUIRED";
    if (status === 404 || error.message?.includes("404 Not Found") || error.message?.includes("is not found")) return "MODEL_NOT_FOUND";
    if (status === 429) return "RATE_LIMIT";
    if (status === 400) return "INVALID_REQUEST";
    if (status && status >= 500) return "INTERNAL_ERROR";
    
    if (error.name === "AbortError" || error.name === "TimeoutError") return "TIMEOUT";
    if (error.message && (error.message.includes("fetch failed") || error.message.includes("aborted"))) return "TIMEOUT";
    
    return "UNKNOWN";
  }

  async generateText(prompt: string, options: AIRequestOptions): Promise<string> {
    const client = this.getClient(options.apiKey);
    const settings = getAISettings().providers?.gemini;
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (settings?.model || process.env.GEMINI_MODEL || "gemini-2.5-flash");

    try {
      const model = client.getGenerativeModel({
        model: targetModel,
        systemInstruction: options.systemPrompt,
        generationConfig: {
          temperature: settings?.temperature ?? 0.7,
          maxOutputTokens: settings?.maxTokens,
          responseMimeType: options.responseFormat === "json_object" ? "application/json" : "text/plain",
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
      });

      const result = await model.generateContent(prompt, { signal: options.abortSignal });
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      throw new AIProviderError(error.message, "gemini", this.mapErrorReason(error));
    }
  }

  async streamText(prompt: string, options: AIRequestOptions): Promise<any> {
    const client = this.getClient(options.apiKey);
    const settings = getAISettings().providers?.gemini;
    const targetModel = options.modelOverride && options.modelOverride !== "auto" 
      ? options.modelOverride 
      : (settings?.model || process.env.GEMINI_MODEL || "gemini-2.5-flash");

    try {
      const model = client.getGenerativeModel({
        model: targetModel,
        systemInstruction: options.systemPrompt,
        generationConfig: {
          temperature: settings?.temperature ?? 0.7,
          maxOutputTokens: settings?.maxTokens,
          responseMimeType: options.responseFormat === "json_object" ? "application/json" : "text/plain",
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
      });

      const result = await model.generateContentStream(prompt, { signal: options.abortSignal });
      return result.stream;
    } catch (error: any) {
      throw new AIProviderError(error.message, "gemini", this.mapErrorReason(error));
    }
  }
}
