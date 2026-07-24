import { NextRequest, NextResponse } from "next/server";
import { Channel, SimilarChannel, SimilarChannelsResponse } from "@/lib/types/discovery";
import { getAIProvider } from "@/lib/ai/factory";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const IS_DEV = process.env.NODE_ENV === "development";

// Hybrid Pipeline Helper: Rule-based ranking
function calculateRuleBasedSimilarity(target: Channel, candidate: Channel): number {
  let score = 50; // Base score
  
  // Size similarity
  if (target.subscriberCount && candidate.subscriberCount) {
    const ratio = Math.min(target.subscriberCount, candidate.subscriberCount) / Math.max(target.subscriberCount, candidate.subscriberCount);
    score += ratio * 20; // Up to 20 points for similar size
  }

  // Views similarity
  if (target.viewCount && candidate.viewCount) {
    const ratio = Math.min(target.viewCount, candidate.viewCount) / Math.max(target.viewCount, candidate.viewCount);
    score += ratio * 10;
  }

  // Country match
  if (target.country && candidate.country && target.country === candidate.country) {
    score += 10;
  }

  // Language match
  if (target.language && candidate.language && target.language === candidate.language) {
    score += 10;
  }

  return Math.min(Math.round(score), 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetChannelId, limit = 10 } = body;
    
    if (!targetChannelId) {
      return NextResponse.json({ error: "Missing targetChannelId" }, { status: 400 });
    }

    let targetChannel: Channel = {} as Channel;
    let candidates: Channel[] = [];
    let source: "live" | "mock" = "live";

    let errorReason: string | undefined = undefined;

    // 1. Rule-Based Candidate Generation
    if (!YOUTUBE_API_KEY) {
      source = "mock";
      errorReason = "API Key Missing";
    } else if (IS_DEV && body.forceMock) {
      source = "mock";
      errorReason = "Forced Mock Mode";
    } else {
      // Priority 1: Live API
      try {
        const targetUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
        targetUrl.searchParams.set("part", "snippet,statistics,topicDetails");
        targetUrl.searchParams.set("id", targetChannelId);
        targetUrl.searchParams.set("key", YOUTUBE_API_KEY);

        const targetRes = await fetch(targetUrl.toString());
        if (!targetRes.ok) {
          let blocker = `HTTP ${targetRes.status} ${targetRes.statusText}`;
          const errBody = await targetRes.json().catch(() => ({}));
          if (errBody?.error?.message) blocker = errBody.error.message;
          if (errBody?.error?.errors?.[0]?.reason) blocker = `${errBody.error.errors[0].reason}: ${blocker}`;
          throw new Error(blocker);
        }
        const targetData = await targetRes.json();
        if (!targetData.items?.[0]) throw new Error("Target channel not found");

        const tItem = targetData.items[0];
        targetChannel = {
          id: tItem.id,
          title: tItem.snippet.title,
          handle: tItem.snippet.customUrl || tItem.snippet.title,
          description: tItem.snippet.description,
          thumbnailUrl: tItem.snippet.thumbnails?.high?.url,
          subscriberCount: parseInt(tItem.statistics.subscriberCount || "0", 10),
          videoCount: parseInt(tItem.statistics.videoCount || "0", 10),
          viewCount: parseInt(tItem.statistics.viewCount || "0", 10),
          country: tItem.snippet.country,
          language: tItem.snippet.defaultLanguage,
          publishedAt: tItem.snippet.publishedAt,
          topics: tItem.topicDetails?.topicCategories || [],
        };

        // Live API: Search for candidates
        const query = targetChannel.topics?.[0]?.split("/").pop() || targetChannel.title;
        const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        searchUrl.searchParams.set("part", "snippet");
        searchUrl.searchParams.set("type", "channel");
        searchUrl.searchParams.set("q", query);
        searchUrl.searchParams.set("maxResults", "30"); // Max candidates
        searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

        const searchRes = await fetch(searchUrl.toString());
        if (!searchRes.ok) {
          if (searchRes.status === 403 || searchRes.status === 429) {
            throw new Error(`YOUTUBE_QUOTA_EXCEEDED`);
          }
          throw new Error(`YouTube Search API Error: ${searchRes.statusText}`);
        }
        const searchData = await searchRes.json();

        if (searchData.items?.length > 0) {
          const channelIds = searchData.items.map((i: any) => i.id.channelId).filter((id: string) => id !== targetChannelId).join(",");
          
          const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
          channelsUrl.searchParams.set("part", "snippet,statistics");
          channelsUrl.searchParams.set("id", channelIds);
          channelsUrl.searchParams.set("key", YOUTUBE_API_KEY);
          
          const channelsRes = await fetch(channelsUrl.toString());
          if (!channelsRes.ok) throw new Error("Failed to fetch channel details");
          const channelsData = await channelsRes.json();
          
          candidates = (channelsData.items || []).map((item: any): Channel => ({
            id: item.id,
            title: item.snippet.title,
            handle: item.snippet.customUrl || item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl: item.snippet.thumbnails?.high?.url,
            subscriberCount: parseInt(item.statistics.subscriberCount || "0", 10),
            videoCount: parseInt(item.statistics.videoCount || "0", 10),
            viewCount: parseInt(item.statistics.viewCount || "0", 10),
            country: item.snippet.country,
            language: item.snippet.defaultLanguage,
            publishedAt: item.snippet.publishedAt,
          }));
        }
      } catch (err: any) {
        source = "mock";
        errorReason = err.message;
      }
    }

    if (source === "mock") {
      targetChannel = {
        id: targetChannelId,
        title: "Target Channel",
        handle: "@targetchannel",
        description: "Target description",
        thumbnailUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${targetChannelId}`,
        subscriberCount: 500000,
        videoCount: 200,
        viewCount: 10000000,
        publishedAt: new Date().toISOString(),
        country: "US",
      };
      
      candidates = Array.from({ length: 30 }).map((_, i) => ({
        id: `cand_${i}`,
        title: `Candidate Channel ${i}`,
        handle: `@candidate_${i}`,
        description: `Description for candidate ${i}`,
        thumbnailUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=cand_${i}`,
        subscriberCount: Math.floor(Math.random() * 1000000),
        videoCount: Math.floor(Math.random() * 500),
        viewCount: Math.floor(Math.random() * 50000000),
        publishedAt: new Date().toISOString(),
        country: ["US", "UK", "CA"][Math.floor(Math.random() * 3)],
      }));
    }

    // 2. Intelligent Ranking (Rule-based)
    const rankedCandidates = candidates
      .map(c => ({ channel: c, score: calculateRuleBasedSimilarity(targetChannel, c) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(c => c.channel);

    // 3. AI Deep Analysis
    const provider = getAIProvider();
    
    // Create a prompt batching all candidates
    const aiPrompt = `
      You are an expert YouTube growth strategist.
      Analyze the following target channel and a list of competitor candidates.
      For each candidate, provide deep intelligence, classification, and growth opportunities.
      Do not just output a score. Explain why it matters, what to copy, what to avoid.
      
      Target Channel:
      Title: ${targetChannel.title}
      Subs: ${targetChannel.subscriberCount}
      Description: ${targetChannel.description.slice(0, 500)}
      
      Candidates:
      ${JSON.stringify(rankedCandidates.map(c => ({
        id: c.id, title: c.title, subs: c.subscriberCount, views: c.viewCount, desc: c.description.slice(0, 300)
      })))}
      
      Respond STRICTLY in JSON format matching this schema:
      {
        "analyses": {
          "[channel_id]": {
            "similarityScore": <number 0-100>,
            "similarityExplanation": "<string explanation of why this competitor matters>",
            "makesItSimilar": "<string>",
            "whereItDiffers": "<string>",
            "whatToCopy": "<string>",
            "whatToAvoid": "<string>",
            "competitorClass": "Direct Competitor" | "Indirect Competitor" | "Inspiration" | "Aspirational" | "Different Audience",
            "growthOpportunity": {
              "betterAt": ["<string>"],
              "worseAt": ["<string>"],
              "missingOpportunities": ["<string>"],
              "contentGaps": ["<string>"],
              "untappedTopics": ["<string>"]
            }
          }
        }
      }
    `;

    const aiRes = await provider.generateText(aiPrompt, {
      systemPrompt: "You are a professional YouTube analyst. Output only valid JSON.",
      responseFormat: "json_object",
      featureKey: "intelligence"
    });

    const aiAnalysis = JSON.parse(aiRes).analyses;

    // Merge AI insights with channel data
    const similarChannels: SimilarChannel[] = rankedCandidates.map(c => {
      const insight = aiAnalysis[c.id];
      if (!insight) {
        return {
          ...c,
          similarityScore: calculateRuleBasedSimilarity(targetChannel, c),
          similarityExplanation: "AI Analysis unavailable for this channel.",
          makesItSimilar: "Data unavailable",
          whereItDiffers: "Data unavailable",
          whatToCopy: "Data unavailable",
          whatToAvoid: "Data unavailable",
          competitorClass: "Different Audience",
          growthOpportunity: { betterAt: [], worseAt: [], missingOpportunities: [], contentGaps: [], untappedTopics: [] }
        };
      }

      return {
        ...c,
        ...insight
      };
    });

    const response: SimilarChannelsResponse = {
      targetChannel,
      similarChannels,
      meta: {
        source,
        fetchedAt: new Date().toISOString(),
        totalEvaluated: candidates.length,
        errorReason
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[Similar Channels] Error:", error);
    if (error.message === 'YOUTUBE_QUOTA_EXCEEDED') {
      return NextResponse.json({ error: "YouTube API quota exceeded. Please try again later." }, { status: 429 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
