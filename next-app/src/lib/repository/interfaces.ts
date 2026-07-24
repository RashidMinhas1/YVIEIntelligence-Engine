import { ViralFormula, TitleFramework, ThumbnailFramework, SynergyFramework, StrategicIntelligence, StrategicRecommendation } from "../types/discovery";
import { VideoRow } from "../youtube";

export interface FormulaSearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  minConfidence?: number;
}

export interface TitleFrameworkSearchFilters {
  query?: string;
  intent?: string;
  audienceLevel?: string;
  minConfidence?: number;
}

export interface ThumbnailFrameworkSearchFilters {
  query?: string;
  primaryEmotion?: string;
  minCtrStrength?: number;
}

export interface SynergyFrameworkSearchFilters {
  query?: string;
  minSynergyScore?: number;
}

export interface StrategicIntelligenceSearchFilters {
  channelId?: string;
}

export interface RecommendationSearchFilters {
  category?: string;
  minPriority?: number;
}

export interface StorageProvider {
  // Viral Formulas
  save(formula: ViralFormula): Promise<void>;
  update(id: string, formula: Partial<ViralFormula>): Promise<ViralFormula>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<ViralFormula | null>;
  search(filters: FormulaSearchFilters): Promise<ViralFormula[]>;
  getAll(): Promise<ViralFormula[]>;

  // Title Frameworks
  saveTitleFramework(framework: TitleFramework): Promise<void>;
  updateTitleFramework(id: string, framework: Partial<TitleFramework>): Promise<TitleFramework>;
  deleteTitleFramework(id: string): Promise<void>;
  getTitleFrameworkById(id: string): Promise<TitleFramework | null>;
  searchTitleFrameworks(filters: TitleFrameworkSearchFilters): Promise<TitleFramework[]>;
  getAllTitleFrameworks(): Promise<TitleFramework[]>;

  // Thumbnail Frameworks
  saveThumbnailFramework(framework: ThumbnailFramework): Promise<void>;
  updateThumbnailFramework(id: string, framework: Partial<ThumbnailFramework>): Promise<ThumbnailFramework>;
  deleteThumbnailFramework(id: string): Promise<void>;
  getThumbnailFrameworkById(id: string): Promise<ThumbnailFramework | null>;
  searchThumbnailFrameworks(filters: ThumbnailFrameworkSearchFilters): Promise<ThumbnailFramework[]>;
  getAllThumbnailFrameworks(): Promise<ThumbnailFramework[]>;

  // Synergy Frameworks
  saveSynergyFramework(framework: SynergyFramework): Promise<void>;
  updateSynergyFramework(id: string, framework: Partial<SynergyFramework>): Promise<SynergyFramework>;
  deleteSynergyFramework(id: string): Promise<void>;
  getSynergyFrameworkById(id: string): Promise<SynergyFramework | null>;
  searchSynergyFrameworks(filters: SynergyFrameworkSearchFilters): Promise<SynergyFramework[]>;
  getAllSynergyFrameworks(): Promise<SynergyFramework[]>;

  // Strategic Intelligence
  saveStrategicIntelligence(strategy: StrategicIntelligence): Promise<void>;
  getStrategicIntelligence(id: string): Promise<StrategicIntelligence | null>;
  searchStrategicIntelligence(filters: StrategicIntelligenceSearchFilters): Promise<StrategicIntelligence[]>;
  
  saveRecommendation(rec: StrategicRecommendation): Promise<void>;
  searchRecommendations(filters: RecommendationSearchFilters): Promise<StrategicRecommendation[]>;
}

export class KnowledgeRepository {
  constructor(private provider: StorageProvider) {}

  // Viral Formulas
  async saveFormula(formula: ViralFormula): Promise<void> {
    await this.provider.save(formula);
  }

  async updateFormula(id: string, updates: Partial<ViralFormula>): Promise<ViralFormula> {
    return await this.provider.update(id, updates);
  }

  async deleteFormula(id: string): Promise<void> {
    await this.provider.delete(id);
  }

  async getFormula(id: string): Promise<ViralFormula | null> {
    return await this.provider.getById(id);
  }

  async searchFormulas(filters: FormulaSearchFilters): Promise<ViralFormula[]> {
    return await this.provider.search(filters);
  }

  async getAllFormulas(): Promise<ViralFormula[]> {
    return await this.provider.getAll();
  }

  // Title Frameworks
  async saveTitleFramework(framework: TitleFramework): Promise<void> {
    await this.provider.saveTitleFramework(framework);
  }

  async updateTitleFramework(id: string, updates: Partial<TitleFramework>): Promise<TitleFramework> {
    return await this.provider.updateTitleFramework(id, updates);
  }

  async deleteTitleFramework(id: string): Promise<void> {
    await this.provider.deleteTitleFramework(id);
  }

  async getTitleFramework(id: string): Promise<TitleFramework | null> {
    return await this.provider.getTitleFrameworkById(id);
  }

  async searchTitleFrameworks(filters: TitleFrameworkSearchFilters): Promise<TitleFramework[]> {
    return await this.provider.searchTitleFrameworks(filters);
  }

  async getAllTitleFrameworks(): Promise<TitleFramework[]> {
    return await this.provider.getAllTitleFrameworks();
  }

  // Thumbnail Frameworks
  async saveThumbnailFramework(framework: ThumbnailFramework): Promise<void> {
    await this.provider.saveThumbnailFramework(framework);
  }

  async updateThumbnailFramework(id: string, updates: Partial<ThumbnailFramework>): Promise<ThumbnailFramework> {
    return await this.provider.updateThumbnailFramework(id, updates);
  }

  async deleteThumbnailFramework(id: string): Promise<void> {
    await this.provider.deleteThumbnailFramework(id);
  }

  async getThumbnailFramework(id: string): Promise<ThumbnailFramework | null> {
    return await this.provider.getThumbnailFrameworkById(id);
  }

  async searchThumbnailFrameworks(filters: ThumbnailFrameworkSearchFilters): Promise<ThumbnailFramework[]> {
    return await this.provider.searchThumbnailFrameworks(filters);
  }

  async getAllThumbnailFrameworks(): Promise<ThumbnailFramework[]> {
    return await this.provider.getAllThumbnailFrameworks();
  }

  // Synergy Frameworks
  async saveSynergyFramework(framework: SynergyFramework): Promise<void> {
    await this.provider.saveSynergyFramework(framework);
  }

  async updateSynergyFramework(id: string, updates: Partial<SynergyFramework>): Promise<SynergyFramework> {
    return await this.provider.updateSynergyFramework(id, updates);
  }

  async deleteSynergyFramework(id: string): Promise<void> {
    await this.provider.deleteSynergyFramework(id);
  }

  async getSynergyFramework(id: string): Promise<SynergyFramework | null> {
    return await this.provider.getSynergyFrameworkById(id);
  }

  async searchSynergyFrameworks(filters: SynergyFrameworkSearchFilters): Promise<SynergyFramework[]> {
    return await this.provider.searchSynergyFrameworks(filters);
  }

  async getAllSynergyFrameworks(): Promise<SynergyFramework[]> {
    return await this.provider.getAllSynergyFrameworks();
  }

  // Strategic Intelligence
  async saveStrategicIntelligence(strategy: StrategicIntelligence): Promise<void> {
    await this.provider.saveStrategicIntelligence(strategy);
  }

  async getStrategicIntelligence(id: string): Promise<StrategicIntelligence | null> {
    return await this.provider.getStrategicIntelligence(id);
  }

  async searchStrategicIntelligence(filters: StrategicIntelligenceSearchFilters): Promise<StrategicIntelligence[]> {
    return await this.provider.searchStrategicIntelligence(filters);
  }

  async saveRecommendation(rec: StrategicRecommendation): Promise<void> {
    await this.provider.saveRecommendation(rec);
  }

  async searchRecommendations(filters: RecommendationSearchFilters): Promise<StrategicRecommendation[]> {
    return await this.provider.searchRecommendations(filters);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Translation Repository — Milestone 22A
// ─────────────────────────────────────────────────────────────────────────────

import {
  GlossaryEntry,
  TranslationHistory,
  TranslationHistoryFilters,
  GlossaryFilters,
} from "../translation/translation";

export interface TranslationStorageProvider {
  saveHistory(entry: TranslationHistory): Promise<void>;
  getHistory(filters: TranslationHistoryFilters): Promise<TranslationHistory[]>;
  deleteHistory(id: string): Promise<void>;
  saveGlossaryEntry(entry: GlossaryEntry): Promise<void>;
  getGlossary(filters: GlossaryFilters): Promise<GlossaryEntry[]>;
  updateGlossaryEntry(
    id: string,
    updates: Partial<Omit<GlossaryEntry, "id" | "createdAt">>
  ): Promise<GlossaryEntry>;
  deleteGlossaryEntry(id: string): Promise<void>;
}

export class TranslationRepository {
  constructor(private provider: TranslationStorageProvider) {}

  async saveHistory(entry: TranslationHistory): Promise<void> {
    await this.provider.saveHistory(entry);
  }

  async getHistory(filters: TranslationHistoryFilters): Promise<TranslationHistory[]> {
    return await this.provider.getHistory(filters);
  }

  async deleteHistory(id: string): Promise<void> {
    await this.provider.deleteHistory(id);
  }

  async saveGlossaryEntry(entry: GlossaryEntry): Promise<void> {
    await this.provider.saveGlossaryEntry(entry);
  }

  async getGlossary(filters: GlossaryFilters): Promise<GlossaryEntry[]> {
    return await this.provider.getGlossary(filters);
  }

  async updateGlossaryEntry(
    id: string,
    updates: Partial<Omit<GlossaryEntry, "id" | "createdAt">>
  ): Promise<GlossaryEntry> {
    return await this.provider.updateGlossaryEntry(id, updates);
  }

  async deleteGlossaryEntry(id: string): Promise<void> {
    await this.provider.deleteGlossaryEntry(id);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// YouTube Cache Repository
// ─────────────────────────────────────────────────────────────────────────────

export interface YouTubeCacheEntry {
  id: string; // The query, e.g., "MrBeast" or "@MrBeast"
  videos: VideoRow[];
  updatedAt: string;
}

export interface YouTubeStorageProvider {
  saveYouTubeCache(entry: YouTubeCacheEntry): Promise<void>;
  getYouTubeCache(id: string): Promise<YouTubeCacheEntry | null>;
  deleteYouTubeCache(id: string): Promise<void>;
}

export class YouTubeRepository {
  constructor(private provider: YouTubeStorageProvider) {}

  async saveCache(entry: YouTubeCacheEntry): Promise<void> {
    await this.provider.saveYouTubeCache(entry);
  }

  async getCache(id: string): Promise<YouTubeCacheEntry | null> {
    return await this.provider.getYouTubeCache(id);
  }

  async deleteCache(id: string): Promise<void> {
    await this.provider.deleteYouTubeCache(id);
  }
}
