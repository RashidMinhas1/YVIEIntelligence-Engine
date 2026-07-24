import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { Channel, ChannelDiscoveryResponse, ChannelDiscoveryFilters } from "@/lib/types/discovery";
import { withCache, getCacheMetrics } from "@/lib/cache/engine";
import { resolveChannelId, fetchCompetitorVideos } from "@/lib/youtube";
import { generateChannelDNA, calculateDiscoveryScore } from "@/lib/discovery/engine";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

async function GET_handler(request: NextRequest) {
  try {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || "";
  const pageToken = searchParams.get("pageToken") || undefined;
  
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is missing. Mock data is disabled by enterprise policy.");
  }

  // Parse ALL filters (including new enterprise filters)
  const filters: ChannelDiscoveryFilters = {
    minSubscribers: searchParams.get("minSubscribers") ? parseInt(searchParams.get("minSubscribers")!) : undefined,
    maxSubscribers: searchParams.get("maxSubscribers") ? parseInt(searchParams.get("maxSubscribers")!) : undefined,
    minViews: searchParams.get("minViews") ? parseInt(searchParams.get("minViews")!) : undefined,
    maxViews: searchParams.get("maxViews") ? parseInt(searchParams.get("maxViews")!) : undefined,
    minAverageViews: searchParams.get("minAverageViews") ? parseInt(searchParams.get("minAverageViews")!) : undefined,
    minMedianViews: searchParams.get("minMedianViews") ? parseInt(searchParams.get("minMedianViews")!) : undefined,
    minTotalVideos: searchParams.get("minTotalVideos") ? parseInt(searchParams.get("minTotalVideos")!) : undefined,
    maxTotalVideos: searchParams.get("maxTotalVideos") ? parseInt(searchParams.get("maxTotalVideos")!) : undefined,
    country: searchParams.get("country") || undefined,
    language: searchParams.get("language") || undefined,
    category: searchParams.get("category") || undefined,
    verifiedOnly: searchParams.get("verifiedOnly") === "true",
    shortsOnly: searchParams.get("shortsOnly") === "true",
    longFormOnly: searchParams.get("longFormOnly") === "true",
    monetizedOnly: searchParams.get("monetizedOnly") === "true",
    brandChannel: searchParams.get("brandChannel") === "true",
    facelessOnly: searchParams.get("facelessOnly") === "true",
    minPerformanceRatio: searchParams.get("minPerformanceRatio") ? parseFloat(searchParams.get("minPerformanceRatio")!) : undefined,
    minOutlierScore: searchParams.get("minOutlierScore") ? parseInt(searchParams.get("minOutlierScore")!) : undefined,
    minSimilarity: searchParams.get("minSimilarity") ? parseInt(searchParams.get("minSimilarity")!) : undefined,
    minOpportunityScore: searchParams.get("minOpportunityScore") ? parseInt(searchParams.get("minOpportunityScore")!) : undefined,
    minCTR: searchParams.get("minCTR") ? parseFloat(searchParams.get("minCTR")!) : undefined,
    minEngagementRate: searchParams.get("minEngagementRate") ? parseFloat(searchParams.get("minEngagementRate")!) : undefined,
    minViewVelocity: searchParams.get("minViewVelocity") ? parseInt(searchParams.get("minViewVelocity")!) : undefined,
    growthStatus: searchParams.get("growthStatus") as any || undefined,
    lastUploadDate: searchParams.get("lastUploadDate") as any || undefined,
    uploadFrequency: searchParams.get("uploadFrequency") as any || undefined,
    channelAge: searchParams.get("channelAge") as any || undefined,
    sortBy: searchParams.get("sortBy") as any || undefined,
    sortOrder: searchParams.get("sortOrder") as any || undefined,
  };

  const cacheKey = `discover:v2:${query}:${pageToken || "first"}:${JSON.stringify(filters)}`;

  const { data, source } = await withCache(cacheKey, { namespace: "search", ttlMs: 12 * 60 * 60 * 1000, swrMs: 60 * 60 * 1000 }, async () => {
    // 1. Resolve Query (could be a handle/URL)
    let searchTarget = query;
    let isSpecificChannel = false;
    
    try {
      const resolvedId = await resolveChannelId(query, YOUTUBE_API_KEY);
      
      // If we successfully resolved an ID from the query, the user wants to discover COMPETITORS for this channel,
      // not just return the single channel itself. We need to fetch this channel's details and use its title/description to search.
      const chanUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      chanUrl.searchParams.set("part", "snippet,topicDetails");
      chanUrl.searchParams.set("id", resolvedId);
      chanUrl.searchParams.set("key", YOUTUBE_API_KEY);
      const chanRes = await fetch(chanUrl.toString());
      
      if (chanRes.ok) {
        const chanData = await chanRes.json();
        if (chanData.items?.[0]) {
          const snip = chanData.items[0].snippet;
          const topics = chanData.items[0].topicDetails?.topicCategories || [];
          
          // Construct a highly semantic search target from the channel's essence
          const keywords = `${snip.title} ${topics.map((t: string) => t.split('/').pop()).join(' ')}`.trim();
          searchTarget = keywords || snip.title;
          isSpecificChannel = true;
        }
      }
    } catch {
      // It's a broad search query, leave searchTarget as the raw query
    }

    // 2. Fetch Initial Candidates
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("q", searchTarget);
    searchUrl.searchParams.set("maxResults", "50"); // Fetch more to allow aggressive NLP filtering
    searchUrl.searchParams.set("key", YOUTUBE_API_KEY);
    if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      if (searchRes.status === 403 || searchRes.status === 429) {
        throw new Error(`YOUTUBE_QUOTA_EXCEEDED`);
      }
      throw new Error(`YouTube API Error: ${searchRes.statusText}`);
    }
    const searchData = await searchRes.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return { channels: [], nextPageToken: undefined, totalResults: 0 };
    }

    const channelIds = searchData.items.map((item: any) => item.id.channelId).join(",");
    
    // 3. Fetch Rich Metadata
    const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelsUrl.searchParams.set("part", "snippet,statistics,brandingSettings,topicDetails");
    channelsUrl.searchParams.set("id", channelIds);
    channelsUrl.searchParams.set("key", YOUTUBE_API_KEY);

    const channelsRes = await fetch(channelsUrl.toString());
    if (!channelsRes.ok) throw new Error("Failed to fetch channel details");
    const channelsData = await channelsRes.json();

    let candidates: Channel[] = channelsData.items.map((item: any): Channel => {
      const stats = item.statistics;
      const snippet = item.snippet;
      const branding = item.brandingSettings?.channel || {};
      return {
        id: item.id,
        title: snippet.title,
        handle: snippet.customUrl || snippet.title,
        description: snippet.description,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
        subscriberCount: parseInt(stats.subscriberCount || "0", 10),
        videoCount: parseInt(stats.videoCount || "0", 10),
        viewCount: parseInt(stats.viewCount || "0", 10),
        country: snippet.country || branding.country,
        language: snippet.defaultLanguage || branding.defaultLanguage,
        publishedAt: snippet.publishedAt,
        topics: item.topicDetails?.topicCategories || [],
        averageViews: Math.round(parseInt(stats.viewCount || "0", 10) / Math.max(1, parseInt(stats.videoCount || "1", 10))),
      };
    });

    // 4. Base Metrics Filtering
    if (filters.minSubscribers) candidates = candidates.filter(c => c.subscriberCount >= filters.minSubscribers!);
    if (filters.minViews) candidates = candidates.filter(c => c.viewCount >= filters.minViews!);
    if (filters.country && filters.country !== "any") candidates = candidates.filter(c => c.country === filters.country);
    if (filters.language && filters.language !== "any") candidates = candidates.filter(c => c.language === filters.language);

    // 5. NLP Semantic Ranking & Advanced Metrics
    const finalChannels: Channel[] = [];
    
    // Import dynamically to avoid top-level load errors if it breaks
    const { rankCandidatesSemantically } = await import('@/lib/nlp/embeddings');
    
    // Create candidate texts for semantic ranking
    const candidateTexts = candidates.map(c => `${c.title} ${c.description} ${(c.topics || []).join(" ")}`);
    const semanticScores = await rankCandidatesSemantically(query, candidateTexts);

    for (let i = 0; i < candidates.length; i++) {
      const channel = candidates[i];
      const simScore = semanticScores[i];
      
      // Hard Semantic Filter: If similarity is too low, it's irrelevant (e.g. Music vs Horror)
      const minSim = filters.minSimilarity || 30; // Default minimum similarity
      if (simScore < minSim) continue;

      // Deterministic Fetch of Videos via cache deduplication
      const { videos } = await fetchCompetitorVideos([channel.id], YOUTUBE_API_KEY, 10).catch(() => ({ videos: [] }));
      
      const dna = generateChannelDNA(channel, videos);
      
      if (filters.shortsOnly && dna.longFormRatio > 0.3) continue;
      if (filters.longFormOnly && dna.shortsRatio > 0.3) continue;

      const engagementRate = channel.viewCount > 0 ? (channel.viewCount / channel.subscriberCount) : 0;
      
      // Calculate Advanced Metrics
      const avgRecentViews = videos.reduce((acc, v) => acc + (parseInt(v.views) || 0), 0) / Math.max(1, videos.length);
      const performanceRatio = channel.averageViews ? Number((avgRecentViews / channel.averageViews).toFixed(2)) : 1.0;
      const outlierScore = Math.min(Math.round(performanceRatio * 20), 100);
      
      if (filters.minPerformanceRatio && performanceRatio < filters.minPerformanceRatio) continue;
      if (filters.minOutlierScore && outlierScore < filters.minOutlierScore) continue;
      if (filters.growthStatus === "Exploding" && performanceRatio < 3.0) continue;

      const { score, breakdown } = calculateDiscoveryScore({
        authority: Math.min((channel.subscriberCount / 1000000) * 100, 100),
        growth: Math.min(performanceRatio * 30, 100), 
        engagement: Math.min(engagementRate * 10, 100),
        virality: outlierScore,
        consistency: channel.videoCount > 100 ? 80 : 40,
        similarity: simScore
      });

      // Evidence generation
      const evidence = [];
      if (simScore > 75) evidence.push("High semantic match with query.");
      if (performanceRatio > 2.0) evidence.push(`Recent videos performing ${performanceRatio}x above average.`);
      if (dna.niche !== "Unknown") evidence.push(`Matches target niche: ${dna.niche}`);
      
      channel.dna = dna;
      channel.similarityScore = Math.round(simScore);
      channel.confidenceScore = breakdown.confidence;
      channel.discoveryScore = score;
      channel.performanceRatio = performanceRatio;
      channel.outlierScore = outlierScore;
      channel.growthStatus = performanceRatio > 3 ? "Exploding" : performanceRatio > 1.5 ? "Fast Growing" : performanceRatio > 0.8 ? "Stable" : "Declining";
      channel.verified = channel.subscriberCount > 100000; // Mock verification
      channel.monetized = channel.subscriberCount > 1000 && channel.videoCount > 10; // Mock monetization
      channel.primaryNiche = dna.niche;
      channel.subNiche = dna.subNiche;
      channel.viewerIntent = dna.viewerIntent;
      channel.evidence = evidence;
      
      if (filters.monetizedOnly && !channel.monetized) continue;
      if (filters.verifiedOnly && !channel.verified) continue;

      finalChannels.push(channel);
    }

    // Sort Candidates based on selected sort (default to similarity)
    const sortBy = filters.sortBy || "similarity";
    finalChannels.sort((a, b) => {
      let aVal = 0, bVal = 0;
      if (sortBy === "similarity") { aVal = a.similarityScore || 0; bVal = b.similarityScore || 0; }
      else if (sortBy === "subscribers") { aVal = a.subscriberCount || 0; bVal = b.subscriberCount || 0; }
      else if (sortBy === "views") { aVal = a.viewCount || 0; bVal = b.viewCount || 0; }
      else if (sortBy === "growth") { aVal = a.performanceRatio || 0; bVal = b.performanceRatio || 0; }
      else if (sortBy === "outlierScore") { aVal = a.outlierScore || 0; bVal = b.outlierScore || 0; }
      return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return {
      channels: finalChannels.slice(0, 16),
      nextPageToken: searchData.nextPageToken,
      totalResults: searchData.pageInfo?.totalResults || 0
    };
  });

  return NextResponse.json({
    data: data.channels,
    meta: {
      source,
      fetchedAt: new Date().toISOString(),
      nextPageToken: data.nextPageToken,
      totalResults: data.totalResults,
    }
  });
  } catch (error: any) {
    console.error("Discovery API Error:", error);
    if (error.message === 'YOUTUBE_QUOTA_EXCEEDED') {
      console.warn("YouTube API quota exceeded, returning mock fallback data.");
      return NextResponse.json({
        data: [
          {
            id: "mock_quota_exceeded_1",
            title: "Quota Exceeded (Mock)",
            handle: "@quota_exceeded",
            description: "The YouTube API quota has been exceeded for today. This is mock data.",
            thumbnailUrl: "https://via.placeholder.com/150",
            subscriberCount: 1250000,
            videoCount: 300,
            viewCount: 250000000,
            country: "US",
            language: "en",
            averageViews: 833333,
            similarityScore: 99,
            confidenceScore: 95,
            discoveryScore: 90,
            performanceRatio: 3.5,
            outlierScore: 100,
            growthStatus: "Exploding",
            verified: true,
            monetized: true,
            primaryNiche: "Tech",
            evidence: ["YouTube API limit reached. Loading fallback..."]
          }
        ],
        meta: { source: "mock", totalResults: 1 }
      }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to fetch discovery data" }, { status: 500 });
  }
}

export const GET = withErrorHandling(GET_handler);
