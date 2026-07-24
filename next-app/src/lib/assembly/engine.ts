import { AIMemoryProfile, AssemblySelection } from "@/lib/types/knowledge-object";
import { KNOWLEDGE_CATEGORIES } from "@/lib/config/knowledge-categories";

export interface AssemblyScoreDetails {
  overallScore: number;
  compatibilityScore: number;
  retentionScore: number;
  emotionalScore: number;
  narrativeScore: number;
  confidenceScore: number;
}

export interface ConflictWarning {
  severity: "low" | "medium" | "high";
  message: string;
  objectsInvolved: string[]; // IDs
}

/**
 * Phase 1 Rules-Based Conflict Detection
 */
export function detectConflictsPhase1(activeObjects: any[]): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  
  const tags = new Set(activeObjects.flatMap(s => s.tags || []).map((t: string) => t.toLowerCase()));

  // Example Rule 1: Humorous vs Serious Tone
  if (tags.has("funny") || tags.has("humor") || tags.has("comedy")) {
    if (tags.has("serious") || tags.has("somber") || tags.has("tragedy")) {
      warnings.push({
        severity: "high",
        message: "Thematic Conflict: You have selected assets with both Humorous and Serious tones. This may confuse the AI.",
        objectsInvolved: activeObjects.filter(s => 
          s.tags?.some((t:string) => ["funny", "humor", "comedy", "serious", "somber", "tragedy"].includes(t.toLowerCase()))
        ).map(s => s.id)
      });
    }
  }

  // Example Rule 2: Fast Pacing vs Slow Narration
  if (tags.has("fast-paced") && tags.has("slow")) {
    warnings.push({
      severity: "medium",
      message: "Pacing Conflict: Conflicting pacing tags detected (Fast-paced vs Slow).",
      objectsInvolved: []
    });
  }

  return warnings;
}

/**
 * Calculates the Assembly Score (0-100)
 */
export function calculateAssemblyScore(activeObjects: any[]): AssemblyScoreDetails {
  if (activeObjects.length === 0) {
    return {
      overallScore: 0, compatibilityScore: 0, retentionScore: 0, emotionalScore: 0, narrativeScore: 0, confidenceScore: 0
    };
  }

  // Average the confidence score from metadata
  const sumConfidence = activeObjects.reduce((sum, s) => sum + (s.metadata?.confidenceScore || 50), 0);
  const avgConfidence = sumConfidence / activeObjects.length;
  
  // Calculate specific pillars based on categories present
  const hasHook = activeObjects.some(s => s.type === "hook" || s.type === "opening");
  const hasStory = activeObjects.some(s => s.type === "story_structure" || s.type === "script_format");
  const hasRetention = activeObjects.some(s => s.type === "retention_pattern" || s.type === "curiosity_gap");
  const hasEmotion = activeObjects.some(s => s.type === "tone" || s.type === "emotional_trigger");
  const hasCTA = activeObjects.some(s => s.type === "cta" || s.type === "closing");

  const compatibilityScore = Math.min(100, avgConfidence + (hasHook && hasStory ? 10 : 0));
  const retentionScore = hasRetention ? 90 : 50;
  const emotionalScore = hasEmotion ? 85 : 50;
  const narrativeScore = hasStory ? 95 : 40;
  const confidenceScore = Math.floor((compatibilityScore + retentionScore + emotionalScore + narrativeScore) / 4);

  const overallScore = Math.floor((compatibilityScore + retentionScore + emotionalScore + narrativeScore + confidenceScore) / 5);

  return {
    overallScore,
    compatibilityScore,
    retentionScore,
    emotionalScore,
    narrativeScore,
    confidenceScore
  };
}

/**
 * Explains why the current assembly works
 */
export function generateExplainWhy(activeObjects: any[], score: AssemblyScoreDetails): string {
  if (activeObjects.length === 0) return "Select items to see an analysis.";
  
  let explanation = `This assembly achieved a score of ${score.overallScore}/100. `;
  
  const hasHook = activeObjects.some(s => s.type === "hook" || s.type === "opening");
  const hasStory = activeObjects.some(s => s.type === "story_structure" || s.type === "script_format");
  const hasRetention = activeObjects.some(s => s.type === "retention_pattern" || s.type === "curiosity_gap");
  const hasCTA = activeObjects.some(s => s.type === "cta" || s.type === "closing");

  if (hasHook && hasStory) {
    explanation += "The combination of a strong Hook and a defined Story Structure ensures viewers are captured early and held through a logical narrative arc. ";
  }
  
  if (hasRetention) {
    explanation += "Dedicated Retention patterns (like Open Loops) are present, which mathematically increases expected Watch Time. ";
  }

  if (hasCTA) {
    explanation += "A clear CTA is included, ensuring the psychological payoff is converted into measurable channel growth. ";
  }

  if (score.overallScore > 85) {
    explanation += "\n\nOverall, this is a highly optimized, cohesive script structure.";
  } else if (score.overallScore > 60) {
    explanation += "\n\nOverall, this is a solid assembly, but adding more specialized modules (like Retention or Tones) could improve it.";
  } else {
    explanation += "\n\nWarning: This assembly is sparse. Consider adding a Hook, Story Structure, and CTA for a complete script.";
  }

  return explanation;
}

/**
 * Compiles the Live Master Prompt
 */
export function compileLivePrompt(
  selections: AssemblySelection[], 
  objects: any[], 
  memoryProfile: AIMemoryProfile, 
  topic: string,
  wordCount: string
): string {
  const priorityOrder: Record<string, number> = { "Highest": 5, "High": 4, "Medium": 3, "Low": 2, "Lowest": 1 };
  
  const validSelections = selections
    .map(sel => ({ sel, obj: objects.find(o => o.id === sel.knowledgeObjectId) }))
    .filter(x => x.obj)
    .sort((a, b) => priorityOrder[b.sel.priority] - priorityOrder[a.sel.priority]);

  if (validSelections.length === 0) return "Please select Knowledge Objects to generate a prompt.";

  let prompt = `You are a world-class YouTube scriptwriter and retention expert.
Write an engaging, highly-optimized YouTube script about: "${topic}"

TARGET LENGTH: ${wordCount}

=== AI MEMORY PROFILE (Tone & Style Requirements) ===
- Writing Style: ${memoryProfile.writingStyle}
- Reading Level: ${memoryProfile.readingLevel}
- Pacing: ${memoryProfile.pacing}
- Humor Level: ${memoryProfile.humorLevel}
- Drama Level: ${memoryProfile.dramaLevel}
- Curiosity Level: ${memoryProfile.curiosityLevel}
- Emotional Intensity: ${memoryProfile.emotionalIntensity}
- Formality: ${memoryProfile.formality}
- Storytelling Style: ${memoryProfile.storytellingStyle}
- Vocabulary Complexity: ${memoryProfile.vocabularyComplexity}
- CTA Aggressiveness: ${memoryProfile.ctaAggressiveness}
- Hook Strength: ${memoryProfile.hookStrength}

=== KNOWLEDGE OBJECT INSTRUCTIONS ===
You must strictly follow these structural and thematic requirements extracted from high-performing viral videos. Priority is listed for each.

`;

  validSelections.forEach(({ sel, obj }, idx) => {
    const config = KNOWLEDGE_CATEGORIES.find(c => c.id === obj!.type) || { label: obj!.type };
    prompt += `\n--- [${idx + 1}] Category: ${config.label} (Priority: ${sel.priority}) ---\n`;
    prompt += `Title: ${obj!.title}\n`;
    prompt += `Summary: ${obj!.summary || "No summary provided."}\n`;
    
    // Dump dynamic content fields
    if (obj!.content) {
      Object.entries(obj!.content).forEach(([key, value]) => {
        prompt += `${key}: ${value}\n`;
      });
    }

    if (obj!.metadata?.whyItWorks) {
      prompt += `Why it Works (Apply this psychology): ${obj!.metadata.whyItWorks}\n`;
    }
  });

  prompt += `\n\n=== OUTPUT INSTRUCTIONS ===
1. Combine all the selected Knowledge Objects smoothly into a single, cohesive script.
2. Do not hallucinate extra sections that conflict with the provided framework.
3. Use the AI Memory Profile to govern the tone and sentence structure of every paragraph.
4. Output ONLY the raw script text. Do not output markdown code blocks.`;

  return prompt;
}
