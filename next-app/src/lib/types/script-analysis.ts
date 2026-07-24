export interface ExecutiveSummary {
  videoTopic: string;
  niche: string;
  videoType: string;
  aiProvider: string;
  overallConfidenceScore: number;
  overallAiRating: string;
  analysisDate: string;
}

export interface ToneAnalysis {
  primaryTone: string;
  secondaryTone: string;
  narrationStyle: string;
  voiceStyle: string;
  pacing: string;
  emotionCurve: string;
}

export interface HookAnalysis {
  originalHook: string;
  hookType: string;
  hookPsychology: string;
  curiosityType: string;
  openLoop: string;
  patternInterrupt: string;
  emotionalTrigger: string;
  whyItWorks: string;
  weaknesses: string;
  suggestedImprovement: string;
}

export interface BodySection {
  sectionTitle: string;
  originalContent: string;
  purpose: string;
  psychology: string;
  storyFunction: string;
  retentionTechnique: string;
  transition: string;
  strengths: string;
  weaknesses: string;
  suggestedImprovements: string;
}

export interface StoryStage {
  stageName: string;
  purpose: string;
  psychology: string;
  whyItWorks: string;
  retentionValue: string;
}

export interface CuriosityLoop {
  originalLoop: string;
  gapCreated: string;
  payoff: string;
  psychology: string;
  strength: string;
  suggestedImprovement: string;
}

export interface EmotionalTrigger {
  emotion: string; // Curiosity, Suspense, Shock, Drama, Humor, Empathy, Fear, Tension
  score: number;
  explanation: string;
}

export interface RetentionEvent {
  timestamp: string;
  viewerExpectation: string;
  patternInterrupt: string;
  curiosityLoop: string;
  openLoop: string;
  payoff: string;
  retentionTechnique: string;
}

export interface TransitionAnalysis {
  originalTransition: string;
  transitionType: string;
  whyItWorks: string;
  psychology: string;
  suggestedImprovement: string;
}

export interface NarrationStyle {
  sentenceLength: string;
  vocabulary: string;
  readingLevel: string;
  voiceStyle: string;
  energy: string;
  speed: string;
  storytellingStyle: string;
}

export interface CtaAnalysis {
  originalCta: string;
  ctaType: string;
  psychology: string;
  strength: string;
  weakness: string;
  suggestedBetterCta: string;
}

export interface FinalScore {
  hook: number;
  story: number;
  curiosity: number;
  retention: number;
  cta: number;
  emotion: number;
  narrative: number;
  overallScore: number;
}

export interface ScriptAnalysisData {
  executiveSummary?: ExecutiveSummary | null;
  scriptObjective?: string | null;
  toneAnalysis?: ToneAnalysis | null;
  hookAnalysis?: HookAnalysis | null;
  bodyBreakdown?: BodySection[] | null;
  storyStructure?: StoryStage[] | null;
  curiosityLoops?: CuriosityLoop[] | null;
  emotionalTriggers?: EmotionalTrigger[] | null;
  retentionStrategy?: RetentionEvent[] | null;
  transitionAnalysis?: TransitionAnalysis[] | null;
  narrationStyle?: NarrationStyle | null;
  ctaAnalysis?: CtaAnalysis | null;
  promptUsed?: string | null;
  finalScore?: FinalScore | null;
}
