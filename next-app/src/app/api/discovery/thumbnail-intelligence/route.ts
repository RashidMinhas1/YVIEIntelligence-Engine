import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { 
  OutlierDetectionResponse, 
  ThumbnailFramework,
  Channel
} from "@/lib/types/discovery";
import { knowledgeRepo } from "@/lib/repository";
import crypto from "crypto";

async function POST_handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, outlierData } = body as {
      channel: Channel;
      outlierData: OutlierDetectionResponse;
    };
    
    if (!channel || !outlierData) {
      return NextResponse.json({ error: "Missing required dependencies" }, { status: 400 });
    }

    const provider = getAIProvider();
    
    const outlierContext = outlierData.videos.filter(v => v.isOutlier).map(v => {
      const explanation = typeof v.viralReasoning === 'string' ? v.viralReasoning : v.viralReasoning?.explanation || "No specific reason extracted";
      const emotionalTrigger = typeof v.viralReasoning === 'string' ? "Unknown" : v.viralReasoning?.emotionalTrigger || "Unknown";
      return {
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        reasoning: explanation,
        emotionalTrigger
      };
    });

    if (outlierContext.length === 0) {
      return NextResponse.json({ error: "No outliers to analyze" }, { status: 400 });
    }

    const aiPrompt = `
      You are an elite YouTube Thumbnail Psychologist.
      Your task is to extract exactly 1 highly repeatable "Thumbnail Framework" from the provided Outlier data.
      You must abstract the specific visuals into a reusable template.
      Example DNA: "Face -> Object -> Large Text -> Red Arrow -> Dark Background -> High Contrast"
      
      INPUT DATA:
      === CHANNEL ===
      ${JSON.stringify({ title: channel.title, niche: channel.niche })}
      
      === OUTLIER VIDEOS (SUCCESSFUL PROOFS) ===
      ${JSON.stringify(outlierContext.slice(0, 5))}
      
      Return the output matching this exact JSON schema:
      {
        "frameworkName": "<string>",
        "thumbnailDnaTemplate": "<string like Face -> Object -> Large Text>",
        "visual": {
          "colorPalette": ["<string hex or names>"],
          "contrast": "<High|Medium|Low>",
          "brightness": "<Bright|Balanced|Dark>",
          "saturation": "<High|Medium|Low>",
          "lighting": "<string>",
          "background": "<string>",
          "foreground": "<string>",
          "composition": "<string>",
          "ruleOfThirds": <boolean>,
          "visualBalance": "<string>",
          "negativeSpace": "<High|Medium|Low>",
          "depth": "<string>",
          "blur": "<string>",
          "focus": "<string>",
          "framing": "<string>"
        },
        "subject": {
          "faceDetected": <boolean>,
          "numberOfFaces": <number>,
          "eyeContact": <boolean>,
          "facialEmotion": "<string>",
          "bodyLanguage": "<string>",
          "gesture": "<string>",
          "objectFocus": "<string>",
          "beforeAfterComparison": <boolean>,
          "humanVsObjectRatio": "<string>"
        },
        "typography": {
          "hasText": <boolean>,
          "fontStyle": "<string>",
          "fontWeight": "<string>",
          "fontSize": "<Large|Medium|Small>",
          "readability": "<High|Medium|Low>",
          "placement": "<string>",
          "textDensity": "<High|Medium|Low>",
          "wordCount": <number>,
          "textHierarchy": "<string>",
          "transcribedText": "<string>"
        },
        "psychology": {
          "primaryEmotion": "<Curiosity|Shock|Fear|Surprise|Suspense|Transformation|Status|Money|Urgency|Mystery|Conflict>",
          "emotionalIntensityScore": <0-100>,
          "clickMotivation": "<string>"
        },
        "hook": {
          "primaryHook": "<string>",
          "secondaryHook": "<string>",
          "visualStory": "<string>",
          "viewerAttentionPath": ["<string>"],
          "eyeTrackingPrediction": "<string>"
        },
        "ctrPrediction": {
          "expectedCTR": "<string like 8-12%>",
          "scrollStopScore": <0-100>,
          "clarityScore": <0-100>,
          "emotionScore": <0-100>,
          "curiosityScore": <0-100>,
          "thumbnailQualityScore": <0-100>
        },
        "compatibility": {
          "promiseAlignment": "<High|Medium|Low>",
          "emotionalAlignment": "<High|Medium|Low>",
          "curiosityAlignment": "<High|Medium|Low>",
          "audienceAlignment": "<High|Medium|Low>",
          "mismatches": ["<string>"]
        },
        "whyItWorks": "<string>",
        "whenItWorks": "<string>",
        "whenItFails": "<string>",
        "frequency": <number detected>,
        "confidence": <0-100>,
        "sourceVideos": ["<string exact matched titles>"],
        "knowledgeGraphLinks": [
          { "from": "Thumbnail Framework", "to": "<string>", "relationship": "<string>", "context": "<string>" }
        ]
      }
    `;

    const aiRes = await provider.generateText(aiPrompt, {
      systemPrompt: "You are a master YouTube Thumbnail Psychologist. Output strictly valid JSON matching the schema.",
      responseFormat: "json_object",
      featureKey: "intelligence"
    });

    const parsed = JSON.parse(aiRes);
    
    const now = new Date().toISOString();
    const framework: ThumbnailFramework = {
      id: "thumb_fw_" + crypto.randomUUID(),
      version: "1.0",
      createdAt: now,
      updatedAt: now,
      sourceChannels: [channel.title],
      ...parsed
    };

    // Store it in our Knowledge Repository
    await knowledgeRepo.saveThumbnailFramework(framework);

    return NextResponse.json(framework);

  } catch (error: any) {
    console.error("[Thumbnail Intelligence Extraction] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withErrorHandling(POST_handler);
