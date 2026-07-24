import { InvalidScene } from "../types/pipeline";
import { callAI } from "@/lib/ai";

export class SceneRegenerator {
  public static async regenerateScenes(
    invalidScenes: InvalidScene[],
    globalTheme: string
  ): Promise<any[]> {
    const regeneratedScenes = await Promise.all(
      invalidScenes.map(async (invalidScene) => {
        const { sceneIndex, reasons, scene } = invalidScene;
        
        const prompt = `You are a Senior Documentary Director and Editor.
You previously generated a storyboard scene that was REJECTED by the Quality Validation Engine.

REASONS FOR REJECTION:
${reasons.map(r => `- ${r}`).join("\n")}

ORIGINAL SCRIPT CONTENT FOR THIS SCENE:
"${scene.content || scene.narration || ""}"

GLOBAL THEME:
"${globalTheme}"

YOUR TASK:
Generate a BRAND NEW, completely different cinematic solution for this exact script chunk.
You MUST avoid the rejected elements listed above.
If the environment was rejected, pick a totally new environment.
If the lens was rejected, use a completely different focal length.
Ensure the cinematic quality remains at a premium documentary level (Netflix, National Geographic).

Return the response as a single JSON object matching the standard scene schema.
DO NOT wrap it in an array. Just one JSON object for this one scene.`;

        try {
          const rawResponse = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
          let newScene;
          try {
            newScene = JSON.parse(rawResponse);
          } catch (e) {
            const cleanResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            newScene = JSON.parse(cleanResponse);
          }
          
          // Ensure we don't lose the index mapping
          return { index: sceneIndex, scene: newScene };
        } catch (error) {
          console.error(`Failed to regenerate scene ${sceneIndex}`, error);
          // Fallback to the old scene if regeneration completely fails to parse
          return { index: sceneIndex, scene };
        }
      })
    );

    return regeneratedScenes;
  }
}
