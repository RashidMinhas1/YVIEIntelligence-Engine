import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable } from "@workspace/db";
import { FetchCompetitorVideosBody, GetVideosQueryParams } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router = Router();

/** Extract handle, channel ID, or display name from a YouTube channel URL or plain text. */
function parseChannelInput(input: string): { type: "handle" | "channelId" | "name"; value: string; displayName: string } {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const pathname = url.pathname;

    // /@handle or /@handle/videos etc.
    const handleMatch = pathname.match(/^\/@([^/]+)/);
    if (handleMatch) {
      return { type: "handle", value: handleMatch[1], displayName: `@${handleMatch[1]}` };
    }

    // /channel/UCXXXXXXX
    const channelMatch = pathname.match(/^\/channel\/([^/]+)/);
    if (channelMatch) {
      return { type: "channelId", value: channelMatch[1], displayName: channelMatch[1] };
    }

    // /c/customname or /user/username
    const customMatch = pathname.match(/^\/(?:c|user)\/([^/]+)/);
    if (customMatch) {
      return { type: "name", value: customMatch[1], displayName: customMatch[1] };
    }
  } catch {
    // not a URL — treat as plain name or @handle
  }

  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed.slice(1), displayName: trimmed };
  }

  return { type: "name", value: trimmed, displayName: trimmed };
}

const MOCK_VIDEOS = (displayName: string) => {
  const label = displayName.replace(/^@/, "");
  const titles = [
    `10 Shocking Facts About ${label} Nobody Talks About | Exposed`,
    `I Tried ${label}'s Method For 30 Days... Here's What Happened`,
    `Why ${label} Is DOMINATING YouTube Right Now (Not What You Think)`,
    `The Dark Truth Behind ${label}'s Success 🔥`,
    `${label} Revealed The #1 Secret They Don't Want You To Know`,
    `I Quit EVERYTHING To Study ${label} - My Life Changed Forever`,
    `${label}'s Exact Strategy That Got 10,000,000+ Views (Breakdown)`,
    `How ${label} Makes $100K/Month | The Full Blueprint`,
    `Why 99% Of Creators FAIL At What ${label} Does Easily`,
    `${label} Just Changed EVERYTHING We Thought We Knew About YouTube`,
  ];
  return titles.map((title, i) => ({
    competitor: displayName,
    title,
    views: `${Math.floor(Math.random() * 5000 + 200)}K`,
    url: `https://youtube.com/watch?v=mock${i}`,
    publishedAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    thumbnailUrl: null,
  }));
};

/**
 * Fetch latest videos via YouTube's public RSS feed — no API key needed.
 * Step 1: GET the channel page to extract the RSS feed URL (has channel_id).
 * Step 2: GET the RSS XML and parse entries with regex (no XML parser dep).
 */
async function scrapeChannelVideos(
  input: string,
  log: { warn: (obj: object, msg: string) => void }
): Promise<Array<{ competitor: string; title: string; views: string; url: string; publishedAt: string | null; thumbnailUrl: string | null }> | null> {
  const parsed = parseChannelInput(input);
  const displayName = parsed.displayName;

  // Build channel page URL
  let channelUrl: string;
  if (parsed.type === "channelId") {
    channelUrl = `https://www.youtube.com/channel/${parsed.value}`;
  } else if (parsed.type === "handle") {
    channelUrl = `https://www.youtube.com/@${parsed.value}`;
  } else {
    channelUrl = `https://www.youtube.com/@${encodeURIComponent(parsed.value)}`;
  }

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  try {
    // Step 1 — get RSS feed URL from channel page <link> tag
    let rssUrl: string | null = null;

    if (parsed.type === "channelId") {
      rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${parsed.value}`;
    } else {
      const pageRes = await fetch(channelUrl, { headers });
      if (!pageRes.ok) {
        log.warn({ channelUrl, status: pageRes.status }, "RSS: HTTP error fetching channel page");
        return null;
      }
      const html = await pageRes.text();
      const rssMatch = html.match(/href="(https:\/\/www\.youtube\.com\/feeds\/videos\.xml[^"]+)"/);
      if (!rssMatch?.[1]) {
        log.warn({ channelUrl }, "RSS: feed link not found in channel page");
        return null;
      }
      rssUrl = rssMatch[1];
    }

    // Step 2 — fetch and parse the RSS feed
    const rssRes = await fetch(rssUrl, { headers: { "Accept": "application/xml,text/xml" } });
    if (!rssRes.ok) {
      log.warn({ rssUrl, status: rssRes.status }, "RSS: HTTP error fetching feed");
      return null;
    }
    const xml = await rssRes.text();

    // Extract <entry> blocks
    const entryBlocks = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
    if (!entryBlocks.length) {
      log.warn({ rssUrl }, "RSS: no entries found in feed");
      return null;
    }

    const videos: Array<{ competitor: string; title: string; views: string; url: string; publishedAt: string | null; thumbnailUrl: string | null }> = [];

    for (const [, block] of entryBlocks) {
      const titleMatch = block.match(/<title>([^<]+)<\/title>/);
      const videoIdMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const publishedMatch = block.match(/<published>([^<]+)<\/published>/);
      const thumbMatch = block.match(/<media:thumbnail[^>]+url="([^"]+)"/);

      const title = titleMatch?.[1]
        ? titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
        : "";
      if (!title) continue;

      const videoId = videoIdMatch?.[1] ?? "";
      videos.push({
        competitor: displayName,
        title,
        views: "",
        url: videoId ? `https://youtube.com/watch?v=${videoId}` : channelUrl,
        publishedAt: publishedMatch?.[1] ?? null,
        thumbnailUrl: thumbMatch?.[1] ?? null,
      });

      if (videos.length >= 10) break;
    }

    if (!videos.length) {
      log.warn({ rssUrl }, "RSS: no valid video entries parsed");
      return null;
    }

    return videos;
  } catch (err) {
    log.warn({ input, err }, "RSS: Unexpected error");
    return null;
  }
}

async function fetchChannelVideos(
  input: string,
  apiKey: string,
  log: { warn: (obj: object, msg: string) => void }
): Promise<Array<{ competitor: string; title: string; views: string; url: string; publishedAt: string | null; thumbnailUrl: string | null }> | null> {
  const parsed = parseChannelInput(input);
  const BASE = "https://www.googleapis.com/youtube/v3";

  try {
    let channelId: string | null = null;

    if (parsed.type === "channelId") {
      channelId = parsed.value;
    } else {
      // Resolve handle or name → channel ID
      let resolveUrl: string;
      if (parsed.type === "handle") {
        resolveUrl = `${BASE}/channels?part=id,snippet&forHandle=${encodeURIComponent(parsed.value)}&key=${apiKey}`;
      } else {
        // Search by name
        const searchUrl = `${BASE}/search?part=snippet&q=${encodeURIComponent(parsed.value)}&type=channel&key=${apiKey}&maxResults=1`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json() as { items?: Array<{ id: { channelId: string } }> };
        if (searchData.items?.length) {
          channelId = searchData.items[0].id.channelId;
        }
        resolveUrl = "";
      }

      if (resolveUrl) {
        const resolveRes = await fetch(resolveUrl);
        const resolveData = await resolveRes.json() as {
          items?: Array<{ id: string; snippet: { title: string } }>;
        };
        if (resolveData.items?.length) {
          channelId = resolveData.items[0].id;
        }
      }
    }

    if (!channelId) return null;

    // Get uploads playlist ID from the channel
    const channelRes = await fetch(`${BASE}/channels?part=contentDetails,snippet&id=${channelId}&key=${apiKey}`);
    const channelData = await channelRes.json() as {
      items?: Array<{
        snippet: { title: string };
        contentDetails: { relatedPlaylists: { uploads: string } };
      }>;
    };
    if (!channelData.items?.length) return null;

    const channelTitle = channelData.items[0].snippet.title;
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Fetch latest 10 videos from uploads playlist
    const playlistRes = await fetch(
      `${BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`
    );
    const playlistData = await playlistRes.json() as {
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

    // Get view counts
    const videoIds = playlistData.items.map((v) => v.snippet.resourceId.videoId).join(",");
    const statsRes = await fetch(`${BASE}/videos?part=statistics&id=${videoIds}&key=${apiKey}`);
    const statsData = await statsRes.json() as {
      items?: Array<{ id: string; statistics: { viewCount: string } }>;
    };

    const statsMap: Record<string, string> = {};
    statsData.items?.forEach((s) => {
      const views = parseInt(s.statistics.viewCount);
      statsMap[s.id] = views >= 1_000_000
        ? `${(views / 1_000_000).toFixed(1)}M`
        : views >= 1_000
        ? `${(views / 1_000).toFixed(0)}K`
        : `${views}`;
    });

    return playlistData.items.map((v) => ({
      competitor: channelTitle,
      title: v.snippet.title,
      views: statsMap[v.snippet.resourceId.videoId] || "0",
      url: `https://youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
      publishedAt: v.snippet.publishedAt,
      thumbnailUrl: v.snippet.thumbnails?.medium?.url || null,
    }));
  } catch (err) {
    log.warn({ input, err }, "YouTube API fetch failed");
    return null;
  }
}

router.post("/fetch", async (req, res) => {
  const parsed = FetchCompetitorVideosBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { competitors, youtubeApiKey: clientKey } = parsed.data;
  const youtubeApiKey = clientKey || process.env.YOUTUBE_API_KEY || "";
  let usedMockData = false;
  const allVideos: Array<{
    competitor: string;
    title: string;
    views: string;
    url: string;
    publishedAt: string | null;
    thumbnailUrl: string | null;
  }> = [];

  for (const competitorInput of competitors) {
    const { displayName } = parseChannelInput(competitorInput);

    // 1. Try YouTube Data API (if key available)
    if (youtubeApiKey) {
      const videos = await fetchChannelVideos(competitorInput, youtubeApiKey, req.log);
      if (videos) {
        allVideos.push(...videos);
        continue;
      }
    }

    // 2. Try scraping YouTube channel page (no key needed)
    const scraped = await scrapeChannelVideos(competitorInput, req.log);
    if (scraped) {
      allVideos.push(...scraped);
      continue;
    }

    // 3. Fall back to mock data
    usedMockData = true;
    allVideos.push(...MOCK_VIDEOS(displayName));
  }

  await db.delete(videosTable).where(
    eq(videosTable.competitor, competitors[0])
  );

  const inserted = await db.insert(videosTable).values(
    allVideos.map((v) => ({
      competitor: v.competitor,
      title: v.title,
      views: v.views,
      url: v.url,
      publishedAt: v.publishedAt,
      thumbnailUrl: v.thumbnailUrl,
    }))
  ).returning();

  return res.json({ videos: inserted, usedMockData });
});

router.get("/", async (req, res) => {
  const parsed = GetVideosQueryParams.safeParse(req.query);
  const query = db.select().from(videosTable);

  let rows;
  if (parsed.success && parsed.data.competitor) {
    rows = await db.select().from(videosTable).where(eq(videosTable.competitor, parsed.data.competitor));
  } else {
    rows = await query;
  }

  return res.json({ videos: rows });
});

export default router;
