import { callAI } from "@/lib/ai";
import { StoryAnalysis } from "../types/pipeline";

export class StoryAnalyzer {
  /**
   * Analyzes the raw script and returns a structured StoryAnalysis object.
   */
  public static async analyze(script: string | string[], theme: string): Promise<StoryAnalysis> {
    const rawScript = Array.isArray(script) ? script.join("\n\n") : script;

    const prompt = `You are a Senior Documentary Director and Story Analyst.
Analyze the following documentary script.

SCRIPT:
"""
${rawScript}
"""

THEME: "${theme}"

YOUR TASK:
Extract and define the core narrative structure of this story.
Identify the locations, characters, emotional arc, and the overall pacing.

Return ONLY a JSON object with the following schema:
{
  "storyArc": "A brief description of the overall narrative journey (e.g., Rise and fall).",
  "emotionalArc": "How the viewer's emotion should evolve from start to end.",
  "locations": ["List", "of", "all", "primary", "locations", "needed"],
  "characters": ["List", "of", "all", "characters", "or", "subjects"],
  "investigationFlow": "Describe how the mystery or main topic unfolds.",
  "climax": "The peak moment of the story.",
  "ending": "The resolution and final takeaway."
}`;

    const rawResponse = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (e) {
      const cleanResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleanResponse);
    }

    return data as StoryAnalysis;
  }
}
