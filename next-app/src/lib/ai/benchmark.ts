import { getSmartRoutingChain } from "./router";
import { getProviderInstance } from "./registry";
import { markSuccess, markFailure } from "./health";
import { getAISettings } from "./settings";

let isBenchmarking = false;
let lastBenchmarkTime = 0;
const BENCHMARK_INTERVAL_MS = 1000 * 60 * 15; // 15 minutes

export async function runBackgroundBenchmark(force = false) {
  if (isBenchmarking) return;
  
  const now = Date.now();
  if (!force && now - lastBenchmarkTime < BENCHMARK_INTERVAL_MS) {
    return;
  }
  
  isBenchmarking = true;
  lastBenchmarkTime = now;
  
  try {
    const chain = await getSmartRoutingChain();
    if (chain.length === 0) return;
    
    // Pick the top 2 candidates and 1 random fallback to benchmark
    const candidatesToTest = new Set([
      chain[0],
      chain[1],
      chain[Math.floor(Math.random() * chain.length)]
    ].filter(Boolean));

    for (const candidate of candidatesToTest) {
      if (!candidate) continue;
      const provider = getProviderInstance(candidate.provider);
      const startTime = Date.now();
      
      try {
         // Perform lightweight health ping
         await provider.generateText("ping", {
           modelOverride: candidate.model,
           apiKey: candidate.apiKey,
           systemPrompt: "reply pong",
           latencySensitive: true
         });
         const duration = Date.now() - startTime;
         // Weight the background benchmark slightly less than real traffic
         markSuccess(candidate.provider, candidate.model, candidate.apiKey, duration);
         console.log(`[Benchmark] ${candidate.provider}:${candidate.model} OK in ${duration}ms`);
      } catch (error: any) {
         console.warn(`[Benchmark] ${candidate.provider}:${candidate.model} FAILED:`, error.message);
         const isTimeout = error.name === 'AbortError' || error.message?.includes("Timeout");
         const isRateLimit = error.message?.includes("429");
         const isQuotaExhausted = error.message?.includes("QUOTA") || error.reason === "PAYMENT_REQUIRED";
         markFailure(candidate.provider, candidate.model, candidate.apiKey, isTimeout, isRateLimit, isQuotaExhausted);
      }
    }
  } finally {
    isBenchmarking = false;
  }
}
