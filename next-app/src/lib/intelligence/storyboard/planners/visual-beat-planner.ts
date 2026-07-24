import { callAI } from "@/lib/ai";
import { StoryAnalysis, VisualBeat } from "../types/pipeline";

export class VisualBeatPlanner {
  /**
   * Converts the script into visual beats, strictly adhering to one cinematic idea per beat.
   */
  public static async plan(script: string | string[], analysis: StoryAnalysis): Promise<VisualBeat[]> {
    const rawScript = Array.isArray(script) ? script.join("\n\n") : script;

    const prompt = `You are a Hollywood Storyboard Artist and Editor.
Convert the following documentary script into a sequence of VISUAL BEATS.

SCRIPT:
"""
${rawScript}
"""

STORY ANALYSIS CONTEXT:
Locations: ${analysis.locations.join(", ")}
Emotional Arc: ${analysis.emotionalArc}
Climax: ${analysis.climax}

YOUR TASK:
Break the script down into cinematic visual beats.
A visual beat is ONE cinematic idea. NEVER split just by punctuation. Split by visual opportunities.
Do NOT summarize the script. The entire script must be mapped to beats.

Return ONLY a JSON object with the following schema:
{
  "beats": [
    {
      "id": "beat_1",
      "narration": "The exact script lines spoken during this beat",
      "cinematicIdea": "A detailed description of the visuals (e.g., 'Empty apartment. Phone ringing. Rain outside.')",
      "visualGoal": "Why this beat exists visually (e.g., 'Establish isolation')",
      "emotion": "The core emotion of this beat (e.g., 'Isolation')",
      "priority": "High, Medium, or Low (High for climax/hooks, Low for bridges)",
      "estimatedDuration": "Number of seconds (e.g., 4)"
    }
  ]
}`;

    const rawResponse = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (e) {
      const cleanResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleanResponse);
    }

    return data.beats as VisualBeat[];
  }
}
