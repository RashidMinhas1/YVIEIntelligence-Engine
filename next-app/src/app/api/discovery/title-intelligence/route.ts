import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { 
  DeepContentIntelligenceResponse, 
  OutlierDetectionResponse, 
  TitleFramework,
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
    
    if (!channel || !outlierData) {
      return NextResponse.json({ error: "Missing required dependencies" }, { status: 400 });
    }

    const provider = getAIProvider();
    
    const outlierTitles = outlierData.videos.filter(v => v.isOutlier).map(v => v.title);
    if (outlierTitles.length === 0) {
      return NextResponse.json({ error: "No outlier titles to analyze" }, { status: 400 });
    }

    const aiPrompt = `
      You are an elite YouTube Title Psychologist.
      Your task is to extract exactly 1 highly repeatable "Title Framework" from the provided Outlier Titles and Channel context.
      You must abstract the specific title into a reusable template.
      Example: "I Survived 50 Hours In Antarctica" -> "I [Action] [Time] [Extreme Situation]"
      
      INPUT DATA:
      === CHANNEL ===
      ${JSON.stringify({ title: channel.title, niche: channel.niche })}
      
      === DEEP CONTENT INTELLIGENCE ===
      ${deepIntel ? JSON.stringify({ psych: deepIntel.audiencePsychology }) : "Not available"}
      
      === OUTLIER TITLES (SUCCESSFUL PROOFS) ===
      ${JSON.stringify(outlierTitles)}
      
      Return the output matching this exact JSON schema:
      {
        "frameworkName": "<string>",
        "template": "<string template like I [Action] [Time]>",
        "exampleUsed": "<string matching a real title from the outliers>",
        "primaryIntent": "<Must be one of: Curiosity, Fear, Shock, Education, Documentary, Mystery, Transformation, Money, Warning, Comparison, Story, Proof, Challenge, News, Review>",
        "secondaryIntent": "<Must be one of the above intents>",
        "promise": {
          "explicitPromise": "<string>",
          "hiddenPromise": "<string>",
          "viewerExpectation": "<string>",
          "expectedPayoff": "<string>",
          "scriptAlignment": "<High|Medium|Low>"
        },
        "curiosity": {
          "curiosityStrength": <0-100>,
          "curiosityOpening": "<string>",
          "curiosityClosing": "<string>",
          "informationGap": "<string>",
          "clickMotivation": "<string>"
        },
        "emotion": {
          "detectedEmotions": ["<Fear|Excitement|Surprise|Greed|Hope|Suspense|Anxiety|Relief|Inspiration>"],
          "emotionalIntensityScore": <0-100>
        },
        "audience": {
          "experienceLevel": "<Beginner|Intermediate|Advanced|Universal>",
          "ageGroup": "<string>",
          "viewerIntent": "<string>",
          "knowledgeLevel": "<string>"
        },
        "ctrPrediction": {
          "expectedCTR": "<string like 8-12%>",
          "clickProbability": <0-100>,
          "scrollStopScore": <0-100>,
          "firstImpressionScore": <0-100>
        },
        "novelty": "<string>",
        "numberUsage": "<string>",
        "timeUsage": "<string>",
        "frequency": <number detected>,
        "successRate": <0-100>,
        "averageViews": <number estimate>,
        "averageOutlierScore": <number estimate>,
        "repeatability": <0-100>,
        "reliability": <0-100>,
        "confidence": <0-100>,
        "difficulty": <0-100>,
        "risk": <0-100>,
        "sourceVideos": ["<string exact matched titles>"],
        "knowledgeGraphLinks": [
          { "from": "Title Template", "to": "<string>", "relationship": "<string>", "context": "<string>" }
        ]
      }
    `;

    const aiRes = await provider.generateText(aiPrompt, {
      systemPrompt: "You are a master YouTube Title Psychologist. Output strictly valid JSON matching the schema.",
      responseFormat: "json_object",
      featureKey: "intelligence"
    });

    const parsed = JSON.parse(aiRes);
    
    const now = new Date().toISOString();
    const framework: TitleFramework = {
      id: "title_fw_" + crypto.randomUUID(),
      version: "1.0",
      createdAt: now,
      updatedAt: now,
      sourceChannels: [channel.title],
      ...parsed
    };

    // Store it in our Knowledge Repository
    await knowledgeRepo.saveTitleFramework(framework);

    return NextResponse.json(framework);

  } catch (error: any) {
    console.error("[Title Intelligence Extraction] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withErrorHandling(POST_handler);
