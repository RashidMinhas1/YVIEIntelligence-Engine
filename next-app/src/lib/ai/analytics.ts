import fs from 'fs';
import path from 'path';

export interface AIAnalyticsData {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  totalTokens: number;
  totalCost: number;
  totalLatencyMs: number;
  cacheHits: number;
  providerUsage: Record<string, number>;
  modelUsage: Record<string, number>;
  errorsByType: Record<string, number>;
  lastUpdated: number;
}

const ANALYTICS_DIR = path.join(process.cwd(), '.yvie-cache');
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, 'ai-analytics.json');

let inMemoryAnalytics: AIAnalyticsData | null = null;

export function getAnalytics(): AIAnalyticsData {
  if (inMemoryAnalytics) return inMemoryAnalytics;

  if (!fs.existsSync(ANALYTICS_DIR)) {
    fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
  }

  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      inMemoryAnalytics = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn("Failed to load AI analytics", err);
  }

  if (!inMemoryAnalytics) {
    inMemoryAnalytics = {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      totalTokens: 0,
      totalCost: 0,
      totalLatencyMs: 0,
      cacheHits: 0,
      providerUsage: {},
      modelUsage: {},
      errorsByType: {},
      lastUpdated: Date.now()
    };
  }
  return inMemoryAnalytics;
}

export function saveAnalytics() {
  if (!inMemoryAnalytics) return;
  inMemoryAnalytics.lastUpdated = Date.now();
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(inMemoryAnalytics, null, 2));
  } catch (err) {
    console.warn("Failed to save AI analytics", err);
  }
}

export function trackAIRequest(
  provider: string,
  model: string,
  success: boolean,
  latencyMs: number,
  tokens: number = 0,
  errorType?: string
) {
  const analytics = getAnalytics();
  
  analytics.totalRequests++;
  
  if (success) {
    analytics.successCount++;
    analytics.totalLatencyMs += latencyMs;
    analytics.totalTokens += tokens;
    
    // Naive cost estimator for demo
    const costPer1k = model.includes('pro') || model.includes('gpt-4') ? 0.01 : 0.001;
    analytics.totalCost += (tokens / 1000) * costPer1k;
  } else {
    analytics.failureCount++;
    if (errorType) {
      analytics.errorsByType[errorType] = (analytics.errorsByType[errorType] || 0) + 1;
    }
  }

  analytics.providerUsage[provider] = (analytics.providerUsage[provider] || 0) + 1;
  analytics.modelUsage[model] = (analytics.modelUsage[model] || 0) + 1;

  // Debounce in a real db
  saveAnalytics();
}

export function trackCacheHit() {
  const analytics = getAnalytics();
  analytics.cacheHits++;
  saveAnalytics();
}
