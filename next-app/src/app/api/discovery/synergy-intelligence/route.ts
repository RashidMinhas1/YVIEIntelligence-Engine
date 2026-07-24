import { withErrorHandling } from "@/lib/api-wrapper";
import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { knowledgeRepo } from "@/lib/repository";
import crypto from "crypto";
import { SynergyFramework, TitleFramework, ThumbnailFramework } from "@/lib/types/discovery";

const synergySystemPrompt = `
You are an Elite YouTube Synergy Engineer and Click Package Psychologist.
Your goal is to evaluate the relationship between a Video Title, its Thumbnail, and the Viewer Psychology as a SINGLE Click Package.
Do NOT analyze the title or thumbnail in isolation. Focus purely on their synergy, alignment, and expected performance.

You will be provided with the existing Title DNA and Thumbnail DNA.

Extract the Synergy Framework following this exact JSON structure:
{
  "frameworkName": "Name of this synergy pattern (e.g., The Curiosity Gap Package)",
  "titleFormula": "The underlying title formula used",
  "thumbnailFormula": "The underlying thumbnail formula used",
  "psychologicalFormula": "How the two work together to force a click",
  
  "promiseLifecycle": {
    "titlePromise": "What the title explicitly promises",
    "thumbnailPromise": "What the thumbnail visually promises",
    "hookDelivery": "How the hook should deliver this promise",
    "storyProgression": "How the story should unfold based on the click package",
    "finalPayoff": "The expected payoff",
    "alignmentScore": 95,
    "mismatchScore": 5,
    "contradictions": ["Any detected contradictions between title and thumbnail"],
    "issues": ["Over-promising", "Premature payoff"]
  },
  
  "psychologicalConsistency": {
    "curiosityAlignment": 90,
    "fearAlignment": 0,
    "shockAlignment": 50,
    "surpriseAlignment": 80,
    "statusAlignment": 0,
    "moneyAlignment": 0,
    "mysteryAlignment": 85,
    "conflictAlignment": 0,
    "transformationAlignment": 0,
    "overallAlignmentScore": 92,
    "conflictScore": 5,
    "reinforcementScore": 95
  },
  
  "audienceConsistency": {
    "titleTargetSkillLevel": "Beginner",
    "thumbnailTargetSkillLevel": "Beginner",
    "titleTargetIntent": "Learn",
    "thumbnailTargetIntent": "Learn",
    "titleTargetMotivation": "Save time",
    "thumbnailTargetMotivation": "Save time",
    "titleTargetPainPoints": ["Wasting time"],
    "thumbnailTargetPainPoints": ["Overwhelm"],
    "titleExpectedOutcome": "Mastery",
    "thumbnailExpectedOutcome": "Mastery",
    "audienceMatchScore": 98,
    "mismatches": []
  },
  
  "ctrPrediction": {
    "titleCtrScore": 88,
    "thumbnailCtrScore": 92,
    "combinedCtrPrediction": "10-15%",
    "synergyScore": 94,
    "scrollStopProbability": 95,
    "clickProbability": 85,
    "ignoreProbability": 5,
    "explanation": "Why this specific combination will or won't work"
  },
  
  "storyConsistency": {
    "transitions": [
      {
        "from": "Title",
        "to": "Thumbnail",
        "isConsistent": true,
        "reason": "Visually reinforces the title's claim"
      }
    ],
    "brokenTransitions": []
  },
  
  "confidence": 92,
  
  "knowledgeGraphLinks": [
    {
      "nodeId": "title_x",
      "nodeType": "Title",
      "relationship": "supported_by"
    }
  ]
}

Return ONLY valid JSON.
`;

async function POST_handler(req: Request) {
  try {
    const { titleFramework, thumbnailFramework, channelId, videoIds = [] } = await req.json();

    if (!titleFramework || !thumbnailFramework) {
      return NextResponse.json({ error: "Missing Title or Thumbnail Framework data" }, { status: 400 });
    }

    const payload = {
      titleDNA: titleFramework,
      thumbnailDNA: thumbnailFramework
    };

    const ai = getAIProvider();
    const completion = await ai.generateText(
      JSON.stringify(payload),
      {
        systemPrompt: synergySystemPrompt,
        responseFormat: "json_object",
        featureKey: "intelligence"
      }
    );

    let extractedData;
    try {
      const cleaned = completion.replace(/```json/g, "").replace(/```/g, "").trim();
      extractedData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse synergy DNA:", completion);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const synergyFramework: SynergyFramework = {
      id: crypto.randomUUID(),
      version: "1.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...extractedData,
      frequency: 1,
      sourceChannels: channelId ? [channelId] : [],
      sourceVideos: videoIds,
    };

    await knowledgeRepo.saveSynergyFramework(synergyFramework);

    return NextResponse.json({ success: true, synergyFramework });
  } catch (err: any) {
    console.error("Synergy Extraction Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = withErrorHandling(POST_handler);
