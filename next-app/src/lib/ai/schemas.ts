export interface AIResponseWrapper<T> {
  schemaVersion: string;
  provider: string;
  generatedAt: string;
  analysisType: "script" | "title";
  data: T;
}

export interface TitleAnalysisLevel1 {
  commonFormula: string | null;
  commonStructure: string | null;
  commonKeywords: string[] | null;
  commonEmotionalTriggers: string[] | null;
  commonCuriosityTechniques: string[] | null;
  commonPowerWords: string[] | null;
  commonNumberUsage: string | null;
  commonLength: string | null;
  commonStyle: string | null;
  whyTheyWork: string | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface TitleVariation {
  copy: string;
  tip: string;
}

export interface TitleAnalysisLevel2 {
  originalTitle: string;
  psychology: string | null;
  formula: string | null;
  curiosityType: string | null;
  hookType: string | null;
  emotionalTrigger: string | null;
  audienceTarget: string | null;
  whyItWorks: string | null;
  generatedFormats: TitleVariation[];
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface TitleAnalysisJSON {
  level1Overall: TitleAnalysisLevel1 | null;
  level2Titles: TitleAnalysisLevel2[];
}

export interface ScriptAnalysisOverall {
  executiveSummary: string | null;
  scriptObjective: string | null;
  whyItPerformsWell: string | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface HookAnalyzer {
  hookType: string | null;
  hookPsychology: string | null;
  hookLength: string | null;
  first30SecondsBreakdown: string | null;
  firstMinuteBreakdown: string | null;
  attentionRetentionScore: number | null; // 0-100
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface ToneAnalyzer {
  tone: string | null;
  writingStyle: string | null;
  narrationStyle: string | null;
  personality: string | null;
  voiceConsistency: string | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface StoryAnalyzer {
  storytellingFramework: string | null;
  storyStructure: string | null;
  storyArc: string | null;
  narrativeFlow: string | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface PsychologyAnalyzer {
  curiosityLoops: string[] | null;
  openLoops: string[] | null;
  patternInterrupts: string[] | null;
  suspense: string | null;
  cliffhangers: string[] | null;
  surpriseMoments: string[] | null;
  emotionalTriggers: string[] | null;
  psychologicalTriggers: string[] | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface RetentionAnalyzer {
  retentionStrategy: string | null;
  reengagementMoments: string[] | null;
  energyCurve: string | null;
  pacingAnalysis: string | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface CTAAnalysis {
  ctaText: string;
  ctaPosition: string;
  ctaTiming: string;
  ctaPsychology: string;
  whyItWorks: string;
  betterAlternative: string | null;
}

export interface CTAAnalyzer {
  ctas: CTAAnalysis[];
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface WritingQualityAnalyzer {
  readability: string | null;
  sentenceLength: string | null;
  paragraphLength: string | null;
  informationDensity: string | null;
  keywordUsage: string[] | null;
  repetitionStrategy: string | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface CredibilityAnalyzer {
  facts: string[] | null;
  sources: string[] | null;
  examples: string[] | null;
  analogies: string[] | null;
  socialProof: string[] | null;
  authorityBuilding: string | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface VisualStrategyAnalyzer {
  editingStyle: string | null;
  visualSuggestions: string[] | null;
  brollOpportunities: string[] | null;
  graphicsSuggestions: string[] | null;
  motionGraphics: string[] | null;
  musicStyle: string | null;
  soundEffects: string[] | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface FinalBlueprintAnalyzer {
  hookFormula: string | null;
  bodyFormula: string | null;
  ctaFormula: string | null;
  endingFormula: string | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface FinalRecommendationsAnalyzer {
  strengths: string[] | null;
  weaknesses: string[] | null;
  improvementOpportunities: string[] | null;
  confidenceScore: number;
  inferenceNote?: string | null;
}

export interface ScriptAnalysisJSON {
  overall: ScriptAnalysisOverall | null;
  hook: HookAnalyzer | null;
  tone: ToneAnalyzer | null;
  story: StoryAnalyzer | null;
  psychology: PsychologyAnalyzer | null;
  retention: RetentionAnalyzer | null;
  cta: CTAAnalyzer | null;
  writingQuality: WritingQualityAnalyzer | null;
  credibility: CredibilityAnalyzer | null;
  visualStrategy: VisualStrategyAnalyzer | null;
  blueprint: FinalBlueprintAnalyzer | null;
  recommendations: FinalRecommendationsAnalyzer | null;
}
