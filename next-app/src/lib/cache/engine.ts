import { promises as fs } from 'fs';
import path from 'path';

// Memory cache store
const memoryCache = new Map<string, { data: any, expiresAt: number, storedAt: number }>();

// Request Deduplication
const activeRequests = new Map<string, Promise<any>>();

export interface CacheOptions {
  ttlMs: number; // Time to live in ms
  swrMs?: number; // Stale-while-revalidate threshold in ms
  namespace: "channels" | "videos" | "search" | "similar" | "intelligence" | "outlier" | "recommendation";
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deduped: number;
}

const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deduped: 0
};

export function getCacheMetrics() {
  return { ...metrics };
}

/**
 * Intelligent Cache Engine with Deduplication, TTL, and SWR.
 */
export async function withCache<T>(
  key: string,
  options: CacheOptions,
  fetcher: () => Promise<T>
): Promise<{ data: T; source: "live" | "cache" | "swr"; cacheAgeMs?: number }> {
  const fullKey = `${options.namespace}:${key}`;
  const now = Date.now();

  // 1. Check Cache
  const cached = memoryCache.get(fullKey);
  if (cached) {
    const age = now - cached.storedAt;
    
    // Is it completely valid?
    if (now < cached.expiresAt) {
      metrics.hits++;
      return { data: cached.data as T, source: "cache", cacheAgeMs: age };
    }
    
    // Is it stale but within SWR window?
    if (options.swrMs && now < cached.expiresAt + options.swrMs) {
      metrics.hits++;
      // Trigger background refresh but return stale data
      triggerBackgroundRefresh(fullKey, options, fetcher);
      return { data: cached.data as T, source: "swr", cacheAgeMs: age };
    }
  }

  // 2. Cache Miss - Need to Fetch
  metrics.misses++;
  
  // Request Deduplication: If this exact request is already running, wait for it
  if (activeRequests.has(fullKey)) {
    metrics.deduped++;
    const data = await activeRequests.get(fullKey);
    return { data, source: "live" }; // or cache, but it's "live" from the pov of the system right now
  }

  // Execute fetcher and track request
  const fetchPromise = fetcher().then((data) => {
    // Save to cache
    memoryCache.set(fullKey, {
      data,
      storedAt: now,
      expiresAt: now + options.ttlMs
    });
    metrics.sets++;
    activeRequests.delete(fullKey);
    return data;
  }).catch((err) => {
    activeRequests.delete(fullKey);
    throw err;
  });

  activeRequests.set(fullKey, fetchPromise);

  const data = await fetchPromise;
  return { data, source: "live" };
}

function triggerBackgroundRefresh<T>(fullKey: string, options: CacheOptions, fetcher: () => Promise<T>) {
  if (activeRequests.has(fullKey)) return;

  const promise = fetcher().then((data) => {
    const now = Date.now();
    memoryCache.set(fullKey, {
      data,
      storedAt: now,
      expiresAt: now + options.ttlMs
    });
    activeRequests.delete(fullKey);
    console.log(`[Cache] Background refresh completed for ${fullKey}`);
  }).catch((err) => {
    activeRequests.delete(fullKey);
    console.error(`[Cache] Background refresh failed for ${fullKey}:`, err);
  });

  activeRequests.set(fullKey, promise);
}

export function invalidateCache(namespace: string, key?: string) {
  if (key) {
    memoryCache.delete(`${namespace}:${key}`);
  } else {
    for (const k of memoryCache.keys()) {
      if (k.startsWith(`${namespace}:`)) {
        memoryCache.delete(k);
      }
    }
  }
}
