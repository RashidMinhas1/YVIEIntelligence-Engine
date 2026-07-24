import { AIProviderError } from "./errors";

const RETRYABLE_REASONS = new Set([
  "RATE_LIMIT",
  "TIMEOUT",
  "NETWORK_ERROR",
  "INTERNAL_ERROR"
]);

export async function withRetry<T>(
  provider: string,
  operation: () => Promise<T>,
  maxRetries = 1
): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      if (error instanceof AIProviderError && RETRYABLE_REASONS.has(error.reason)) {
        attempt++;
        if (attempt > maxRetries) {
          throw error;
        }
        // Minimal exponential backoff
        const waitTime = Math.pow(2, attempt) * 500 + (Math.random() * 200 - 100);
        console.warn(`[${provider}] Retry ${attempt}/${maxRetries} after ${Math.round(waitTime)}ms due to ${error.reason}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Unreachable");
}

// 10s strict timeout
export function createTimeoutSignal(ms: number = 10000): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error("Timeout")), ms);
  return controller.signal;
}
