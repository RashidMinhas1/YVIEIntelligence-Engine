// ─────────────────────────────────────────────────────────────────────────────
// Layer 1 — Translation Types
// Universal AI Translation & Localization Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supported translation modes.
 * Each mode adjusts AI emphasis while NEVER changing meaning or intent.
 */
export type TranslationMode =
  | "literal"       // Maximum fidelity, minimal adaptation
  | "natural"       // Native fluency, preserves meaning and intent
  | "professional"  // Formal register, preserves structure and accuracy
  | "creator"       // Preserves creator personality, tone, speaking style
  | "localization"; // Adapts cultural references while preserving full intent

/** Content types supported for translation */
export type ContentType =
  | "title"
  | "hook"
  | "opening"
  | "script"
  | "cta"
  | "ending"
  | "shorts_script"
  | "community_post"
  | "description"
  | "seo_tags"
  | "chapters"
  | "thumbnail_text"
  | "voice_over"
  | "ai_prompt"
  | "research_notes"
  | "intelligence_report"
  | "strategy_report"
  | "markdown_document"
  | "rich_text"
  | "plain_text"
  | "knowledge_content";

/**
 * Language definition with RTL support.
 */
export interface Language {
  code: string;         // ISO 639-1 code (e.g. "en", "ar", "ur")
  name: string;         // Display name (e.g. "English", "Arabic")
  direction: "ltr" | "rtl";
  nativeName?: string;  // Name in the language itself (e.g. "العربية")
}

/**
 * A glossary entry — maps a source term to its required translation.
 * Forces consistent terminology across all translations.
 */
export interface GlossaryEntry {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  sourceLanguage: string; // ISO code
  targetLanguage: string; // ISO code
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Quality report returned alongside every translation.
 * Scores are 0–100. Higher is better.
 */
export interface TranslationQualityReport {
  semanticAccuracy: number;       // Meaning preserved
  tonePreservation: number;       // Tone and emotion preserved
  formattingPreservation: number; // Structure, markdown, lists preserved
  localizationQuality: number;    // Cultural appropriateness for target
  overallScore: number;           // Weighted average
}

/**
 * Single translation request payload.
 */
export interface TranslationRequest {
  content: string;               // Source content to translate
  sourceLanguage: string;        // ISO code or "auto" for detection
  targetLanguage: string;        // ISO code
  mode: TranslationMode;
  contentType: ContentType;
  glossaryId?: string;           // Optional glossary to apply
  preserveBrandNames?: boolean;  // Default true
  preserveFormatting?: boolean;  // Default true
  preserveUrls?: boolean;        // Default true
  preserveNumbers?: boolean;     // Default true
}

/**
 * Complete translation result returned from the service.
 */
export interface TranslationResponse {
  id: string;
  sourceContent: string;
  translatedContent: string;
  sourceLanguage: string;           // Resolved ISO code
  targetLanguage: string;
  mode: TranslationMode;
  contentType: ContentType;
  qualityReport: TranslationQualityReport;
  detectedLanguage?: string;        // When sourceLanguage was "auto"
  glossaryApplied?: string;         // Glossary ID used
  inputLength: number;              // Characters
  outputLength: number;             // Characters
  processingTimeMs: number;
  fromCache: boolean;
  createdAt: string;
}

/**
 * Batch translation request — multiple items at once.
 */
export interface BatchTranslationRequest {
  items: Array<{
    id: string;           // Client-provided ID for matching results
    content: string;
    contentType: ContentType;
  }>;
  sourceLanguage: string;
  targetLanguage: string;
  mode: TranslationMode;
  glossaryId?: string;
  preserveBrandNames?: boolean;
  preserveFormatting?: boolean;
  preserveUrls?: boolean;
  preserveNumbers?: boolean;
}

/**
 * Batch translation response — results keyed by client ID.
 */
export interface BatchTranslationResponse {
  results: Record<string, TranslationResponse>;
  totalItems: number;
  successCount: number;
  failureCount: number;
  errors: Record<string, string>; // clientId → error message
  totalProcessingTimeMs: number;
}

/**
 * Language detection result.
 */
export interface LanguageDetectionResult {
  detectedLanguage: string;   // ISO code
  languageName: string;
  confidence: number;         // 0–100
  direction: "ltr" | "rtl";
}

/**
 * Persisted history entry — stored in the repository.
 */
export interface TranslationHistory {
  id: string;
  userId: string;
  sourceLanguage: string;
  targetLanguage: string;
  mode: TranslationMode;
  contentType: ContentType;
  inputLength: number;
  outputLength: number;
  qualityScore: number;
  fromCache: boolean;
  glossaryId?: string;
  createdAt: string;
}

/** Filters for querying history */
export interface TranslationHistoryFilters {
  userId?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  mode?: TranslationMode;
  contentType?: ContentType;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

/** Filters for querying glossary entries */
export interface GlossaryFilters {
  sourceLanguage?: string;
  targetLanguage?: string;
  query?: string;
}
