export type RiskLevel = "Low" | "Medium" | "High";
export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

// Explainable AI Base Interface
export interface BaseIntelligenceOutput {
  rawScore: number;
  confidenceScore: number;
  riskLevel: RiskLevel;
  opportunityScore: number;
  priority: PriorityLevel;
  whyThisScore: string;
  evidenceUsed: string[];
  assumptionsInferred: string[];
  suggestions: string[];
  expectedImpact: string;
}

// AI Coach Wrapper
export interface AiCoachInsight {
  whyItMatters: string;
  performanceImpact: string;
  whatToChange: string;
  expectedImprovement: string;
}

// Optimization Sandbox Version
export interface OptimizationVariant {
  id: string;
  moduleType: string;
  originalText: string;
  optimizedText: string;
  reasonForChange: string;
  expectedImprovement: string;
  savedToLibrary: boolean;
  createdAt: string;
}

// specific intelligence modules
export interface HookIntelligence extends BaseIntelligenceOutput {
  originalHook: string;
  hookType: string;
  hookPsychology: string;
  emotionalTrigger: string;
  curiosityTrigger: string;
  coach: AiCoachInsight;
  sandboxVariants?: OptimizationVariant[];
}

export interface TitleIntelligence extends BaseIntelligenceOutput {
  originalTitle: string;
  ctrPotential: number;
  curiosity: number;
  emotionalTrigger: string;
  searchIntent: string;
  seoStrength: number;
  coach: AiCoachInsight;
  sandboxVariants?: OptimizationVariant[];
}

export interface CtaIntelligence extends BaseIntelligenceOutput {
  originalCta: string;
  ctaType: string;
  ctaPsychology: string;
  placementAnalysis: string;
  timingAnalysis: string;
  coach: AiCoachInsight;
  sandboxVariants?: OptimizationVariant[];
}

export interface ThumbnailIntelligence extends BaseIntelligenceOutput {
  concept: string;
  prompt: string;
  textOverlay: string;
  subjectPlacement: string;
  background: string;
  colors: string[];
  emotion: string;
  composition: string;
  coach: AiCoachInsight;
  sandboxVariants?: OptimizationVariant[];
}

export interface StoryIntelligence extends BaseIntelligenceOutput {
  storyFlow: string;
  pacing: string;
  retentionPotential: number;
  coach: AiCoachInsight;
  sandboxVariants?: OptimizationVariant[];
}

export interface SeoIntelligence extends BaseIntelligenceOutput {
  description: string;
  keywords: string[];
  hashtags: string[];
  searchIntent: string;
  longTailKeywords: string[];
  coach: AiCoachInsight;
  sandboxVariants?: OptimizationVariant[];
}

export interface RetentionPrediction {
  first30Seconds: string;
  firstMinute: string;
  middle: string;
  ending: string;
  highRiskDropOffPoints: string[];
  slowSections: string[];
  boringTransitions: string[];
  strongMoments: string[];
  coach: AiCoachInsight;
}

// Graph Relationship Types
export type EdgeRelationshipType = "strong" | "weak" | "missing" | "conflicting";

export interface IntelligenceGraphEdge {
  sourceNode: string; // e.g., 'Hook'
  targetNode: string; // e.g., 'Title'
  relationshipType: EdgeRelationshipType;
  reason: string;
  impact: string;
}

export interface IntelligenceGraph {
  edges: IntelligenceGraphEdge[];
  overallGraphHealth: number;
  primaryConflict: string | null;
  primarySynergy: string | null;
}

// Main Report Payload
export interface ViralIntelligenceReport {
  metadata: {
    overallViralScore: number;
    overallConfidenceScore: number;
    aiProvider: string;
    generatedTime: string;
    analysisVersion: string;
  };
  hook: HookIntelligence;
  title: TitleIntelligence;
  cta: CtaIntelligence;
  thumbnail: ThumbnailIntelligence;
  story: StoryIntelligence;
  seo: SeoIntelligence;
  retention: RetentionPrediction;
  graph: IntelligenceGraph;
  gapAnalysis: {
    missedAngles: string[];
    overusedAngles: string[];
    uniqueAngles: string[];
    opportunities: string[];
  };

  // --- MILESTONE 20: AI SCRIPT DIRECTOR EXTENSIONS ---
  // These are optional to maintain 100% backward compatibility with existing DB records
  titleIntentValidation?: {
    viewerExpectation: string;
    searchIntent: string;
    clickIntent: string;
    emotionalPromise: string;
    curiosityPromise: string;
    titleToScriptAlignment: string;
    titleMatchScore: number;
    titlePromiseFulfillment: string;
    missingExpectations: string[];
    overpromising: string[];
    underDelivering: string[];
    explanation: string;
  };

  seniorScriptWriterReview?: {
    hook: string;
    intro: string;
    storytelling: string;
    viewerPsychology: string;
    logic: string;
    flow: string;
    suspense: string;
    cta: string;
    ending: string;
    naturalNarration: string;
    improvementSuggestions: string[];
  };

  paragraphConnectivityAnalysis?: {
    brokenTransitions: string[];
    abruptJumps: string[];
    missingBridges: string[];
    weakTransitions: string[];
    unansweredQuestions: string[];
    randomInformation: string[];
    transitionSuggestions: string[];
  };

  mainStoryValidation?: {
    centralIdea: string;
    offTopicContent: string[];
    repetition: string[];
    weakSections: string[];
    missingInformation: string[];
    wrongSequence: string[];
    logicGaps: string[];
  };

  curiosityLoopAnalysis?: {
    openLoops: string[];
    closedLoops: string[];
    weakCuriosity: string[];
    missingCuriosity: string[];
    brokenCuriosity: string[];
    recommendations: string[];
  };

  viewerRetentionPrediction?: {
    dropOffPoints: { location: string; reason: string }[];
    retentionImprovements: string[];
  };

  emotionalCurve?: {
    curiosity: string;
    suspense: string;
    emotion: string;
    shock: string;
    relief: string;
    satisfaction: string;
    energy: string;
    flatSections: string[];
    suggestions: string[];
  };

  documentaryDirectorReview?: {
    storyProgression: string;
    narrativePacing: string;
    revealTiming: string;
    informationPacing: string;
    visualOpportunities: string[];
    documentaryQuality: string;
  };

  paragraphLevelReview?: {
    paragraphNumber: number;
    purpose: string;
    mainIdea: string;
    connectionWithPrevious: string;
    connectionWithNext: string;
    curiosityCreated: string;
    curiosityAnswered: string;
    retentionRisk: "Low" | "Medium" | "High";
    emotionalImpact: string;
    status: "Keep" | "Improve" | "Critical Fix";
    improvementSuggestions: string[];
  }[];

  contradictionConsistencyEngine?: {
    internalContradictions: string[];
    timelineInconsistencies: string[];
    characterInconsistencies: string[];
    repeatedFacts: string[];
    missingExplanations: string[];
    unsupportedClaims: string[];
  };

  finalIntelligenceReport?: {
    executiveSummary: string;
    strengths: string[];
    weaknesses: string[];
    criticalIssues: string[];
    improvementSuggestions: string[];
    titleAlignmentScore: number;
    hookScore: number;
    storyFlowScore: number;
    curiosityScore: number;
    paragraphConnectivityScore: number;
    retentionScore: number;
    emotionalCurveScore: number;
    documentaryQualityScore: number;
    overallScriptScore: number;
    confidenceScore: number;
  };
}
