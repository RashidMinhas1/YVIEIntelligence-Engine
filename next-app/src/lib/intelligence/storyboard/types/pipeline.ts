export interface StoryAnalysis {
  storyArc: string;
  emotionalArc: string;
  locations: string[];
  characters: string[];
  investigationFlow: string;
  climax: string;
  ending: string;
}

export interface VisualBeat {
  id: string;
  narration: string;
  cinematicIdea: string;
  visualGoal: string;
  emotion: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedDuration: number;
}

export interface ProductionPlan {
  storyStructure: {
    opening: string;
    setup: string;
    conflict: string;
    investigation: string;
    discovery: string;
    climax: string;
    resolution: string;
  };
  visualStrategy: {
    documentaryStyle: string;
    pacing: string;
    visualRhythm: string;
    editingRhythm: string;
  };
  // Mapping of beat ID to its planned properties
  beatPlans: Record<string, {
    location: string;
    cameraAngle: string;
    cameraMovement: string;
    focalLength: string;
    lightingStyle: string;
    composition: string;
    colorPalette: string;
    transitionToNext: string;
    music: string;
    soundDesign: string;
    emotion: string;
    retentionHook: string;
    visualMetaphor: string;
  }>;
}

export interface SceneMemoryState {
  environment: string;
  location: string;
  camera: string;
  movement: string;
  angle: string;
  lens: string;
  lighting: string;
  composition: string;
  transition: string;
  music: string;
  broll: string;
  aiPrompt: string;
  emotion: string;
  mood: string;
  visualMetaphor: string;
}

export interface ValidationReport {
  isValid: boolean;
  score: number;
  invalidScenes: InvalidScene[];
  metrics: ScoringMetrics;
}

export interface InvalidScene {
  sceneIndex: number;
  reasons: string[];
  scene: any; // The raw scene object that failed
}

export interface ScoringMetrics {
  visualDiversity: number;
  cameraVariety: number;
  lightingVariety: number;
  promptVariety: number;
  storyProgression: number;
  emotionProgression: number;
  editingQuality: number;
  viewerRetentionPotential: number;
  productionReadiness: number;
  overallScore: number;
}

export interface DebugPayload {
  storyAnalysis?: StoryAnalysis;
  visualBeats?: VisualBeat[];
  productionPlan?: ProductionPlan;
  validationReport?: ValidationReport;
  productionAnalytics?: any; // To be typed later
  storyboardInspector?: any[]; // To be typed later
  diffReport?: any[];
  pipelineMetrics?: {
    executionTimeMs: number;
    aiCalls: number;
    validationFailures: number;
    regeneratedScenes: number;
    overallProductionScore: number;
  };
}
