import { SceneMemoryState, ValidationReport, InvalidScene } from "../types/pipeline";
import { SemanticNormalizer } from "../utils/semantic-normalizer";
import { SimilarityChecker } from "./similarity-checker";
import { VisualMemoryManager } from "../utils/visual-memory-manager";
import { ProductionScoringEngine } from "./production-scoring";

export class ValidationEngine {
  public static validateScenes(scenes: any[]): ValidationReport {
    const memoryManager = new VisualMemoryManager();
    const invalidScenes: InvalidScene[] = [];
    const usedOnScreenText = new Set<string>();

    scenes.forEach((scene, index) => {
      const reasons: string[] = [];
      const aiPrompt = scene.aiPrompt || "";
      const broll = scene.brollSuggestions ? scene.brollSuggestions.join(" ") : (scene.brollNotes || "");
      const environment = SemanticNormalizer.normalizeConcept(scene.environment || "");
      const lens = scene.cameraLens || "";
      const lighting = scene.lighting || "";
      const transition = scene.transitionNotes || scene.transitionSuggestions || "";
      const camera = scene.cameraMovement || "";
      const music = scene.musicNotes || "";
      const emotion = scene.emotion || "";
      const onScreenText = scene.onScreenText || "";

      // 1. On Screen Text (Never duplicate)
      if (onScreenText && usedOnScreenText.has(onScreenText.toLowerCase())) {
        reasons.push(`Duplicate On-Screen Text: "${onScreenText}"`);
      }
      if (onScreenText) usedOnScreenText.add(onScreenText.toLowerCase());

      // 2. Similarity Checks against previous scenes
      const previousScenes = memoryManager.getMemory();
      for (const prev of previousScenes) {
        if (aiPrompt && prev.aiPrompt) {
          const sim = SimilarityChecker.calculateSimilarity(aiPrompt, prev.aiPrompt);
          if (sim > 0.20) {
            reasons.push(`AI Prompt similarity too high (${(sim * 100).toFixed(0)}%) with a previous scene`);
            break; // only push once
          }
        }
        if (broll && prev.broll) {
          const sim = SimilarityChecker.calculateSimilarity(broll, prev.broll);
          if (sim > 0.25) {
            reasons.push(`B-roll similarity too high (${(sim * 100).toFixed(0)}%) with a previous scene`);
            break;
          }
        }
      }

      // 3. Consecutive Repeat Checks
      const envRepeats = memoryManager.getRecentConsecutiveCount("environment", environment);
      if (envRepeats >= 2) reasons.push(`Environment "${environment}" repeated >2 times`);

      const lensRepeats = memoryManager.getRecentConsecutiveCount("lens", lens);
      if (lensRepeats >= 2) reasons.push(`Lens "${lens}" repeated >2 times`);

      const lightingRepeats = memoryManager.getRecentConsecutiveCount("lighting", lighting);
      if (lightingRepeats >= 2) reasons.push(`Lighting "${lighting}" repeated >2 times`);

      const transitionRepeats = memoryManager.getRecentConsecutiveCount("transition", transition);
      if (transitionRepeats >= 2) reasons.push(`Transition "${transition}" repeated >2 times`);

      const cameraRepeats = memoryManager.getRecentConsecutiveCount("movement", camera);
      if (cameraRepeats >= 2) reasons.push(`Camera movement "${camera}" repeated >2 times`);

      const musicRepeats = memoryManager.getRecentConsecutiveCount("music", music);
      if (musicRepeats >= 2) reasons.push(`Music "${music}" repeated >2 times`);

      const emotionRepeats = memoryManager.getRecentConsecutiveCount("emotion", emotion);
      if (emotionRepeats >= 3) reasons.push(`Emotion "${emotion}" repeated >3 times`);

      if (reasons.length > 0) {
        invalidScenes.push({ sceneIndex: index, reasons, scene });
      }

      // Record to memory
      memoryManager.addScene({
        environment,
        location: scene.location || environment,
        camera,
        movement: camera,
        angle: scene.cameraAngle || "",
        lens,
        lighting,
        composition: scene.composition || "",
        transition,
        music,
        broll,
        aiPrompt,
        emotion,
        mood: scene.mood || "",
        visualMetaphor: scene.visualMetaphor || ""
      });
    });

    const isValid = invalidScenes.length === 0;
    let diversityPenalty = 0;
    invalidScenes.forEach(inv => {
        diversityPenalty += inv.reasons.length;
    });
    
    const metrics = ProductionScoringEngine.score(invalidScenes, scenes.length, diversityPenalty);

    return {
      isValid: metrics.overallScore >= 90,
      score: metrics.overallScore,
      invalidScenes,
      metrics
    };
  }
}
