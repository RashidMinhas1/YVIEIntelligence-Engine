import fs from "fs";
import path from "path";
import { ViralFormula, TitleFramework, ThumbnailFramework, SynergyFramework, StrategicIntelligence, StrategicRecommendation } from "../types/discovery";
import { StorageProvider, TranslationStorageProvider, FormulaSearchFilters, TitleFrameworkSearchFilters, ThumbnailFrameworkSearchFilters, SynergyFrameworkSearchFilters, StrategicIntelligenceSearchFilters, RecommendationSearchFilters, YouTubeStorageProvider } from "./interfaces";
import { GlossaryEntry, TranslationHistory, TranslationHistoryFilters, GlossaryFilters } from "../translation/translation";

const DB_PATH = path.join(process.cwd(), "data", "knowledge-base.json");
const DB_TMP_PATH = path.join(process.cwd(), "data", "knowledge-base.json.tmp");

interface DbSchema {
  formulas: ViralFormula[];
  titleFrameworks: TitleFramework[];
  thumbnailFrameworks: ThumbnailFramework[];
  synergyFrameworks: SynergyFramework[];
  strategies: StrategicIntelligence[];
  recommendations: StrategicRecommendation[];
  translationHistory: TranslationHistory[];
  translationGlossary: GlossaryEntry[];
  youtubeCache: import("./interfaces").YouTubeCacheEntry[];
}

const DEFAULT_SCHEMA: DbSchema = {
  formulas: [],
  titleFrameworks: [],
  thumbnailFrameworks: [],
  synergyFrameworks: [],
  strategies: [],
  recommendations: [],
  translationHistory: [],
  translationGlossary: [],
  youtubeCache: []
};

export class JsonStorageProvider implements StorageProvider, TranslationStorageProvider, YouTubeStorageProvider {
  private memoryCache: DbSchema | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.ensureDbExistsSync(); // Only on startup
  }

  private ensureDbExistsSync() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_SCHEMA, null, 2), "utf-8");
      this.memoryCache = JSON.parse(JSON.stringify(DEFAULT_SCHEMA));
    } else {
      try {
        const data = fs.readFileSync(DB_PATH, "utf-8");
        this.memoryCache = JSON.parse(data);
        // Schema Migration
        let changed = false;
        if (!this.memoryCache!.formulas) { this.memoryCache!.formulas = []; changed = true; }
        if (!this.memoryCache!.titleFrameworks) { this.memoryCache!.titleFrameworks = []; changed = true; }
        if (!this.memoryCache!.thumbnailFrameworks) { this.memoryCache!.thumbnailFrameworks = []; changed = true; }
        if (!this.memoryCache!.synergyFrameworks) { this.memoryCache!.synergyFrameworks = []; changed = true; }
        if (!this.memoryCache!.strategies) { this.memoryCache!.strategies = []; changed = true; }
        if (!this.memoryCache!.recommendations) { this.memoryCache!.recommendations = []; changed = true; }
        if (!this.memoryCache!.translationHistory) { this.memoryCache!.translationHistory = []; changed = true; }
        if (!this.memoryCache!.translationGlossary) { this.memoryCache!.translationGlossary = []; changed = true; }
        if (!this.memoryCache!.youtubeCache) { this.memoryCache!.youtubeCache = []; changed = true; }
        if (changed) {
          fs.writeFileSync(DB_PATH, JSON.stringify(this.memoryCache, null, 2), "utf-8");
        }
      } catch (e) {
        console.error("[JsonStorageProvider] Corrupt DB, resetting to default.", e);
        this.memoryCache = JSON.parse(JSON.stringify(DEFAULT_SCHEMA));
        fs.writeFileSync(DB_PATH, JSON.stringify(this.memoryCache, null, 2), "utf-8");
      }
    }
  }

  private async readDbAsync(): Promise<DbSchema> {
    if (this.memoryCache) return this.memoryCache;
    try {
      const data = await fs.promises.readFile(DB_PATH, "utf-8");
      this.memoryCache = JSON.parse(data);
      return this.memoryCache!;
    } catch {
      this.memoryCache = JSON.parse(JSON.stringify(DEFAULT_SCHEMA));
      return this.memoryCache!;
    }
  }

  private async writeDbAsync(data: DbSchema): Promise<void> {
    // 1. Update fast memory cache immediately for subsequent reads
    this.memoryCache = data;
    
    // 2. Enqueue the disk write to prevent race conditions and file corruption
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        const json = JSON.stringify(data, null, 2);
        // Atomic write: write to .tmp, then rename
        await fs.promises.writeFile(DB_TMP_PATH, json, "utf-8");
        await fs.promises.rename(DB_TMP_PATH, DB_PATH);
      } catch (err) {
        console.error("[JsonStorageProvider] Failed to flush to disk", err);
      }
    }).catch(e => {
        console.error("[JsonStorageProvider] Write queue error", e);
    });
    
    // 3. Return immediately (Background Save)
    return;
  }

  // --- Viral Formulas ---

  async save(formula: ViralFormula): Promise<void> {
    const db = await this.readDbAsync();
    const existingIndex = db.formulas.findIndex((f) => f.id === formula.id);
    if (existingIndex >= 0) {
      db.formulas[existingIndex] = formula;
    } else {
      db.formulas.push(formula);
    }
    await this.writeDbAsync(db);
  }

  async update(id: string, updates: Partial<ViralFormula>): Promise<ViralFormula> {
    const db = await this.readDbAsync();
    const index = db.formulas.findIndex((f) => f.id === id);
    if (index === -1) throw new Error("Formula not found");
    
    db.formulas[index] = { ...db.formulas[index], ...updates, updatedAt: new Date().toISOString() };
    await this.writeDbAsync(db);
    return db.formulas[index];
  }

  async delete(id: string): Promise<void> {
    const db = await this.readDbAsync();
    db.formulas = db.formulas.filter((f) => f.id !== id);
    await this.writeDbAsync(db);
  }

  async getById(id: string): Promise<ViralFormula | null> {
    const db = await this.readDbAsync();
    return db.formulas.find((f) => f.id === id) || null;
  }

  async getAll(): Promise<ViralFormula[]> {
    return (await this.readDbAsync()).formulas;
  }

  async search(filters: FormulaSearchFilters): Promise<ViralFormula[]> {
    const db = await this.readDbAsync();
    let results = db.formulas;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(f => 
        f.title.toLowerCase().includes(q) || 
        f.description.toLowerCase().includes(q) ||
        f.structure.topic.toLowerCase().includes(q)
      );
    }

    if (filters.category) {
      results = results.filter(f => f.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(f => 
        filters.tags!.some(tag => f.tags.includes(tag))
      );
    }

    if (filters.minConfidence !== undefined) {
      results = results.filter(f => f.confidence >= filters.minConfidence!);
    }

    return results;
  }

  // --- Title Frameworks ---

  async saveTitleFramework(framework: TitleFramework): Promise<void> {
    const db = await this.readDbAsync();
    const existingIndex = db.titleFrameworks.findIndex((f) => f.id === framework.id);
    if (existingIndex >= 0) {
      db.titleFrameworks[existingIndex] = framework;
    } else {
      db.titleFrameworks.push(framework);
    }
    await this.writeDbAsync(db);
  }

  async updateTitleFramework(id: string, updates: Partial<TitleFramework>): Promise<TitleFramework> {
    const db = await this.readDbAsync();
    const index = db.titleFrameworks.findIndex((f) => f.id === id);
    if (index === -1) throw new Error("TitleFramework not found");
    
    db.titleFrameworks[index] = { ...db.titleFrameworks[index], ...updates, updatedAt: new Date().toISOString() };
    await this.writeDbAsync(db);
    return db.titleFrameworks[index];
  }

  async deleteTitleFramework(id: string): Promise<void> {
    const db = await this.readDbAsync();
    db.titleFrameworks = db.titleFrameworks.filter((f) => f.id !== id);
    await this.writeDbAsync(db);
  }

  async getTitleFrameworkById(id: string): Promise<TitleFramework | null> {
    const db = await this.readDbAsync();
    return db.titleFrameworks.find((f) => f.id === id) || null;
  }

  async getAllTitleFrameworks(): Promise<TitleFramework[]> {
    return (await this.readDbAsync()).titleFrameworks;
  }

  async searchTitleFrameworks(filters: TitleFrameworkSearchFilters): Promise<TitleFramework[]> {
    const db = await this.readDbAsync();
    let results = db.titleFrameworks;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(f => 
        f.frameworkName.toLowerCase().includes(q) || 
        f.template.toLowerCase().includes(q)
      );
    }

    if (filters.intent) {
      results = results.filter(f => f.primaryIntent === filters.intent || f.secondaryIntent === filters.intent);
    }

    if (filters.audienceLevel) {
      results = results.filter(f => f.audience.experienceLevel === filters.audienceLevel);
    }

    if (filters.minConfidence !== undefined) {
      results = results.filter(f => f.confidence >= filters.minConfidence!);
    }

    return results;
  }

  // --- Thumbnail Frameworks ---

  async saveThumbnailFramework(framework: ThumbnailFramework): Promise<void> {
    const db = await this.readDbAsync();
    const existingIndex = db.thumbnailFrameworks.findIndex((f) => f.id === framework.id);
    if (existingIndex >= 0) {
      db.thumbnailFrameworks[existingIndex] = framework;
    } else {
      db.thumbnailFrameworks.push(framework);
    }
    await this.writeDbAsync(db);
  }

  async updateThumbnailFramework(id: string, updates: Partial<ThumbnailFramework>): Promise<ThumbnailFramework> {
    const db = await this.readDbAsync();
    const index = db.thumbnailFrameworks.findIndex((f) => f.id === id);
    if (index === -1) throw new Error("ThumbnailFramework not found");
    
    db.thumbnailFrameworks[index] = { ...db.thumbnailFrameworks[index], ...updates, updatedAt: new Date().toISOString() };
    await this.writeDbAsync(db);
    return db.thumbnailFrameworks[index];
  }

  async deleteThumbnailFramework(id: string): Promise<void> {
    const db = await this.readDbAsync();
    db.thumbnailFrameworks = db.thumbnailFrameworks.filter((f) => f.id !== id);
    await this.writeDbAsync(db);
  }

  async getThumbnailFrameworkById(id: string): Promise<ThumbnailFramework | null> {
    const db = await this.readDbAsync();
    return db.thumbnailFrameworks.find((f) => f.id === id) || null;
  }

  async getAllThumbnailFrameworks(): Promise<ThumbnailFramework[]> {
    return (await this.readDbAsync()).thumbnailFrameworks;
  }

  async searchThumbnailFrameworks(filters: ThumbnailFrameworkSearchFilters): Promise<ThumbnailFramework[]> {
    const db = await this.readDbAsync();
    let results = db.thumbnailFrameworks;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(f => 
        f.frameworkName.toLowerCase().includes(q) || 
        f.thumbnailDnaTemplate.toLowerCase().includes(q)
      );
    }

    if (filters.primaryEmotion) {
      results = results.filter(f => f.psychology.primaryEmotion === filters.primaryEmotion);
    }

    if (filters.minCtrStrength !== undefined) {
      results = results.filter(f => parseInt(f.ctrPrediction.expectedCTR) >= filters.minCtrStrength!);
    }

    return results;
  }

  // --- Synergy Frameworks ---

  async saveSynergyFramework(framework: SynergyFramework): Promise<void> {
    const db = await this.readDbAsync();
    const existingIndex = db.synergyFrameworks.findIndex((f) => f.id === framework.id);
    if (existingIndex >= 0) {
      db.synergyFrameworks[existingIndex] = framework;
    } else {
      db.synergyFrameworks.push(framework);
    }
    await this.writeDbAsync(db);
  }

  async updateSynergyFramework(id: string, updates: Partial<SynergyFramework>): Promise<SynergyFramework> {
    const db = await this.readDbAsync();
    const index = db.synergyFrameworks.findIndex((f) => f.id === id);
    if (index === -1) throw new Error("SynergyFramework not found");
    
    db.synergyFrameworks[index] = { ...db.synergyFrameworks[index], ...updates, updatedAt: new Date().toISOString() };
    await this.writeDbAsync(db);
    return db.synergyFrameworks[index];
  }

  async deleteSynergyFramework(id: string): Promise<void> {
    const db = await this.readDbAsync();
    db.synergyFrameworks = db.synergyFrameworks.filter((f) => f.id !== id);
    await this.writeDbAsync(db);
  }

  async getSynergyFrameworkById(id: string): Promise<SynergyFramework | null> {
    const db = await this.readDbAsync();
    return db.synergyFrameworks.find((f) => f.id === id) || null;
  }

  async getAllSynergyFrameworks(): Promise<SynergyFramework[]> {
    return (await this.readDbAsync()).synergyFrameworks;
  }

  async searchSynergyFrameworks(filters: SynergyFrameworkSearchFilters): Promise<SynergyFramework[]> {
    const db = await this.readDbAsync();
    let results = db.synergyFrameworks;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(f => 
        f.frameworkName.toLowerCase().includes(q) || 
        f.titleFormula.toLowerCase().includes(q) ||
        f.thumbnailFormula.toLowerCase().includes(q)
      );
    }

    if (filters.minSynergyScore !== undefined) {
      results = results.filter(f => f.ctrPrediction.synergyScore >= filters.minSynergyScore!);
    }

    return results;
  }


  // --- Strategic Intelligence ---

  async saveStrategicIntelligence(strategy: StrategicIntelligence): Promise<void> {
    const db = await this.readDbAsync();
    const existingIndex = db.strategies.findIndex((s) => s.id === strategy.id);
    if (existingIndex >= 0) {
      db.strategies[existingIndex] = strategy;
    } else {
      db.strategies.push(strategy);
    }
    await this.writeDbAsync(db);
  }

  async getStrategicIntelligence(id: string): Promise<StrategicIntelligence | null> {
    const db = await this.readDbAsync();
    return db.strategies.find((s) => s.id === id) || null;
  }

  async searchStrategicIntelligence(filters: StrategicIntelligenceSearchFilters): Promise<StrategicIntelligence[]> {
    const db = await this.readDbAsync();
    let results = db.strategies;
    if (filters.channelId) {
      results = results.filter(s => s.channelId === filters.channelId);
    }
    return results;
  }

  async saveRecommendation(rec: StrategicRecommendation): Promise<void> {
    const db = await this.readDbAsync();
    const existingIndex = db.recommendations.findIndex((r) => r.id === rec.id);
    if (existingIndex >= 0) {
      db.recommendations[existingIndex] = rec;
    } else {
      db.recommendations.push(rec);
    }
    await this.writeDbAsync(db);
  }

  async searchRecommendations(filters: RecommendationSearchFilters): Promise<StrategicRecommendation[]> {
    const db = await this.readDbAsync();
    let results = db.recommendations;
    if (filters.category) {
      results = results.filter(r => r.category === filters.category);
    }
    if (filters.minPriority !== undefined) {
      results = results.filter(r => r.priorityScore >= filters.minPriority!);
    }
    return results.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Translation History
  // ─────────────────────────────────────────────────────────────────────────

  async saveHistory(entry: TranslationHistory): Promise<void> {
    const db = await this.readDbAsync();
    const existingIndex = db.translationHistory.findIndex((h) => h.id === entry.id);
    if (existingIndex >= 0) {
      db.translationHistory[existingIndex] = entry;
    } else {
      db.translationHistory.unshift(entry); // newest first
    }
    // Keep history capped at 1000 entries
    if (db.translationHistory.length > 1000) {
      db.translationHistory = db.translationHistory.slice(0, 1000);
    }
    await this.writeDbAsync(db);
  }

  async getHistory(filters: TranslationHistoryFilters): Promise<TranslationHistory[]> {
    const db = await this.readDbAsync();
    let results = db.translationHistory;

    if (filters.userId) {
      results = results.filter((h) => h.userId === filters.userId);
    }
    if (filters.sourceLanguage) {
      results = results.filter((h) => h.sourceLanguage === filters.sourceLanguage);
    }
    if (filters.targetLanguage) {
      results = results.filter((h) => h.targetLanguage === filters.targetLanguage);
    }
    if (filters.mode) {
      results = results.filter((h) => h.mode === filters.mode);
    }
    if (filters.contentType) {
      results = results.filter((h) => h.contentType === filters.contentType);
    }
    if (filters.fromDate) {
      results = results.filter((h) => h.createdAt >= filters.fromDate!);
    }
    if (filters.toDate) {
      results = results.filter((h) => h.createdAt <= filters.toDate!);
    }

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;
    return results.slice(offset, offset + limit);
  }

  async deleteHistory(id: string): Promise<void> {
    const db = await this.readDbAsync();
    db.translationHistory = db.translationHistory.filter((h) => h.id !== id);
    await this.writeDbAsync(db);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Translation Glossary
  // ─────────────────────────────────────────────────────────────────────────

  async saveGlossaryEntry(entry: GlossaryEntry): Promise<void> {
    const db = await this.readDbAsync();
    const existingIndex = db.translationGlossary.findIndex((g) => g.id === entry.id);
    if (existingIndex >= 0) {
      db.translationGlossary[existingIndex] = entry;
    } else {
      db.translationGlossary.push(entry);
    }
    await this.writeDbAsync(db);
  }

  async getGlossary(filters: GlossaryFilters): Promise<GlossaryEntry[]> {
    const db = await this.readDbAsync();
    let results = db.translationGlossary;

    if (filters.sourceLanguage) {
      results = results.filter((g) => g.sourceLanguage === filters.sourceLanguage);
    }
    if (filters.targetLanguage) {
      results = results.filter((g) => g.targetLanguage === filters.targetLanguage);
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (g) =>
          g.sourceTerm.toLowerCase().includes(q) ||
          g.targetTerm.toLowerCase().includes(q)
      );
    }
    return results;
  }

  async updateGlossaryEntry(
    id: string,
    updates: Partial<Omit<GlossaryEntry, "id" | "createdAt">>
  ): Promise<GlossaryEntry> {
    const db = await this.readDbAsync();
    const index = db.translationGlossary.findIndex((g) => g.id === id);
    if (index === -1) throw new Error("Glossary entry not found");
    db.translationGlossary[index] = {
      ...db.translationGlossary[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.writeDbAsync(db);
    return db.translationGlossary[index];
  }

  async deleteGlossaryEntry(id: string): Promise<void> {
    const db = await this.readDbAsync();
    db.translationGlossary = db.translationGlossary.filter((g) => g.id !== id);
    await this.writeDbAsync(db);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // YouTube Cache
  // ─────────────────────────────────────────────────────────────────────────

  async saveYouTubeCache(entry: import("./interfaces").YouTubeCacheEntry): Promise<void> {
    const db = await this.readDbAsync();
    const existingIndex = db.youtubeCache.findIndex((c) => c.id === entry.id);
    if (existingIndex >= 0) {
      db.youtubeCache[existingIndex] = entry;
    } else {
      db.youtubeCache.push(entry);
    }
    await this.writeDbAsync(db);
  }

  async getYouTubeCache(id: string): Promise<import("./interfaces").YouTubeCacheEntry | null> {
    const db = await this.readDbAsync();
    return db.youtubeCache.find((c) => c.id === id) || null;
  }

  async deleteYouTubeCache(id: string): Promise<void> {
    const db = await this.readDbAsync();
    db.youtubeCache = db.youtubeCache.filter((c) => c.id !== id);
    await this.writeDbAsync(db);
  }
}
