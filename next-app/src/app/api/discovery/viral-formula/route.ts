import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { 
  DeepContentIntelligenceResponse, 
  OutlierDetectionResponse, 
  ViralFormula,
  Channel
} from "@/lib/types/discovery";
import { knowledgeRepo } from "@/lib/repository";
import crypto from "crypto";

async function POST_handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, deepIntel, outlierData } = body as {
      channel: Channel;
      deepIntel: DeepContentIntelligenceResponse;
      outlierData: OutlierDetectionResponse;
    };
    
    if (!channel || !deepIntel || !outlierData) {
      return NextResponse.json({ error: "Missing required dependencies" }, { status: 400 });
    }

    const provider = getAIProvider();
    
    const aiPrompt = `
      You are an elite YouTube Growth Engineer.
      Your task is to extract reusable "Viral Formulas" from the provided Deep Content Intelligence and Outlier Data.
      Do not just describe the channel. Create a highly structured, reusable formula that can be saved in a Knowledge Base.
      
      INPUT DATA:
      === CHANNEL ===
      ${JSON.stringify({ title: channel.title, niche: channel.niche })}
      
      === DEEP CONTENT INTELLIGENCE ===
      ${JSON.stringify({ dna: deepIntel.contentDNA, psych: deepIntel.audiencePsychology, insights: deepIntel.consultantInsights })}
      
      === OUTLIERS ===
      ${JSON.stringify(outlierData.videos.filter(v => v.isOutlier).map(v => ({ title: v.title, reasoning: v.viralReasoning })))}
      
      Extract exactly 1 master viral formula.
      Return the output matching this exact JSON schema:
      {
        "title": "<string>",
        "description": "<string>",
        "category": "<Must be one of: Evergreen, Documentary, Educational, Entertainment, Finance, Business, Storytelling, News, True Crime, Gaming, Tech, Vlog, Other>",
        "tags": ["<string>"],
        "structure": {
          "topic": "<string>",
          "hook": "<string>",
          "curiosityPattern": "<string>",
          "storyStructure": "<string>",
          "retentionTechnique": "<string>",
          "emotionalTrigger": "<string>",
          "cta": "<string>",
          "viewerOutcome": "<string>"
        },
        "strength": {
          "reliability": <0-100>,
          "repeatability": <0-100>,
          "risk": <0-100>,
          "difficulty": <0-100>,
          "expectedGrowth": <0-100>
        },
        "conditions": {
          "whyItSucceeds": "<string>",
          "whenItSucceeds": "<string>",
          "whenItFails": "<string>",
          "requiredAudience": "<string>",
          "executionQuality": "<string>"
        },
        "sourceVideos": ["<string video titles>"],
        "confidence": <0-100>,
        "frequency": <number>,
        "successRate": <0-100>,
        "knowledgeGraphLinks": [
          { "from": "<string>", "to": "<string>", "relationship": "<string>", "context": "<string>" }
        ]
      }
    `;

    const aiRes = await provider.generateText(aiPrompt, {
      systemPrompt: "You are a master YouTube Formula Engineer. Output strictly valid JSON.",
      responseFormat: "json_object",
      featureKey: "intelligence"
    });

    const parsed = JSON.parse(aiRes);
    
    const now = new Date().toISOString();
    const formula: ViralFormula = {
      id: "form_" + crypto.randomUUID(),
      version: "1.0",
      createdAt: now,
      updatedAt: now,
      sourceChannels: [channel.title],
      evidenceCount: parsed.sourceVideos?.length || 1,
      ...parsed
    };

    // Store it in our Knowledge Repository
    await knowledgeRepo.saveFormula(formula);

    return NextResponse.json(formula);

  } catch (error: any) {
    console.error("[Viral Formula Extraction] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withErrorHandling(POST_handler);
