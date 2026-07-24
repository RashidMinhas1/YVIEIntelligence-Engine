import { Channel, ChannelDNA } from "../types/discovery";
import { VideoRow } from "../youtube";
import { calculateSemanticSimilarity as calculateNlpSimilarity } from "../nlp/embeddings";

// Simple stop words for NLP extraction
const STOP_WORDS = new Set(["the", "and", "a", "to", "of", "in", "i", "is", "that", "it", "on", "you", "this", "for", "but", "with", "are", "have", "be", "at", "or", "as", "was", "so", "if", "out", "not", "my", "your", "we", "how", "why", "what", "when", "where", "who"]);

export function extractDeterministicKeywords(text: string): string[] {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  const counts: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 3 && !STOP_WORDS.has(word)) {
      counts[word] = (counts[word] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(e => e[0]);
}

export function generateChannelDNA(channel: Channel, recentVideos: VideoRow[]): ChannelDNA {
  const titles = recentVideos.map(v => v.title).join(" ");
  const keywords = extractDeterministicKeywords(`${channel.title} ${channel.description} ${titles}`);
  
  let shortsCount = 0;
  let longFormCount = 0;
  
  // Basic heuristic: assume if "shorts" in url or #shorts in title
  recentVideos.forEach(v => {
    if (v.title.toLowerCase().includes("#shorts") || v.url.includes("/shorts/")) {
      shortsCount++;
    } else {
      longFormCount++;
    }
  });

  const total = shortsCount + longFormCount || 1;

  // Basic NLP heuristic mapping
  const contentDepth = longFormCount > shortsCount * 2 ? "Deep Dive" : "Quick Bites";

  return {
    niche: channel.topics?.[0] || "Unknown",
    subNiche: channel.topics?.[1] || "Unknown",
    topics: channel.topics || [],
    audience: "General",
    viewerIntent: "Entertainment/Education",
    keywords,
    entities: keywords.slice(0, 3), // mock entity extraction
    uploadPattern: channel.uploadFrequency || "Unknown",
    titleStyle: "Descriptive",
    thumbnailStyle: "Standard",
    hookStyle: "Direct",
    storytellingStyle: "Linear",
    editingStyle: "Standard",
    publishingPattern: "Regular",
    shortsRatio: Number((shortsCount / total).toFixed(2)),
    longFormRatio: Number((longFormCount / total).toFixed(2)),
    engagementPattern: "Average",
    viralFormula: "Standard Algorithm Push",
    contentDepth
  };
}

export interface ScoreFactors {
  similarity: number;
  confidence: number;
  authority: number;
  opportunity: number;
  competition: number;
  growth: number;
  consistency: number;
  engagement: number;
  virality: number;
  freshness: number;
}

export function calculateDiscoveryScore(factors: Partial<ScoreFactors>): { score: number, breakdown: ScoreFactors } {
  const base = {
    similarity: 50,
    confidence: 50,
    authority: 50,
    opportunity: 50,
    competition: 50,
    growth: 50,
    consistency: 50,
    engagement: 50,
    virality: 50,
    freshness: 50,
    ...factors
  };

  // Weighted formula
  const weights = {
    similarity: 0.25,
    confidence: 0.10,
    authority: 0.10,
    growth: 0.15,
    engagement: 0.15,
    virality: 0.10,
    freshness: 0.05,
    opportunity: 0.05,
    competition: 0.05,
    consistency: 0.00
  };

  let totalScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    totalScore += (base[key as keyof ScoreFactors] * weight);
  }

  return {
    score: Math.min(Math.round(totalScore), 100),
    breakdown: base
  };
}

export async function calculateSemanticSimilarity(dna1: ChannelDNA, dna2: ChannelDNA): Promise<number> {
  const text1 = `${dna1.niche} ${dna1.subNiche} ${dna1.keywords.join(" ")} ${dna1.topics.join(" ")}`;
  const text2 = `${dna2.niche} ${dna2.subNiche} ${dna2.keywords.join(" ")} ${dna2.topics.join(" ")}`;
  
  const nlpScore = await calculateNlpSimilarity(text1, text2);
  
  // Topic exact match bonus
  const tSet1 = new Set(dna1.topics);
  const tSet2 = new Set(dna2.topics);
  let tIntersect = 0;
  for (const t of tSet1) {
    if (tSet2.has(t)) tIntersect++;
  }
  const tUnion = tSet1.size + tSet2.size - tIntersect;
  const topicScore = tUnion === 0 ? 0 : (tIntersect / tUnion) * 100;

  // Blend NLP semantic score (80%) with exact topic overlap (20%)
  return Math.round((nlpScore * 0.8) + (topicScore * 0.2));
}
