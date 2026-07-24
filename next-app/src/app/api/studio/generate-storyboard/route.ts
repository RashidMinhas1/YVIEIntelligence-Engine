import { NextResponse } from "next/server";
import { StoryboardPipeline } from "@/lib/intelligence/storyboard";
import { splitScriptIntoSentences } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  let script: string | string[] = "";
  try {
    const body = await request.json();
    script = body.script;
    const { theme, sceneCount } = body;

    if (!script || !theme) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Pass true for debug if you want to include all the raw planner data in the response
    const debug = false;
    const data = await StoryboardPipeline.execute(script, theme, debug);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Storyboard generation failed:", error);
    console.warn("AI generation failed, returning mock storyboard data as fallback.");
    // Fallback: Split the user's script in half so they don't lose their text
    let scriptPart1 = "Scene 1 content...";
    let scriptPart2 = "Scene 2 content...";
    if (script) {
      if (Array.isArray(script)) {
        if (script.length > 0) {
          const half = Math.ceil(script.length / 2);
          scriptPart1 = script.slice(0, half).join(" ");
          scriptPart2 = script.slice(half).join(" ");
        }
      } else if (typeof script === "string") {
        const sentences = splitScriptIntoSentences(script);
        if (sentences.length > 0) {
          const half = Math.ceil(sentences.length / 2);
          scriptPart1 = sentences.slice(0, half).join(" ");
          scriptPart2 = sentences.slice(half).join(" ");
        } else {
          const half = Math.floor(script.length / 2);
          scriptPart1 = script.slice(0, half);
          scriptPart2 = script.slice(half);
        }
      }
    }

    return NextResponse.json({
      scenes: [
        {
          sceneGoal: "Establish the premise",
          content: scriptPart1,
          brollSuggestions: ["Cinematic wide shot", "Slow pan across landscape"],
          visualNotes: "Dark, moody lighting with high contrast.",
          cameraAngle: "Wide Angle",
          cameraLens: "24mm",
          cameraMovement: "Slow Dolly In",
          composition: "Rule of Thirds",
          lighting: "Low Key",
          colorPalette: "Teal and Orange",
          mood: "Mysterious",
          emotion: "Curiosity",
          environment: "Abandoned warehouse",
          background: "Shadowy corners",
          characterNotes: "Silhouette only",
          onScreenText: "The beginning...",
          subtitleStyle: "Minimalist white",
          motionGraphics: "Subtle dust particles",
          zoomSuggestions: "Slow digital zoom",
          transitionNotes: "Fade to black",
          editingNotes: "Keep cuts slow and deliberate",
          soundEffects: "Low frequency drone",
          musicNotes: "Ambient tension",
          aiPrompt: "Cinematic wide shot of an abandoned warehouse, dark moody lighting, teal and orange color grading, mysterious atmosphere, highly detailed, 8k --ar 16:9",
          negativePrompt: "bright, cheerful, daylight, low quality, blurry",
          thumbnailConsistency: "Maintain high contrast lighting"
        },
        {
          sceneGoal: "Introduce the conflict",
          content: scriptPart2,
          brollSuggestions: ["Close up of hands", "Fast montage"],
          visualNotes: "Brighter, chaotic lighting.",
          cameraAngle: "Close Up",
          cameraLens: "50mm",
          cameraMovement: "Handheld",
          composition: "Center framed",
          lighting: "Harsh directional",
          colorPalette: "Desaturated",
          mood: "Tense",
          emotion: "Anxiety",
          environment: "Cluttered desk",
          background: "Scattered papers",
          characterNotes: "Frantic movement",
          onScreenText: "What went wrong?",
          subtitleStyle: "Bold red",
          motionGraphics: "Glitch effect",
          zoomSuggestions: "Snap zoom",
          transitionNotes: "Glitch transition",
          editingNotes: "Fast paced cuts",
          soundEffects: "Glitch sounds, heart beat",
          musicNotes: "Fast tempo electronic",
          aiPrompt: "Close up of a cluttered desk with scattered papers, harsh directional lighting, desaturated colors, tense atmosphere, highly detailed, 8k --ar 16:9",
          negativePrompt: "clean, organized, calm, low quality",
          thumbnailConsistency: "Keep glitch motif"
        }
      ]
    }, { status: 200 });
  }
}
