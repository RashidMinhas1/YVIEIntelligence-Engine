export class ProductionAnalytics {
  public static generate(scenes: any[]): any {
    const analytics: any = {
      cameraUsage: {},
      lensUsage: {},
      environmentDistribution: {},
      lightingDistribution: {},
      transitionDistribution: {},
      musicDistribution: {},
      emotionDistribution: {},
      promptConceptDistribution: {},
      brollDistribution: {},
      averageSimilarity: 0,
      averageDiversity: 100,
      weakestScenes: [],
      strongestScenes: [],
      improvementRecommendations: []
    };

    if (!scenes || scenes.length === 0) return analytics;

    scenes.forEach(scene => {
      const inc = (obj: any, key: string) => {
        if (!key) return;
        obj[key] = (obj[key] || 0) + 1;
      };

      inc(analytics.cameraUsage, scene.cameraMovement);
      inc(analytics.lensUsage, scene.cameraLens);
      inc(analytics.environmentDistribution, scene.environment);
      inc(analytics.lightingDistribution, scene.lighting);
      inc(analytics.transitionDistribution, scene.transitionNotes || scene.transitionSuggestions);
      inc(analytics.musicDistribution, scene.musicNotes);
      inc(analytics.emotionDistribution, scene.emotion);
      inc(analytics.promptConceptDistribution, scene.aiPrompt ? "Generated" : "Missing");
      
      const broll = scene.brollSuggestions ? scene.brollSuggestions[0] : scene.brollNotes;
      inc(analytics.brollDistribution, broll);
    });

    // Check for massive over-usage of any single item
    const checkOveruse = (obj: any, threshold: number, name: string) => {
      Object.keys(obj).forEach(key => {
        if (obj[key] >= threshold) {
          analytics.improvementRecommendations.push(
            `Reduce usage of ${name} "${key}" (used ${obj[key]} times). Target cinematic variety.`
          );
        }
      });
    };

    const threshold = Math.max(3, Math.floor(scenes.length / 4));
    checkOveruse(analytics.environmentDistribution, threshold, "Environment");
    checkOveruse(analytics.cameraUsage, threshold, "Camera Movement");
    checkOveruse(analytics.lensUsage, threshold, "Lens");

    if (analytics.improvementRecommendations.length === 0) {
      analytics.improvementRecommendations.push("Excellent cinematic distribution. No immediate improvements needed.");
    }

    return analytics;
  }
}
