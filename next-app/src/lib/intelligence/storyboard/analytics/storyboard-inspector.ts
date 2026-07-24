export class StoryboardInspector {
  public static inspect(scenes: any[], validationReport: any): any[] {
    const inspectedScenes: any[] = [];
    const invalidSceneMap = new Map();
    
    if (validationReport && validationReport.invalidScenes) {
      validationReport.invalidScenes.forEach((inv: any) => {
        invalidSceneMap.set(inv.sceneIndex, inv.reasons);
      });
    }

    scenes.forEach((scene, index) => {
      const isInvalid = invalidSceneMap.has(index);
      
      inspectedScenes.push({
        sceneNumber: index + 1,
        validationStatus: isInvalid ? "Failed" : "Passed",
        similarityScore: Math.random() * 20, // Mock for now, would be calculated from real memory
        diversityScore: isInvalid ? 40 : 95,
        camera: scene.cameraMovement,
        lens: scene.cameraLens,
        lighting: scene.lighting,
        environment: scene.environment,
        emotion: scene.emotion,
        promptSimilarity: `${Math.floor(Math.random() * 20)}%`, // Mock
        regenerationCount: isInvalid ? 1 : 0,
        validationErrors: isInvalid ? invalidSceneMap.get(index) : [],
        passFail: !isInvalid
      });
    });

    return inspectedScenes;
  }
}
