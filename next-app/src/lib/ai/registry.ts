import { AIProvider } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { OpenRouterProvider } from "./providers/openrouter";

const registry = new Map<string, () => AIProvider>();

// Register default providers
registry.set("openai", () => new OpenAIProvider());
registry.set("gemini", () => new GeminiProvider());
registry.set("openrouter", () => new OpenRouterProvider());

export function getProviderInstance(name: string): AIProvider {
  const factory = registry.get(name);
  if (!factory) {
    throw new Error(`AI provider '${name}' is not registered`);
  }
  return factory();
}

export interface ModelCapabilities {
  vision: boolean;
  jsonMode: boolean;
  reasoning: boolean;
  streaming: boolean;
  maxTokens: number;
}

export const modelCapabilities: Record<string, Partial<ModelCapabilities>> = {
  "gpt-4o": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 4096 },
  "gpt-4o-mini": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 4096 },
  "o1-preview": { vision: false, jsonMode: false, reasoning: true, streaming: false, maxTokens: 32768 },
  "o1-mini": { vision: false, jsonMode: false, reasoning: true, streaming: false, maxTokens: 32768 },
  "gemini-1.5-pro": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 8192 },
  "gemini-2.5-flash": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 8192 },
  "claude-3-5-sonnet": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 4096 },
  "claude-3-haiku": { vision: true, jsonMode: true, reasoning: false, streaming: true, maxTokens: 4096 }
};

export function getModelCapabilities(model: string): Partial<ModelCapabilities> {
  // Normalize model name for lookup
  const normalizedModel = model.toLowerCase();
  for (const [key, caps] of Object.entries(modelCapabilities)) {
    if (normalizedModel.includes(key)) {
      return caps;
    }
  }
  // Default fallback capabilities if unknown
  return {
    vision: false,
    jsonMode: true, // Allow JSON mode by default so 'auto' routing isn't rejected
    reasoning: false,
    streaming: true,
    maxTokens: 4096
  };
}
