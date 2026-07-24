export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface ModelHealth {
  provider: string;
  model: string;
  apiKey: string;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  rateLimitCount: number;
  consecutiveFailures: number;
  totalResponseTimeMs: number;
  totalTokens: number;
  totalTokenTimeMs: number;
  unhealthyUntil: number;
  lastSuccess: number;
  lastFailure: number;
  state: CircuitBreakerState;
  probeInflight: boolean;
  quotaExhausted: boolean;
}

const healthState: Map<string, ModelHealth> = new Map();

export function getHealth(provider: string, model: string, apiKey: string = ""): ModelHealth {
  const key = `${provider}:${model}:${apiKey}`;
  if (!healthState.has(key)) {
    healthState.set(key, {
      provider,
      model,
      apiKey,
      successCount: 0,
      failureCount: 0,
      timeoutCount: 0,
      rateLimitCount: 0,
      consecutiveFailures: 0,
      totalResponseTimeMs: 0,
      totalTokens: 0,
      totalTokenTimeMs: 0,
      unhealthyUntil: 0,
      lastSuccess: 0,
      lastFailure: 0,
      state: "CLOSED",
      probeInflight: false,
      quotaExhausted: false
    });
  }

  const h = healthState.get(key)!;
  
  // Transition logic
  if (h.state === "OPEN" && h.unhealthyUntil < Date.now()) {
    h.state = "HALF_OPEN";
    h.probeInflight = false;
  }

  return h;
}

export function getAllHealth(): ModelHealth[] {
  // Ensure state transitions before returning list
  const keys = Array.from(healthState.keys());
  for (const k of keys) {
    const [p, m, a] = k.split(":");
    getHealth(p, m, a);
  }
  return Array.from(healthState.values());
}

export function markSuccess(provider: string, model: string, apiKey: string, durationMs: number, tokens: number = 0) {
  const h = getHealth(provider, model, apiKey);
  h.successCount++;
  h.consecutiveFailures = 0;
  h.totalResponseTimeMs += durationMs;
  if (tokens > 0) {
    h.totalTokens += tokens;
    h.totalTokenTimeMs += durationMs;
  }
  h.lastSuccess = Date.now();
  h.unhealthyUntil = 0;
  h.state = "CLOSED";
  h.probeInflight = false;
  h.quotaExhausted = false;

  import("./analytics").then(m => m.trackAIRequest(provider, model, true, durationMs, tokens));
}

export function markFailure(provider: string, model: string, apiKey: string, isTimeout: boolean, isRateLimit: boolean = false, isQuotaExhausted: boolean = false) {
  const h = getHealth(provider, model, apiKey);
  h.failureCount++;
  h.lastFailure = Date.now();
  h.consecutiveFailures++;
  h.probeInflight = false;
  
  if (isTimeout) {
    h.timeoutCount++;
  }
  if (isRateLimit) {
    h.rateLimitCount++;
  }

  let errorType = "unknown";
  if (isTimeout) errorType = "timeout";
  if (isRateLimit) errorType = "rate_limit";
  if (isQuotaExhausted) errorType = "quota_exhausted";

  import("./analytics").then(m => m.trackAIRequest(provider, model, false, 0, 0, errorType));

  // Circuit Breaker Logic
  if (isQuotaExhausted) {
    h.quotaExhausted = true;
    h.state = "OPEN";
    h.unhealthyUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    console.warn(`[CircuitBreaker] ${provider}:${model} key ${apiKey.substring(0, 8)}... QUOTA EXHAUSTED marked OPEN for 24h`);
  } else if (h.state === "HALF_OPEN" || h.consecutiveFailures >= 3 || isRateLimit) {
    // 60 second cooldown if rate limited or repeated failures
    const cooldownMs = isRateLimit ? 60000 : 30000;
    h.unhealthyUntil = Date.now() + cooldownMs;
    h.state = "OPEN";
    console.warn(`[CircuitBreaker] ${provider}:${model} key ${apiKey.substring(0, 8)}... marked OPEN (cooldown ${cooldownMs/1000}s)`);
  }
}

export function tryAcquireProbe(provider: string, model: string, apiKey: string): boolean {
  const h = getHealth(provider, model, apiKey);
  if (h.state === "CLOSED") return true;
  if (h.state === "HALF_OPEN" && !h.probeInflight) {
    h.probeInflight = true;
    return true;
  }
  return false;
}
