import { ScoringMetrics, InvalidScene } from "../types/pipeline";

export class ProductionScoringEngine {
  /**
   * Scores the overall storyboard to determine if it meets the >=90 requirement.
   */
  public static score(
    invalidScenes: InvalidScene[],
    totalScenes: number,
    diversityPenalty: number // Based on number of high-similarity hits
  ): ScoringMetrics {
    
    // Base score is 100
    let visualDiversity = 100;
    let cameraVariety = 100;
    let storyProgression = 100;
    let emotionProgression = 100;
    
    // Deduct points for each invalid scene rule broken
    invalidScenes.forEach(inv => {
      inv.reasons.forEach(reason => {
        const r = reason.toLowerCase();
        if (r.includes("environment") || r.includes("lens") || r.includes("lighting")) {
          visualDiversity -= 10;
        }
        if (r.includes("camera") || r.includes("movement")) {
          cameraVariety -= 10;
        }
        if (r.includes("emotion")) {
          emotionProgression -= 15;
        }
      });
    });

    visualDiversity = Math.max(0, visualDiversity - (diversityPenalty * 5));
    cameraVariety = Math.max(0, cameraVariety);
    emotionProgression = Math.max(0, emotionProgression);

    // If there are too many invalid scenes overall, story progression takes a hit
    if (invalidScenes.length > totalScenes / 3) {
      storyProgression -= 20;
    }

    const editingQuality = Math.round((visualDiversity + cameraVariety) / 2);
    const viewerRetentionPotential = Math.round((storyProgression + emotionProgression + visualDiversity) / 3);
    const productionReadiness = invalidScenes.length === 0 ? 100 : Math.max(0, 100 - (invalidScenes.length * 15));
    const promptVariety = visualDiversity;
    const lightingVariety = visualDiversity;

    const overallScore = Math.round(
      (visualDiversity * 1.5 + 
       cameraVariety + 
       storyProgression + 
       emotionProgression + 
       productionReadiness * 2) / 6.5
    );

    return {
      visualDiversity,
      cameraVariety,
      lightingVariety,
      promptVariety,
      storyProgression,
      emotionProgression,
      editingQuality,
      viewerRetentionPotential,
      productionReadiness,
      overallScore
    };
  }
}
