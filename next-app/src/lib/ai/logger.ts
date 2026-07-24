import fs from "fs";
import path from "path";

type AILogEntry = {
  timestamp: string;
  provider: string;
  model: string;
  requestDurationMs: number;
  retries: number;
  success: boolean;
  error?: string;
  fallbackChain?: string[];
  finalProviderUsed?: string;
};

// Maintains in-memory history of the last 20 requests
export const aiRequestHistory: AILogEntry[] = [];

export function logAIRequest(entry: AILogEntry) {
  if (entry.error) {
    entry.error = entry.error.replace(/(AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{20,})/g, "REDACTED_API_KEY");
  }

  aiRequestHistory.unshift(entry);
  if (aiRequestHistory.length > 20) {
    aiRequestHistory.pop();
  }

  // Console logging
  const status = entry.success ? "✅ SUCCESS" : "❌ FAILED";
  console.log(`[AI Request] ${status} | Provider: ${entry.provider} | Model: ${entry.model} | Duration: ${entry.requestDurationMs}ms | Retries: ${entry.retries}`);
  if (entry.fallbackChain && entry.fallbackChain.length > 0) {
    console.log(`[AI Fallback] Chain: ${entry.fallbackChain.join(" -> ")} | Final: ${entry.finalProviderUsed}`);
  }
  if (entry.error) {
    console.error(`[AI Error] ${entry.error}`);
  }
}
