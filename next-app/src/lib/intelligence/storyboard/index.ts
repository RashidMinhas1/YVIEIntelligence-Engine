import { StoryAnalyzer } from "./planners/story-analyzer";
import { VisualBeatPlanner } from "./planners/visual-beat-planner";
import { GlobalStoryPlanner } from "./planners/global-story-planner";
import { SceneGenerator } from "./generators/scene-generator";
import { ValidationEngine } from "./validators/validation-engine";
import { SceneRegenerator } from "./generators/scene-regenerator";
import { VisualMemoryManager } from "./utils/visual-memory-manager";
import { ProductionAnalytics } from "./analytics/production-analytics";
import { StoryboardInspector } from "./analytics/storyboard-inspector";
import { PromptOptimizer } from "./optimizers/prompt-optimizer";
import { DebugPayload } from "./types/pipeline";

export class StoryboardPipeline {
  /**
   * Orchestrates the entire production pipeline.
   * Plan -> Generate -> Validate -> Regenerate -> Score
   */
  public static async execute(script: string | string[], theme: string, debug: boolean = false): Promise<any> {
    console.log("[Pipeline] Phase 2A: Story Analysis...");
    const analysis = await StoryAnalyzer.analyze(script, theme);

    console.log("[Pipeline] Phase 2A: Visual Beat Planning...");
    const beats = await VisualBeatPlanner.plan(script, analysis);

    console.log("[Pipeline] Phase 2B: Global Story Planning...");
    const productionPlan = await GlobalStoryPlanner.plan(analysis, beats, theme);

    console.log("[Pipeline] Phase 2C: Scene Generation...");
    const memoryManager = new VisualMemoryManager();
    const generatedScenes: any[] = [];
    
    // Generate scenes sequentially to allow memory updates (or in parallel if strict memory tracking per-batch is allowed)
    // For extreme strictness, sequential generation ensures Scene 3 knows about Scene 2.
    for (const beat of beats) {
      const scene = await SceneGenerator.generate(beat, productionPlan, analysis, memoryManager.getMemory(), theme);
      generatedScenes.push(scene);
      
      // We push a partial state to memory so the next iteration knows what was just generated
      memoryManager.addScene({
        environment: scene.environment || "",
        location: scene.location || scene.environment || "",
        camera: scene.cameraMovement || "",
        movement: scene.cameraMovement || "",
        angle: scene.cameraAngle || "",
        lens: scene.cameraLens || "",
        lighting: scene.lighting || "",
        composition: scene.composition || "",
        transition: scene.transitionNotes || "",
        music: scene.musicNotes || "",
        broll: scene.brollSuggestions ? scene.brollSuggestions.join(" ") : "",
        aiPrompt: scene.aiPrompt || "",
        emotion: scene.emotion || "",
        mood: scene.mood || "",
        visualMetaphor: scene.visualMetaphor || ""
      });
    }

    console.log("[Pipeline] Phase 2D: Validation & Scoring...");
    let currentScenes = generatedScenes;
    let validationReport = ValidationEngine.validateScenes(currentScenes);
    let attempts = 0;
    let regeneratedScenesCount = 0;
    const MAX_ATTEMPTS = 3;
    const diffReport: any[] = [];
    const startTime = Date.now();

    while (validationReport.metrics.overallScore < 90 && attempts < MAX_ATTEMPTS) {
      console.log(`[Pipeline] Validation Run ${attempts + 1} Failed. Score: ${validationReport.metrics.overallScore}`);
      
      const regenerated = await SceneRegenerator.regenerateScenes(validationReport.invalidScenes, theme);
      
      regenerated.forEach(reg => {
        // Log diff
        diffReport.push({
          sceneIndex: reg.index,
          originalScene: currentScenes[reg.index],
          regeneratedScene: reg.scene,
          changes: "Regenerated to fix duplication/score"
        });
        currentScenes[reg.index] = reg.scene;
        regeneratedScenesCount++;
      });

      validationReport = ValidationEngine.validateScenes(currentScenes);
      attempts++;
    }

    if (validationReport.metrics.overallScore >= 90) {
      console.log(`[Pipeline] Success! Final Production Score: ${validationReport.metrics.overallScore}`);
    } else {
      console.warn(`[Pipeline] Max retries reached. Returning best effort. Final Score: ${validationReport.metrics.overallScore}`);
    }

    const executionTimeMs = Date.now() - startTime;

    // Optional Prompt Optimization step
    currentScenes = currentScenes.map(scene => {
      const optimized = PromptOptimizer.optimize(scene.aiPrompt || "", "");
      scene.aiPrompt = optimized.optimizedPrompt;
      return scene;
    });

    const result: any = {
      scenes: currentScenes,
      validationMetrics: validationReport.metrics
    };

    if (debug) {
      const debugPayload: DebugPayload = {
        storyAnalysis: analysis,
        visualBeats: beats,
        productionPlan,
        validationReport,
        productionAnalytics: ProductionAnalytics.generate(currentScenes),
        storyboardInspector: StoryboardInspector.inspect(currentScenes, validationReport),
        diffReport,
        pipelineMetrics: {
          executionTimeMs,
          aiCalls: 3 + attempts, // Analyzer + BeatPlanner + GlobalPlanner + Regeneration calls
          validationFailures: attempts,
          regeneratedScenes: regeneratedScenesCount,
          overallProductionScore: validationReport.metrics.overallScore
        }
      };
      
      result.debug = debugPayload;
    }

    return result;
  }
}
