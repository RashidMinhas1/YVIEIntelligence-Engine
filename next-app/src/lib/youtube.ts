import { youtubeRepo } from "./repository";

export type VideoRow = {
  competitor: string;
  title: string;
  views: string;
  url: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  estimatedCtr?: number;
  outlierScore?: number;
  performanceRatio?: number;
};

export function parseChannelInput(input: string): { type: "handle" | "channelId" | "name"; value: string; displayName: string } {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const pathname = url.pathname;
    const handleMatch = pathname.match(/^\/@([^/]+)/);
    if (handleMatch) {
      return { type: "handle", value: handleMatch[1], displayName: `@${handleMatch[1]}` };
    }
    const channelMatch = pathname.match(/^\/channel\/([^/]+)/);
    if (channelMatch) {
      return { type: "channelId", value: channelMatch[1], displayName: channelMatch[1] };
    }
    const customMatch = pathname.match(/^\/(?:c|user)\/([^/]+)/);
    if (customMatch) {
      return { type: "name", value: customMatch[1], displayName: customMatch[1] };
    }
  } catch {
    // not a URL
  }
  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed.slice(1), displayName: trimmed };
  }
  return { type: "name", value: trimmed, displayName: trimmed };
}

/**
 * Unified Centralized Calculations for Phase 4 / Phase 7
 */

// Calculate Estimated CTR based on view velocity and subscriber baseline.
export function calculateEstimatedCtr(views: number, subscribers: number, publishedAt: string | null): number {
  if (!views || !subscribers || !publishedAt) return 4.5; // Default baseline
  const daysOld = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));
  const velocity = views / daysOld;
  const subRatio = views / Math.max(1, subscribers);
  
  // A heuristic formula: higher velocity relative to subs implies a better CTR.
  let ctr = 3.0 + (velocity / Math.max(1, subscribers)) * 2.0 + (subRatio * 0.5);
  return Math.min(Math.max(ctr, 1.5), 15.0); // Bound between 1.5% and 15%
}

// Calculate Performance Ratio (Views relative to average views)
export function calculatePerformanceRatio(views: number, averageViews: number): number {
  if (!averageViews) return 1.0;
  return Number((views / averageViews).toFixed(2));
}

// Calculate Outlier Score (0 to 100) based on performance ratio and time decay
export function calculateOutlierScore(views: number, averageViews: number, publishedAt: string | null): number {
  if (!views || !averageViews) return 0;
  
  const ratio = views / averageViews;
  
  let timeMultiplier = 1.0;
  if (publishedAt) {
    const daysOld = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld < 30) timeMultiplier = 1.2; // Recent outliers are scored higher
    if (daysOld > 365) timeMultiplier = 0.8; // Old outliers are scored lower
  }
  
  let score = (ratio * 10) * timeMultiplier;
  return Math.min(Math.round(score), 100);
}

/**
 * YouTube Data Fetching
 */

async function scrapeChannelVideos(input: string): Promise<VideoRow[] | null> {
  const parsed = parseChannelInput(input);
  const displayName = parsed.displayName;

  let channelUrl: string;
  if (parsed.type === "channelId") {
    channelUrl = `https://www.youtube.com/channel/${parsed.value}`;
  } else if (parsed.type === "handle") {
    channelUrl = `https://www.youtube.com/@${parsed.value}`;
  } else {
    channelUrl = `https://www.youtube.com/@${encodeURIComponent(parsed.value)}`;
  }

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  try {
    let rssUrl: string | null = null;
    if (parsed.type === "channelId") {
      rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${parsed.value}`;
    } else {
      const pageRes = await fetch(channelUrl, { headers });
      if (!pageRes.ok) return null;
      const html = await pageRes.text();
      const rssMatch = html.match(/href="(https:\/\/www\.youtube\.com\/feeds\/videos\.xml[^"]+)"/);
      if (!rssMatch?.[1]) return null;
      rssUrl = rssMatch[1];
    }

    const rssRes = await fetch(rssUrl, { headers: { Accept: "application/xml,text/xml" } });
    if (!rssRes.ok) return null;
    const xml = await rssRes.text();
    const entryBlocks = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
    if (!entryBlocks.length) return null;

    const videos: VideoRow[] = [];
    for (const [, block] of entryBlocks) {
      const titleMatch = block.match(/<title>([^<]+)<\/title>/);
      const videoIdMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const publishedMatch = block.match(/<published>([^<]+)<\/published>/);
      const thumbMatch = block.match(/<media:thumbnail[^>]+url="([^"]+)"/);
      const title = titleMatch?.[1]
        ? titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim()
        : "";
      if (!title) continue;
      const videoId = videoIdMatch?.[1] ?? "";
      videos.push({
        competitor: displayName,
        title,
        views: "", // Scraping does not provide view count reliably without a heavyweight parser
        url: videoId ? `https://youtube.com/watch?v=${videoId}` : channelUrl,
        publishedAt: publishedMatch?.[1] ?? null,
        thumbnailUrl: thumbMatch?.[1] ?? null,
      });
      if (videos.length >= 25) break;
    }
    return videos.length ? videos : null;
  } catch {
    return null;
  }
}

import { withCache } from "./cache/engine";

export async function resolveChannelId(input: string, apiKey: string): Promise<string> {
  const parsed = parseChannelInput(input);
  
  if (parsed.type === "channelId") {
    return parsed.value;
  }
  
  const cacheKey = `resolve:${parsed.value}`;
  const { data } = await withCache(cacheKey, { namespace: "search", ttlMs: 7 * 24 * 60 * 60 * 1000 }, async () => {
    const BASE = "https://www.googleapis.com/youtube/v3";
    
    if (parsed.type === "handle") {
      const resolveUrl = `${BASE}/channels?part=id&forHandle=${encodeURIComponent(parsed.value)}&key=${apiKey}`;
      const resolveRes = await fetch(resolveUrl);
      if (!resolveRes.ok) throw new Error(`YouTube API Error during handle resolution: ${resolveRes.statusText}`);
      const resolveData = (await resolveRes.json()) as { items?: Array<{ id: string }> };
      if (resolveData.items?.[0]?.id) {
        return resolveData.items[0].id;
      }
      // If handle lookup fails, fallback to search. Handles sometimes change or user typed it wrong.
    }
    
    // Name/Custom/Topic Search Fallback
    const searchUrl = `${BASE}/search?part=snippet&q=${encodeURIComponent(parsed.value)}&type=channel&key=${apiKey}&maxResults=1`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`YouTube API Error during channel search: ${searchRes.statusText}`);
    const searchData = (await searchRes.json()) as { items?: Array<{ id: { channelId: string } }> };
    if (!searchData.items?.[0]?.id?.channelId) {
      throw new Error(`Channel or topic '${parsed.value}' not found on YouTube.`);
    }
    return searchData.items[0].id.channelId;
  });

  return data;
}

async function fetchChannelVideos(input: string, apiKey: string): Promise<VideoRow[] | null> {
  const BASE = "https://www.googleapis.com/youtube/v3";

  try {
    const channelId = await resolveChannelId(input, apiKey).catch(() => null);
    if (!channelId) return null;

    const channelRes = await fetch(`${BASE}/channels?part=contentDetails,snippet,statistics&id=${channelId}&key=${apiKey}`);
    const channelData = (await channelRes.json()) as {
      items?: Array<{
        snippet: { title: string };
        statistics: { subscriberCount: string };
        contentDetails: { relatedPlaylists: { uploads: string } };
      }>;
    };
    if (!channelData.items?.length) return null;

    const channelTitle = channelData.items[0].snippet.title;
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    const subscriberCount = parseInt(channelData.items[0].statistics.subscriberCount || "0", 10);

    const playlistRes = await fetch(
      `${BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=25&key=${apiKey}`
    );
    const playlistData = (await playlistRes.json()) as {
      items?: Array<{
        snippet: {
          title: string;
          publishedAt: string;
          thumbnails: { medium?: { url: string } };
          resourceId: { videoId: string };
        };
      }>;
    };
    if (!playlistData.items?.length) return null;

    const videoIds = playlistData.items.map((v) => v.snippet.resourceId.videoId).join(",");
    const statsRes = await fetch(`${BASE}/videos?part=statistics&id=${videoIds}&key=${apiKey}`);
    const statsData = (await statsRes.json()) as {
      items?: Array<{ id: string; statistics: { viewCount: string } }>;
    };

    const rawViewsMap: Record<string, number> = {};
    const statsMap: Record<string, string> = {};
    let totalViews = 0;
    
    statsData.items?.forEach((s) => {
      const views = parseInt(s.statistics.viewCount, 10);
      rawViewsMap[s.id] = views;
      totalViews += views;
      statsMap[s.id] =
        views >= 1_000_000 ? `${(views / 1_000_000).toFixed(1)}M` : views >= 1_000 ? `${(views / 1_000).toFixed(0)}K` : `${views}`;
    });

    const averageViews = statsData.items && statsData.items.length > 0 ? totalViews / statsData.items.length : 0;

    return playlistData.items.map((v) => {
      const rawViews = rawViewsMap[v.snippet.resourceId.videoId] || 0;
      return {
        competitor: channelTitle,
        title: v.snippet.title,
        views: statsMap[v.snippet.resourceId.videoId] || "0",
        url: `https://youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
        publishedAt: v.snippet.publishedAt,
        thumbnailUrl: v.snippet.thumbnails?.medium?.url || null,
        estimatedCtr: calculateEstimatedCtr(rawViews, subscriberCount, v.snippet.publishedAt),
        outlierScore: calculateOutlierScore(rawViews, averageViews, v.snippet.publishedAt),
        performanceRatio: calculatePerformanceRatio(rawViews, averageViews)
      };
    });
  } catch {
    return null;
  }
}

async function fetchCompetitorVideosWithDeduplication(input: string, apiKey: string): Promise<VideoRow[] | null> {
  const cacheKey = input.trim().toLowerCase();
  
  const { data } = await withCache(cacheKey, { namespace: "videos", ttlMs: 1 * 60 * 60 * 1000 }, async () => {
    let videos: VideoRow[] | null = null;
    if (apiKey) {
      videos = await fetchChannelVideos(input, apiKey);
    }
    if (!videos) {
      videos = await scrapeChannelVideos(input);
    }

    if (videos && videos.length > 0) {
      // Still write to the old JSON DB for backwards compatibility if needed, 
      // but the in-memory cache handles the hot path.
      await youtubeRepo.saveCache({
        id: cacheKey,
        videos,
        updatedAt: new Date().toISOString()
      });
      return videos;
    }
    
    // If it fails, check the long-term JSON DB as an ultimate fallback
    const cached = await youtubeRepo.getCache(cacheKey);
    if (cached && cached.videos.length > 0) {
      return cached.videos;
    }
    
    return null;
  });

  return data;
}

export async function fetchCompetitorVideos(
  competitors: string[],
  clientApiKey?: string | null,
  limit: number = 7
): Promise<{ videos: VideoRow[]; usedMockData: boolean }> {
  const youtubeApiKey = clientApiKey || process.env.YOUTUBE_API_KEY || "";
  const allVideos: VideoRow[] = [];

  for (const competitorInput of competitors) {
    const { displayName } = parseChannelInput(competitorInput);

    const videos = await fetchCompetitorVideosWithDeduplication(competitorInput, youtubeApiKey);
    if (videos && videos.length > 0) {
      allVideos.push(...videos.slice(0, limit));
      continue;
    }

    throw new Error(`Could not fetch live data for channel: ${displayName}. Please check the YouTube URL or try again later. Mock data is disabled by enterprise policy.`);
  }

  return { videos: allVideos, usedMockData: false };
}
