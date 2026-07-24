import { callAI } from "@/lib/ai";
import { StoryAnalysis, VisualBeat, ProductionPlan } from "../types/pipeline";

export class GlobalStoryPlanner {
  /**
   * Generates a single unified ProductionPlan based on the StoryAnalysis and VisualBeats.
   * Consolidates all planning (Location, Camera, Lighting, Music, Emotion, etc.) into one LLM call.
   */
  public static async plan(analysis: StoryAnalysis, beats: VisualBeat[], theme: string): Promise<ProductionPlan> {
    const prompt = `You are the Master Showrunner and Director of Photography for a high-end documentary (Netflix, BBC, MagnatesMedia level).
Your task is to create a complete PRODUCTION PLAN for this documentary.

STORY ANALYSIS:
Arc: ${analysis.storyArc}
Emotional Arc: ${analysis.emotionalArc}
Climax: ${analysis.climax}
Theme: ${theme}

VISUAL BEATS:
${beats.map(b => `[ID: ${b.id}] - Emotion: ${b.emotion} - Idea: ${b.cinematicIdea} - Goal: ${b.visualGoal}`).join("\n")}

YOUR INSTRUCTIONS:
Do NOT generate the actual storyboard yet.
You must construct a global plan that maps out exactly how the visual and auditory style will evolve across these beats.
Ensure extreme visual diversity. Do not overuse "Desk" or "50mm".
Plan the camera angles, lenses, lighting, and music specifically for each beat ID provided above.

Return ONLY a JSON object matching this schema exactly:
{
  "storyStructure": {
    "opening": "Strategy for the opening hook",
    "setup": "Strategy for the setup phase",
    "conflict": "Strategy for the conflict phase",
    "investigation": "Strategy for the investigation",
    "discovery": "Strategy for the discovery",
    "climax": "Strategy for the climax",
    "resolution": "Strategy for the resolution"
  },
  "visualStrategy": {
    "documentaryStyle": "Overall visual style",
    "pacing": "Overall pacing strategy",
    "visualRhythm": "How visuals flow",
    "editingRhythm": "How cuts flow"
  },
  "beatPlans": {
    "beat_1": {
      "location": "A highly specific environment (e.g. Dark Archive Room)",
      "cameraAngle": "e.g. High Angle",
      "cameraMovement": "e.g. Slow Push In",
      "focalLength": "e.g. 24mm",
      "lightingStyle": "e.g. Low-key, moody",
      "composition": "e.g. Rule of thirds, negative space",
      "colorPalette": "e.g. Cool blues and greens",
      "transitionToNext": "e.g. J-Cut to next scene",
      "music": "e.g. Low frequency synth drone",
      "soundDesign": "e.g. Distant wind, paper shuffling",
      "emotion": "e.g. Isolation",
      "retentionHook": "Why the viewer will keep watching",
      "visualMetaphor": "A symbolic imagery idea for this beat"
    }
    // YOU MUST INCLUDE A PLAN FOR EVERY BEAT ID PROVIDED
  }
}`;

    const rawResponse = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (e) {
      const cleanResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleanResponse);
    }

    return data as ProductionPlan;
  }
}
