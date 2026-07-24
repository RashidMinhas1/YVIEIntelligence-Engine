export type KnowledgeCategory = 
  | "Hooks" | "CTAs" | "Tones" | "Story Structures" | "Story Arcs" 
  | "Prompts" | "Transitions" | "Retention" | "Vocabulary" 
  | "Psychology" | "Frameworks" | "Narration" | "Introductions" 
  | "Endings" | "Open Loops" | "Curiosity Loops" | "Pattern Interrupts" 
  | "General Notes"
  | "Executive Summary"
  | "Objective"
  | "Target Audience"
  | "Writing Style"
  | "Overall Strategy"
  | "Improvements";

export interface KnowledgeObjectMetadata {
  provider: string;
  competitorChannel: string;
  competitorChannelUrl: string;
  competitorVideo: string;
  videoUrl: string;
  videoId: string;
  niche: string;
  topic: string;
  language: string;
  createdDate: string;
  confidenceScore: number;
  inferenceNote?: string;
  tags: string[];
  notes?: string;
  userNotes?: string;
  originalScriptReference?: string;
  
  // Analytics added in 6B
  usageCount?: number;
  assemblyCount?: number;
  generationCount?: number;
  lastUsed?: string;
  favorite?: boolean;
  pinned?: boolean;
}

// Added in 6B
export interface AIMemoryProfile {
  writingStyle: string;
  readingLevel: string;
  sentenceLength: string;
  paragraphLength: string;
  humorLevel: string;
  dramaLevel: string;
  curiosityLevel: string;
  emotionalIntensity: string;
  formality: string;
  pacing: string;
  storytellingStyle: string;
  vocabularyComplexity: string;
  ctaAggressiveness: string;
  hookStrength: string;
}

export type CategoryPriority = "Highest" | "High" | "Medium" | "Low" | "Lowest";

export interface AssemblySelection {
  categoryId: KnowledgeCategory;
  knowledgeObjectId: string;
  priority: CategoryPriority;
}

export interface AssemblyTemplate {
  selections: AssemblySelection[];
  livePrompt: string;
  provider: string;
  language: string;
  wordCountMode: string;
  targetWordCount: number;
  notes: string;
  version: string;
  memoryProfile: AIMemoryProfile;
  assemblyScore?: number;
}

export interface KnowledgeRelationship {
  type: "belongs_to" | "works_well_with" | "commonly_uses";
  targetId: string; // The ID of the related KnowledgeObject
  targetType: string;
}

export interface KnowledgePerformanceScores {
  usefulnessScore: number; // 0-100
  reuseScore: number; // 0-100
  uniquenessScore: number; // 0-100
}

export interface KnowledgeObject {
  id: string; // Unique UUID
  schemaVersion: "1.0"; // Versioned schema for backwards compatibility
  objectVersion: number;
  title: string;
  type: string; 
  category: KnowledgeCategory; // Automatic Library Category mapping
  description: string;
  originalContent?: string;
  extractedContent: string;
  whyItWorks: string;
  strengths: string[];
  weaknesses?: string[];
  improvementSuggestions?: string[];
  scores: KnowledgePerformanceScores;
  relationships: KnowledgeRelationship[]; // Scalable relational mapping
  metadata: KnowledgeObjectMetadata;
}

export interface KnowledgeExtractionJSON {
  schemaVersion: "1.0";
  objects: KnowledgeObject[];
}
