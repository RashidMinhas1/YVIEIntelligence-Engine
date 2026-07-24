import { callAI } from "@/lib/ai";
import { StoryAnalysis, VisualBeat, ProductionPlan, SceneMemoryState } from "../types/pipeline";

export class SceneGenerator {
  /**
   * Generates a single storyboard scene by enforcing the Production Plan and consulting Scene Memory.
   */
  public static async generate(
    beat: VisualBeat,
    plan: ProductionPlan,
    analysis: StoryAnalysis,
    memory: SceneMemoryState[],
    globalTheme: string
  ): Promise<any> {
    const beatPlan = plan.beatPlans[beat.id];
    
    // If somehow the planner missed this beat, create a generic fallback plan
    const safePlan = beatPlan || {
      location: "Abstract environment",
      cameraAngle: "Mid Shot",
      cameraMovement: "Locked",
      focalLength: "50mm",
      lightingStyle: "Standard",
      composition: "Centered",
      colorPalette: "Neutral",
      transitionToNext: "Cut",
      music: "Ambient",
      soundDesign: "Room tone",
      emotion: beat.emotion || "Neutral",
      retentionHook: "Visual intrigue",
      visualMetaphor: "None"
    };

    const recentMemory = memory.slice(-3); // Only pass the last 3 scenes to avoid context bloat

    const prompt = `You are a Netflix-level Cinematic AI Prompt Engineer and Storyboard Artist.
Your task is to generate ONE complete JSON storyboard scene for the current visual beat.

YOU MUST OBEY THE MASTER PRODUCTION PLAN:
Location: ${safePlan.location}
Camera Angle: ${safePlan.cameraAngle}
Camera Movement: ${safePlan.cameraMovement}
Lens: ${safePlan.focalLength}
Lighting: ${safePlan.lightingStyle}
Composition: ${safePlan.composition}
Color Palette: ${safePlan.colorPalette}
Transition: ${safePlan.transitionToNext}
Music: ${safePlan.music}
Sound Design: ${safePlan.soundDesign}
Visual Metaphor: ${safePlan.visualMetaphor}
Emotion: ${safePlan.emotion}

CURRENT BEAT TO ADAPT:
Narration: "${beat.narration}"
Cinematic Idea: "${beat.cinematicIdea}"
Visual Goal: "${beat.visualGoal}"

RECENT SCENE MEMORY (DO NOT COPY THESE):
${recentMemory.map((m, i) => `- Scene -${recentMemory.length - i}: Location: ${m.location}, Lens: ${m.lens}, Camera: ${m.camera}`).join("\n")}

YOUR TASK:
Return a single JSON object (NOT AN ARRAY) for this scene that exactly matches the expected UI schema:
{
  "sceneGoal": "Why this scene exists based on the Visual Goal",
  "content": "The EXACT narration provided",
  "brollSuggestions": ["3 highly specific broll ideas"],
  "visualNotes": "Describe the scene based on the Production Plan",
  "cameraAngle": "${safePlan.cameraAngle}",
  "cameraLens": "${safePlan.focalLength}",
  "cameraMovement": "${safePlan.cameraMovement}",
  "composition": "${safePlan.composition}",
  "lighting": "${safePlan.lightingStyle}",
  "colorPalette": "${safePlan.colorPalette}",
  "mood": "${safePlan.emotion}",
  "emotion": "${safePlan.emotion}",
  "environment": "${safePlan.location}",
  "background": "Specific details of the background",
  "characterNotes": "What subjects are doing",
  "onScreenText": "Cinematic text (if applicable, else empty)",
  "subtitleStyle": "Cinematic subtitle description",
  "motionGraphics": "Any motion graphics needed",
  "zoomSuggestions": "Digital zoom instructions",
  "transitionNotes": "${safePlan.transitionToNext}",
  "editingNotes": "Instructions for the editor",
  "soundEffects": "${safePlan.soundDesign}",
  "musicNotes": "${safePlan.music}",
  "aiPrompt": "A highly detailed Midjourney/Stable Diffusion prompt combining subject, ${safePlan.location}, ${safePlan.lightingStyle}, ${safePlan.focalLength}, ${safePlan.cameraAngle}, cinematic lighting, photorealistic, 8k --ar 16:9",
  "negativePrompt": "text, watermark, ugly, deformed, cartoon",
  "thumbnailConsistency": "Notes on keeping it consistent with the global theme"
}
`;

    const rawResponse = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (e) {
      const cleanResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleanResponse);
    }

    return data;
  }
}
