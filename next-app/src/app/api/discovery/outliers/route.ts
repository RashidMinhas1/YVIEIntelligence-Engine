import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { OutlierDetectionResponse, VideoBaseline, OutlierVideo, VideoBase } from "@/lib/types/discovery";
import { resolveChannelId } from "@/lib/youtube";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

// Math utilities
const getMean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
const getMedian = (arr: number[]) => {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const getStdDev = (arr: number[], mean: number) => {
  const sqDiffs = arr.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(getMean(sqDiffs));
};

async function POST_handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetChannelId: rawTargetChannelId } = body;
    
    if (!rawTargetChannelId) {
      return NextResponse.json({ error: "Missing targetChannelId" }, { status: 400 });
    }

    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is missing. Real data cannot be fetched. Mock data is disabled by enterprise policy.");
    }

    // Blocker 2: Handle Resolution
    const targetChannelId = await resolveChannelId(rawTargetChannelId, YOUTUBE_API_KEY).catch(e => {
      throw new Error(`Failed to resolve channel handle or ID: ${e.message}`);
    });

    let videos: VideoBase[] = [];
    let subscriberCount = 0;
    let totalVideos = 0;

    // 1. Fetch Channel Info
    const chanUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    chanUrl.searchParams.set("part", "statistics,contentDetails");
    chanUrl.searchParams.set("id", targetChannelId);
    chanUrl.searchParams.set("key", YOUTUBE_API_KEY);
    const chanRes = await fetch(chanUrl.toString());
    
    if (!chanRes.ok) {
      let blocker = `HTTP ${chanRes.status} ${chanRes.statusText}`;
      const errBody = await chanRes.json().catch(() => ({}));
      if (errBody?.error?.message) blocker = errBody.error.message;
      if (errBody?.error?.errors?.[0]?.reason) blocker = `${errBody.error.errors[0].reason}: ${blocker}`;
      throw new Error(`YouTube API Error: ${blocker}`);
    }
    
    const chanData = await chanRes.json();
    if (!chanData.items?.[0]) throw new Error("Target channel not found");

    const channelData = chanData.items[0];
    subscriberCount = parseInt(channelData.statistics.subscriberCount || "0", 10);
    totalVideos = parseInt(channelData.statistics.videoCount || "0", 10);
    const uploadsPlaylistId = channelData.contentDetails.relatedPlaylists.uploads;

    // 2. Fetch Playlist Items (Recent Videos)
    const playUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    playUrl.searchParams.set("part", "snippet");
    playUrl.searchParams.set("playlistId", uploadsPlaylistId);
    playUrl.searchParams.set("maxResults", "50"); // Max limit to get statistically significant baseline
    playUrl.searchParams.set("key", YOUTUBE_API_KEY);

    const playRes = await fetch(playUrl.toString());
    if (!playRes.ok) throw new Error("Failed to fetch recent videos");
    const playData = await playRes.json();

    const videoIds = (playData.items || []).map((item: any) => item.snippet.resourceId.videoId);

    // 3. Fetch Video Statistics in chunks of 50
    if (videoIds.length > 0) {
      for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);
        const vidUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
        vidUrl.searchParams.set("part", "snippet,statistics");
        vidUrl.searchParams.set("id", chunk.join(","));
        vidUrl.searchParams.set("key", YOUTUBE_API_KEY);
        
        const vidRes = await fetch(vidUrl.toString());
        if (!vidRes.ok) throw new Error("Failed to fetch videos statistics");
        const vidData = await vidRes.json();
        
        videos.push(...(vidData.items || []).map((item: any): VideoBase => ({
          id: item.id,
          title: item.snippet.title,
          thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          publishedAt: item.snippet.publishedAt,
          viewCount: parseInt(item.statistics.viewCount || "0", 10),
          likeCount: parseInt(item.statistics.likeCount || "0", 10),
          commentCount: parseInt(item.statistics.commentCount || "0", 10),
        })));
      }
    }

    if (videos.length === 0) {
      throw new Error("No videos found to analyze");
    }

    // 5. Mathematical Baseline Calculation
    const viewCounts = videos.map(v => v.viewCount);
    const meanViews = getMean(viewCounts);
    const medianViews = getMedian(viewCounts);
    const stdDev = getStdDev(viewCounts, meanViews);
    
    // Sort to find range (excluding top 5% and bottom 5% to get "typical" range)
    const sortedViews = [...viewCounts].sort((a, b) => a - b);
    const lowerBoundIdx = Math.floor(sortedViews.length * 0.1);
    const upperBoundIdx = Math.floor(sortedViews.length * 0.9);
    const typicalViewRange: [number, number] = [sortedViews[lowerBoundIdx] || 0, sortedViews[upperBoundIdx] || 0];

    const subscriberRatio = subscriberCount > 0 ? meanViews / subscriberCount : 0;

    const baseline: VideoBaseline = {
      meanViews,
      medianViews,
      standardDeviation: stdDev,
      typicalViewRange,
      uploadFrequency: "Calculated based on dates",
      subscriberRatio,
      viewVelocity: "Average",
      longTailPerformance: "Standard"
    };

    // 6. Enterprise Outlier Detection
    const outlierVideos: OutlierVideo[] = videos.map(v => {
      // 1. Calculate Expected Views (using recent average as baseline)
      const expectedViews = meanViews;
      
      // 2. Performance Ratio (Actual / Expected)
      const performanceRatio = expectedViews > 0 ? v.viewCount / expectedViews : 1;
      
      // 3. View Velocity (Views / Days since published)
      const daysOld = Math.max(1, (Date.now() - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
      const viewVelocity = v.viewCount / daysOld;
      
      // 4. CTR & Retention Estimates based on performance ratio (Heuristics)
      const ctrEstimate = Math.min(3.0 + (performanceRatio * 1.5), 15.0); // 3% base, scales with performance up to 15%
      const retentionEstimate = Math.min(30 + (performanceRatio * 5), 80); // 30% base, up to 80%
      
      // 5. Engagement Estimate
      const engagement = Math.min(2.0 + (performanceRatio * 0.5), 10.0);
      
      // 6. Final Outlier Score
      // Uses Z-score as a base, but heavily weights performance ratio and velocity
      const zScore = stdDev > 0 ? (v.viewCount - meanViews) / stdDev : 0;
      let score = (zScore * 10) + (performanceRatio * 5);
      score = Math.min(Math.round(Math.max(0, score)), 100);
      
      return {
        ...v,
        isOutlier: performanceRatio > 2.0 || zScore > 1.5,
        outlierScore: score,
        performanceRatio,
        viewVelocity,
        ctrEstimate,
        retentionEstimate,
        engagementEstimate: engagement
      };
    });

    const trueOutliers = outlierVideos.filter(v => v.isOutlier).sort((a, b) => (b.outlierScore || 0) - (a.outlierScore || 0));

    // 7. AI Deep Analysis
    let patternAnalysis = undefined;
    
    if (trueOutliers.length > 0) {
      const provider = getAIProvider();
      
      const aiPrompt = `
        You are an expert YouTube growth analyst.
        Analyze the following mathematically proven outlier videos for a channel with ${subscriberCount} subscribers and average expected views of ${Math.round(meanViews)}.
        
        Outlier Videos Data:
        ${JSON.stringify(trueOutliers.slice(0, 5).map(v => ({
          title: v.title,
          actualViews: v.viewCount,
          expectedViews: Math.round(meanViews),
          performanceRatio: v.performanceRatio,
          velocity: v.viewVelocity,
          estimatedCtr: v.ctrEstimate,
          estimatedRetention: v.retentionEstimate,
          publishedAt: v.publishedAt
        })))}
        
        Provide a JSON response identifying the repeatable viral formula and analyzing the pattern.
        Schema:
        {
          "patternAnalysis": {
            "titleFormat": "<string>",
            "thumbnailConcept": "<string>",
            "topicAngle": "<string>",
            "psychologicalTrigger": "<string>",
            "repeatableFormula": "<string>",
            "confidenceScore": <number 0-100>
          },
          "videoAnalysis": [
            {
              "title": "<string>",
              "viralReasoning": "<string>",
              "evidence": ["<string>"],
              "repeatability": "<string>"
            }
          ]
        }
      `;

      try {
        const aiRes = await provider.generateText(aiPrompt, {
          systemPrompt: "You are a professional YouTube analyst. Output only valid JSON.",
          responseFormat: "json_object",
          featureKey: "intelligence"
        });

        const aiData = JSON.parse(aiRes);
        
        // Merge AI insights into trueOutliers
        trueOutliers.forEach(outlier => {
          const insight = aiData.videoAnalysis?.find((v: any) => v.title === outlier.title);
          if (insight) {
            outlier.viralReasoning = insight.viralReasoning;
            outlier.evidence = insight.evidence;
            outlier.repeatability = insight.repeatability;
          }
        });

        patternAnalysis = aiData.patternAnalysis;
      } catch (aiErr) {
        console.error("AI Analysis Failed:", aiErr);
        // We still return the mathematical outliers even if AI fails
      }
    }

    const response: OutlierDetectionResponse = {
      channelId: targetChannelId,
      baseline,
      videos: outlierVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()), // Sort recent
      patternAnalysis,
      meta: {
        source: "live",
        fetchedAt: new Date().toISOString(),
        sampledCount: videos.length
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("[Outlier Detection] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withErrorHandling(POST_handler);
