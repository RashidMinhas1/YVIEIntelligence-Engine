import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { Channel, ChannelComparison, CompareMatrixResponse } from "@/lib/types/discovery";
import { getAIProvider } from "@/lib/ai/factory";

async function POST_handler(request: NextRequest) {
  try {
    const body = await request.json();
    const channels: Channel[] = body.channels;
    
    if (!channels || channels.length < 2) {
      return NextResponse.json({ error: "At least two channels are required for comparison." }, { status: 400 });
    }

    const provider = getAIProvider();
    
    const aiPrompt = `
      You are an expert YouTube analyst.
      Compare the following YouTube channels and generate a comprehensive comparison matrix.
      Evaluate their strengths, weaknesses, target audience, upload style, and predict their viral probability (0-100).
      
      Channels:
      ${JSON.stringify(channels.map(c => ({
        id: c.id, 
        title: c.title, 
        subs: c.subscriberCount, 
        views: c.viewCount, 
        desc: c.description.slice(0, 300),
        dna: c.dna
      })))}
      
      Respond STRICTLY in JSON format matching this schema:
      {
        "comparisons": {
          "[channel_id]": {
            "titlePsychology": "<string>",
            "thumbnailPsychology": "<string>",
            "audienceDemographic": "<string>",
            "hookStyle": "<string>",
            "storytelling": "<string>",
            "editingStyle": "<string>",
            "uploadPattern": "<string>",
            "publishingStrategy": "<string>",
            "viralFormula": "<string>",
            "strengths": ["<string>"],
            "weaknesses": ["<string>"],
            "opportunities": ["<string>"],
            "viralProbabilityScore": <number 0-100>
          }
        }
      }
    `;

    const aiRes = await provider.generateText(aiPrompt, {
      systemPrompt: "You are a professional YouTube analyst. Output only valid JSON.",
      responseFormat: "json_object",
      featureKey: "intelligence"
    });

    const aiAnalysis = JSON.parse(aiRes).comparisons;

    const comparisons: ChannelComparison[] = channels.map(c => {
      const insight = aiAnalysis[c.id];
      if (!insight) {
        return {
          channel: c,
          titlePsychology: "Unknown",
          thumbnailPsychology: "Unknown",
          audienceDemographic: "Unknown",
          hookStyle: "Unknown",
          storytelling: "Unknown",
          editingStyle: "Unknown",
          uploadPattern: "Unknown",
          publishingStrategy: "Unknown",
          viralFormula: "Unknown",
          strengths: ["Data unavailable"],
          weaknesses: ["Data unavailable"],
          opportunities: ["Data unavailable"],
          viralProbabilityScore: 0
        };
      }
      return {
        channel: c,
        ...insight
      };
    });

    return NextResponse.json({
      comparisons
    });
  } catch (error: any) {
    console.error("Compare API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to compare channels" }, { status: 500 });
  }
}

export const POST = withErrorHandling(POST_handler);
