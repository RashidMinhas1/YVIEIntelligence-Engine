import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Define the cache entry structure
export interface CacheEntry {
  hash: string;
  prompt: string;
  response: string;
  model: string;
  provider: string;
  timestamp: number;
  tokens?: number;
}

const CACHE_DIR = path.join(process.cwd(), '.yvie-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'ai-prompt-cache.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// In-memory cache map for ultra-fast lookups
let memoryCache: Map<string, CacheEntry> | null = null;

function loadCache(): Map<string, CacheEntry> {
  if (memoryCache) return memoryCache;
  memoryCache = new Map();
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      const entries: CacheEntry[] = JSON.parse(data);
      entries.forEach(e => memoryCache!.set(e.hash, e));
    }
  } catch (err) {
    console.warn("Failed to load AI Prompt Cache", err);
  }
  return memoryCache;
}

function saveCache() {
  if (!memoryCache) return;
  try {
    const entries = Array.from(memoryCache.values());
    fs.writeFileSync(CACHE_FILE, JSON.stringify(entries, null, 2));
  } catch (err) {
    console.warn("Failed to save AI Prompt Cache", err);
  }
}

/**
 * Generate a SHA-256 hash for a prompt + config combination
 */
export function generatePromptHash(prompt: string, config: any): string {
  const hash = crypto.createHash('sha256');
  hash.update(prompt);
  // Include settings that change the output fundamentally
  if (config.systemPrompt) hash.update(config.systemPrompt);
  if (config.temperature) hash.update(config.temperature.toString());
  if (config.responseFormat) hash.update(config.responseFormat);
  return hash.digest('hex');
}

/**
 * Check if a cached response exists and is still valid
 */
export function getCachedResponse(hash: string, ttlMs: number = 1000 * 60 * 60 * 24 * 7): CacheEntry | null {
  const cache = loadCache();
  const entry = cache.get(hash);
  
  if (!entry) return null;
  
  // Check TTL (default 7 days)
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(hash);
    return null;
  }
  
  return entry;
}

/**
 * Store a new AI response in the cache
 */
export function setCachedResponse(hash: string, prompt: string, response: string, model: string, provider: string, tokens?: number) {
  const cache = loadCache();
  cache.set(hash, {
    hash,
    prompt,
    response,
    model,
    provider,
    timestamp: Date.now(),
    tokens
  });
  // Debounce the save in a real system, but for now we'll just write it
  saveCache();
}

/**
 * Get cache statistics for the Analytics Dashboard
 */
export function getCacheStats() {
  const cache = loadCache();
  return {
    totalEntries: cache.size,
    sizeBytes: fs.existsSync(CACHE_FILE) ? fs.statSync(CACHE_FILE).size : 0
  };
}
