export interface ResearchSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  filters: Record<string, any>;
  notes: string;
}

export interface ResearchItem {
  id: string;
  sessionId: string;
  type: "CHANNEL" | "VIDEO" | "KEYWORD" | "TREND";
  externalId: string; // e.g. YouTube Channel ID or Video ID
  metadata: Record<string, any>; // Stores Logo, Banner, Sub count, etc.
  createdAt: string;
}

export interface AnalysisResult {
  id: string;
  itemId: string;
  type: string; // e.g., "OUTLIER_DETECTION", "TITLE_INTELLIGENCE"
  provider: string; // "openrouter", "gemini"
  model: string;
  feature: string;
  version: string;
  cacheStatus: "HIT" | "MISS" | "BYPASSED";
  result: Record<string, any>; // The Universal Intelligence Object
  createdAt: string;
}

export interface CachedResult {
  id: string;
  cacheKey: string;
  type: string;
  data: any;
  expiresAt: string | null;
  createdAt: string;
}

export interface StorageRepository {
  // Session Management
  getSessions(): Promise<ResearchSession[]>;
  getSession(id: string): Promise<ResearchSession | null>;
  createSession(session: Omit<ResearchSession, "id" | "createdAt" | "updatedAt">): Promise<ResearchSession>;
  updateSession(id: string, updates: Partial<ResearchSession>): Promise<ResearchSession>;
  deleteSession(id: string): Promise<void>;

  // Research Items
  getItems(sessionId: string): Promise<ResearchItem[]>;
  addItem(item: Omit<ResearchItem, "id" | "createdAt">): Promise<ResearchItem>;
  removeItem(id: string): Promise<void>;

  // Analysis Results
  getAnalysisResults(itemId: string): Promise<AnalysisResult[]>;
  saveAnalysisResult(result: Omit<AnalysisResult, "id" | "createdAt">): Promise<AnalysisResult>;

  // Intelligence Memory (Cache)
  getCachedResult(cacheKey: string): Promise<CachedResult | null>;
  setCachedResult(cache: Omit<CachedResult, "id" | "createdAt">): Promise<CachedResult>;
  invalidateCache(cacheKey: string): Promise<void>;
}
