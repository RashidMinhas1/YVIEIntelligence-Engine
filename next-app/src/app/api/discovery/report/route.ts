import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { IntelligenceReport, Channel, SimilarChannelsResponse, OutlierDetectionResponse } from "@/lib/types/discovery";
import { resolveChannelId, fetchCompetitorVideos } from "@/lib/youtube";
import { generateChannelDNA } from "@/lib/discovery/engine";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

async function POST_handler(request: NextRequest) {
  try {
    const body = await request.json();
    let { channelId, channel, similarData, outlierData } = body as {
      channelId?: string;
      channel?: Channel;
      similarData?: SimilarChannelsResponse;
      outlierData?: OutlierDetectionResponse;
    };
    
    if (!channelId && channel) channelId = channel.id;
    if (!channelId) {
      return NextResponse.json({ error: "Missing channel data or ID" }, { status: 400 });
    }

    // Fallback fetching if standalone mode
    if (!channel) {
      const resolvedId = await resolveChannelId(channelId, YOUTUBE_API_KEY);
      const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      channelsUrl.searchParams.set("part", "snippet,statistics,topicDetails");
      channelsUrl.searchParams.set("id", resolvedId);
      channelsUrl.searchParams.set("key", YOUTUBE_API_KEY);
      const res = await fetch(channelsUrl.toString());
      const data = await res.json();
      const item = data.items?.[0];
      if (!item) throw new Error("Channel not found");
      
      channel = {
        id: item.id,
        title: item.snippet.title,
        handle: item.snippet.customUrl || item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        subscriberCount: parseInt(item.statistics.subscriberCount || "0", 10),
        videoCount: parseInt(item.statistics.videoCount || "0", 10),
        viewCount: parseInt(item.statistics.viewCount || "0", 10),
        country: item.snippet.country,
        language: item.snippet.defaultLanguage,
        publishedAt: item.snippet.publishedAt,
        topics: item.topicDetails?.topicCategories || [],
      };
      
      const { videos } = await fetchCompetitorVideos([channel.id], YOUTUBE_API_KEY, 15);
      channel.dna = generateChannelDNA(channel, videos);
      (channel as any).recentVideos = videos;
    }

    const provider = getAIProvider();
    
    const sourceDataVersion = String(Date.now());

    const aiPrompt = `
      You are an Enterprise YouTube Intelligence Engine.
      Generate a deep psychological and strategic Intelligence Report for this channel.
      
      === TARGET CHANNEL ===
      Title: ${channel.title}
      Handle: ${channel.handle}
      Subs: ${channel.subscriberCount}
      Views: ${channel.viewCount}
      Description: ${channel.description}
      DNA: ${JSON.stringify(channel.dna)}
      Recent Videos: ${JSON.stringify((channel as any).recentVideos?.map((v: any) => v.title) || [])}
      
      Generate a standalone IntelligenceReport strictly matching the JSON schema. Include:
      Niche, Sub-Niche, Audience, Viewer Psychology, Title Psychology, Thumbnail Psychology, Hooks, Storytelling, SEO, Editing Style, Publishing Strategy, Growth, Weaknesses, Strengths, Risks, Opportunities, Action Plan, Repeatable Formula.

      {
        "executiveSummary": {
          "overallHealth": "<string>",
          "growthStage": "<string>",
          "biggestOpportunities": ["<string>"],
          "biggestRisks": ["<string>"]
        },
        "channelProfile": {
          "primaryNiche": "<string>",
          "secondaryNiche": "<string>",
          "audienceProfile": "<string>",
          "contentPillars": ["<string>"],
          "uploadStrategy": "<string>"
        },
        "competitorLandscape": {
          "summary": "<string>",
          "directCompetitors": ["<string>"],
          "aspirationalCompetitors": ["<string>"],
          "marketPositioning": "<string>",
          "competitiveAdvantages": ["<string>"],
          "weaknesses": ["<string>"]
        },
        "viralFormula": {
          "titles": ["<string>"],
          "hooks": ["<string>"],
          "storytelling": ["<string>"],
          "thumbnails": ["<string>"],
          "uploadTiming": "<string>",
          "topics": ["<string>"],
          "emotionalTriggers": ["<string>"]
        },
        "contentGapAnalysis": {
          "competitorTopics": ["<string>"],
          "missedOpportunities": ["<string>"],
          "emergingTrends": ["<string>"],
          "evergreenOpportunities": ["<string>"]
        },
        "growthRoadmap": {
          "quickWins": [{"title": "<string>", "description": "<string>", "impact": "High"|"Medium"|"Low", "difficulty": "High"|"Medium"|"Low", "expectedGrowth": "<string>", "confidenceScore": <number>}],
          "thirtyDayImprovements": [...],
          "ninetyDayStrategy": [...],
          "longTermStrategy": [...]
        },
        "evidenceBasedRecommendations": [
          {"recommendation": "<string>", "evidence": "<string>", "sourceModule": "<string>", "confidenceScore": <number>}
        ],
        "contradictionsDetected": [
          {"issue": "<string>", "moduleA": {"name": "<string>", "claim": "<string>"}, "moduleB": {"name": "<string>", "claim": "<string>"}, "resolution": "<string>"}
        ]
      }
    `;

    const aiRes = await provider.generateText(aiPrompt, {
      systemPrompt: "You are an expert YouTube Intelligence system. Output strictly valid JSON without markdown wrapping.",
      responseFormat: "json_object",
      featureKey: "intelligence"
    });

    const reportData = JSON.parse(aiRes);

    const report: IntelligenceReport = {
      id: `rep_${Date.now()}_${channel.id}`,
      channelId: channel.id,
      meta: {
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        aiModel: "primary-intelligence-model", // Represents provider model
        sourceDataVersion
      },
      ...reportData
    };

    return NextResponse.json(report);

  } catch (error: any) {
    console.error("[Intelligence Report] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withErrorHandling(POST_handler);
