import { getAISettings } from "./settings";
import { getHealth, ModelHealth } from "./health";

// In-memory cache for dynamically fetched models
const modelCache: Map<string, { id: string, name: string, isFree?: boolean }[]> = new Map();
let cacheTimestamp = 0;

export async function fetchAllProviderModels(provider: string, apiKey: string, forceRefresh = false) {
  const cacheKey = provider;
  if (!forceRefresh && modelCache.has(cacheKey) && Date.now() - cacheTimestamp < 1000 * 60 * 60) {
    return modelCache.get(cacheKey)!;
  }

  let models: { id: string, name: string, isFree?: boolean }[] = [];
  try {
    if (provider === "openai") {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const res = await client.models.list();
      models = res.data.map(m => ({ id: m.id, name: m.id, isFree: false }));
    } else if (provider === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await res.json();
      models = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => ({ id: m.name.replace("models/", ""), name: m.displayName || m.name, isFree: false }));
    } else if (provider === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      const data = await res.json();
      models = (data.data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        isFree: m.pricing?.prompt === "0" && m.pricing?.completion === "0"
      }));
    }
    modelCache.set(cacheKey, models);
    cacheTimestamp = Date.now();
  } catch (err) {
    console.error(`[Router] Failed to fetch models for ${provider}:`, err);
  }
  return models;
}

export type FallbackCandidate = { provider: string, model: string, apiKey: string };

function scoreModel(health: ModelHealth, isFree: boolean): number {
  const successRate = health.successCount + health.failureCount === 0 
    ? 1 
    : health.successCount / (health.successCount + health.failureCount);
    
  const avgResponseTime = health.successCount === 0 
    ? 5000 
    : health.totalResponseTimeMs / health.successCount;

  const tokensPerSec = health.totalTokenTimeMs === 0 || health.totalTokens === 0
    ? 50
    : (health.totalTokens / health.totalTokenTimeMs) * 1000;
    
  // Unified normalized score
  let score = successRate * 10000;
  
  // Latency penalty
  score -= avgResponseTime;

  // Speed Bonus
  score += tokensPerSec * 10;
  
  // Timeout Penalty
  score -= (health.timeoutCount * 5000);
  
  // Free preference
  if (isFree) {
    score += 5000;
  }
  
  // Circuit breaker state penalty
  if (health.state === "HALF_OPEN") {
    score -= 2000;
  }
  
  // Recent performance penalty
  score -= (health.consecutiveFailures * 1000);
  
  return score;
}

// Phase 3: Feature-Based Routing mappings
export type TaskCategory = "fast" | "large_context" | "reasoning" | "vision" | "translation" | "json_generation" | "cost_optimized";

function getFeatureOptimalModels(category?: string): string[] {
  switch (category as TaskCategory) {
    case "fast":
       return ["gemini-2.5-flash", "gemini-1.5-flash", "gpt-4o-mini", "claude-3-haiku"];
    case "large_context":
       return ["gemini-1.5-pro", "claude-3.5-sonnet"];
    case "reasoning":
       return ["o1-preview", "o1-mini", "gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro"];
    case "vision":
       return ["gpt-4o", "gemini-1.5-pro"]; 
    case "translation":
       return ["gemini-1.5-pro", "gpt-4o", "claude-3.5-sonnet"];
    case "json_generation":
       return ["gpt-4o", "gemini-1.5-pro", "gemini-1.5-flash"];
    case "cost_optimized":
       return ["gemini-1.5-flash", "gpt-4o-mini", "claude-3-haiku"];
    default:
       return [];
  }
}

export async function getSmartRoutingChain(featureKey?: string): Promise<FallbackCandidate[]> {
  const settings = getAISettings();
  let primaryProvider = settings.activeProvider || "gemini";
  let primaryModel = settings.providers?.[primaryProvider as keyof typeof settings.providers]?.model || null;

  let loadBalancingStrategy = settings.providers?.[primaryProvider as keyof typeof settings.providers]?.loadBalancingStrategy || "round_robin";

  // Feature-level overrides from user
  let localApiKeys: string[] | undefined;
  if (featureKey && settings.features?.[featureKey]) {
    const override = settings.features[featureKey];
    if (override.isLocalOverrideEnabled !== false) {
      if (override.provider && override.provider !== "auto") primaryProvider = override.provider;
      if (override.model && override.model !== "auto") primaryModel = override.model;
      if (override.apiKeys && override.apiKeys.length > 0) localApiKeys = override.apiKeys;
      if (override.loadBalancingStrategy) loadBalancingStrategy = override.loadBalancingStrategy;
    }
  }

  const fallbackOrder = ["gemini", "openrouter", "openai"];
  const providerOrder = [primaryProvider, ...fallbackOrder.filter(p => p !== primaryProvider)];

  const chain: FallbackCandidate[] = [];
  const added = new Set<string>();

  const addCandidate = (p: string, m: string, key: string) => {
    const uniqueId = `${p}:${m}:${key}`;
    if (!added.has(uniqueId)) {
      const health = getHealth(p, m, key);
      if (health.state === "CLOSED" || health.state === "HALF_OPEN") {
        chain.push({ provider: p, model: m, apiKey: key });
        added.add(uniqueId);
      }
    }
  };

  const featurePreferredModels = featureKey && (!primaryModel || primaryModel === "auto") ? getFeatureOptimalModels(featureKey) : [];

  // Sort apiKeys based on strategy
  const sortApiKeys = (keys: string[], p: string): string[] => {
    if (keys.length <= 1) return keys;
    const sorted = [...keys];
    if (loadBalancingStrategy === "least_latency") {
      sorted.sort((a, b) => getHealth(p, "auto", a).totalResponseTimeMs / Math.max(1, getHealth(p, "auto", a).successCount) - getHealth(p, "auto", b).totalResponseTimeMs / Math.max(1, getHealth(p, "auto", b).successCount));
    } else if (loadBalancingStrategy === "least_errors") {
      sorted.sort((a, b) => getHealth(p, "auto", a).failureCount - getHealth(p, "auto", b).failureCount);
    } else if (loadBalancingStrategy === "round_robin") {
      // Shift array by a random or rotating offset. For simplicity, random uniform to emulate round_robin across concurrent requests.
      const offset = Math.floor(Math.random() * sorted.length);
      return [...sorted.slice(offset), ...sorted.slice(0, offset)];
    }
    return sorted;
  };

  if (primaryModel && primaryModel !== "auto") {
    let keys = localApiKeys;
    if (!keys) {
      const primaryConfig = settings.providers?.[primaryProvider as keyof typeof settings.providers];
      keys = primaryConfig?.apiKeys?.length ? primaryConfig.apiKeys : (primaryConfig?.apiKey ? [primaryConfig.apiKey] : []);
    }
    keys = sortApiKeys(keys, primaryProvider);
    keys.forEach(k => {
      if (k) addCandidate(primaryProvider, primaryModel!, k);
    });
  }

  for (const provider of providerOrder) {
    const config = settings.providers?.[provider as keyof typeof settings.providers];
    if (config?.isEnabled === false && provider !== primaryProvider) continue;

    let apiKeys = (provider === primaryProvider && localApiKeys) ? localApiKeys : (config?.apiKeys?.length ? config.apiKeys : (config?.apiKey ? [config.apiKey] : []));
    if (!apiKeys.length && process.env[`${provider.toUpperCase()}_API_KEY`]) {
      apiKeys = [process.env[`${provider.toUpperCase()}_API_KEY`]!];
    }
    if (apiKeys.length === 0) continue;

    apiKeys = sortApiKeys(apiKeys, provider);
    const availableModels = await fetchAllProviderModels(provider, apiKeys[0]);

    for (const apiKey of apiKeys) {
      if (!apiKey) continue;
      
      let apiKeyCandidates = [...availableModels];
      apiKeyCandidates.sort((a, b) => {
        const scoreA = scoreModel(getHealth(provider, a.id, apiKey), !!a.isFree);
        const scoreB = scoreModel(getHealth(provider, b.id, apiKey), !!b.isFree);
        let finalScoreA = scoreA;
        let finalScoreB = scoreB;

        if (featurePreferredModels.length > 0) {
           if (featurePreferredModels.some(pm => a.id.includes(pm))) finalScoreA += 20000;
           if (featurePreferredModels.some(pm => b.id.includes(pm))) finalScoreB += 20000;
        }

        return finalScoreB - finalScoreA;
      });

      const topCandidates = apiKeyCandidates.slice(0, 3);
      for (const m of topCandidates) {
        addCandidate(provider, m.id, apiKey);
      }
    }
  }

  return chain;
}
