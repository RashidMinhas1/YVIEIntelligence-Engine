import { localDb } from "../local-db";
import { StorageRepository, ResearchSession, ResearchItem, AnalysisResult, CachedResult } from "./storage";

export class LocalStorageRepository implements StorageRepository {
  async getSessions(): Promise<ResearchSession[]> {
    return localDb.getAll("researchSessions") as ResearchSession[];
  }

  async getSession(id: string): Promise<ResearchSession | null> {
    const sessions = await this.getSessions();
    return sessions.find(s => s.id === id) || null;
  }

  async createSession(session: Omit<ResearchSession, "id" | "createdAt" | "updatedAt">): Promise<ResearchSession> {
    const newSession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const db = localDb.getDb();
    db.researchSessions.push(newSession);
    localDb.saveDb(db);
    return newSession;
  }

  async updateSession(id: string, updates: Partial<ResearchSession>): Promise<ResearchSession> {
    const db = localDb.getDb();
    const index = db.researchSessions.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Session not found");
    
    db.researchSessions[index] = {
      ...db.researchSessions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localDb.saveDb(db);
    return db.researchSessions[index];
  }

  async deleteSession(id: string): Promise<void> {
    const db = localDb.getDb();
    db.researchSessions = db.researchSessions.filter(s => s.id !== id);
    localDb.saveDb(db);
  }

  async getItems(sessionId: string): Promise<ResearchItem[]> {
    const items = localDb.getAll("researchItems") as ResearchItem[];
    return items.filter(i => i.sessionId === sessionId);
  }

  async addItem(item: Omit<ResearchItem, "id" | "createdAt">): Promise<ResearchItem> {
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    const db = localDb.getDb();
    db.researchItems.push(newItem);
    localDb.saveDb(db);
    return newItem;
  }

  async removeItem(id: string): Promise<void> {
    const db = localDb.getDb();
    db.researchItems = db.researchItems.filter(i => i.id !== id);
    localDb.saveDb(db);
  }

  async getAnalysisResults(itemId: string): Promise<AnalysisResult[]> {
    const results = localDb.getAll("analysisResults") as AnalysisResult[];
    return results.filter(r => r.itemId === itemId);
  }

  async saveAnalysisResult(result: Omit<AnalysisResult, "id" | "createdAt">): Promise<AnalysisResult> {
    const newResult = {
      ...result,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    const db = localDb.getDb();
    db.analysisResults.push(newResult);
    localDb.saveDb(db);
    return newResult;
  }

  async getCachedResult(cacheKey: string): Promise<CachedResult | null> {
    const caches = localDb.getAll("cachedResults") as CachedResult[];
    const result = caches.find(c => c.cacheKey === cacheKey);
    if (!result) return null;
    
    if (result.expiresAt && new Date(result.expiresAt) < new Date()) {
      await this.invalidateCache(cacheKey);
      return null;
    }
    return result;
  }

  async setCachedResult(cache: Omit<CachedResult, "id" | "createdAt">): Promise<CachedResult> {
    await this.invalidateCache(cache.cacheKey); // clear old if exists
    const newCache = {
      ...cache,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    const db = localDb.getDb();
    db.cachedResults.push(newCache);
    localDb.saveDb(db);
    return newCache;
  }

  async invalidateCache(cacheKey: string): Promise<void> {
    const db = localDb.getDb();
    db.cachedResults = db.cachedResults.filter(c => c.cacheKey !== cacheKey);
    localDb.saveDb(db);
  }
}

export const storage = new LocalStorageRepository();
