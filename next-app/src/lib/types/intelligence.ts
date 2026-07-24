/**
 * Universal Intelligence Object
 * This strict interface defines the standard response format for ALL modules
 * across the entire Intelligence Pipeline. 
 */
export interface UniversalIntelligence {
  overview: {
    score: number; // 0-100 overall score
    summary: string;
    primaryEmotion: string;
    targetAudience: string;
  };
  metrics: {
    label: string;
    value: number | string;
    trend?: "UP" | "DOWN" | "FLAT";
  }[];
  analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  components: {
    type: string; // e.g. "HOOK", "TRANSITION", "TITLE_FORMULA"
    content: string;
    effectiveness: number; // 0-100
    notes: string;
  }[];
  recommendations: {
    priority: "HIGH" | "MEDIUM" | "LOW";
    action: string;
    expectedImpact: string;
  }[];
  rawOutput?: Record<string, any>; // For provider-specific raw JSON if needed
}
