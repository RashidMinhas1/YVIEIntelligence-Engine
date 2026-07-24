import { withErrorHandling } from "@/lib/api-wrapper";
import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { knowledgeRepo } from "@/lib/repository";
import crypto from "crypto";
import { StrategicIntelligence, StrategicRecommendation } from "@/lib/types/discovery";

const strategySystemPrompt = `
You are the Master AI Strategy & Decision Engine for an Elite YouTube Creator.
You will be provided with aggregated intelligence from previous analysis modules including:
- Viral Formulas
- Title Intelligence
- Thumbnail Intelligence
- Synergy Frameworks
- Deep Content Intelligence

DO NOT regenerate intelligence or observations. Your job is to output a decisive, actionable Strategic Roadmap and Decision Matrix.
Calculate priority using ROI (Growth Impact, CTR Impact, Difficulty, Time Required).
Return ONLY valid JSON matching the exact StrategicIntelligence structure described below.

Structure:
{
  "recommendations": [
    {
      "category": "Do" | "Stop" | "Repeat" | "Improve" | "Experiment",
      "recommendation": "Actionable text",
      "reason": "Why?",
      "expectedGrowthImpact": 90,
      "expectedCtrImpact": 85,
      "expectedRetentionImpact": 80,
      "difficulty": 40,
      "timeRequired": "Days",
      "resourceCost": "Medium",
      "confidence": 95,
      "priorityScore": 92,
      "roiScore": 94,
      "supportingEvidence": ["Specific evidence from provided context"],
      "sourceModules": ["Module names"],
      "risk": "Potential risk",
      "expectedOutcome": "What happens if they do this"
    }
  ],
  "roadmap": {
    "next10Videos": [
      {
        "title": "Working title",
        "format": "Long-form",
        "category": "Evergreen",
        "reason": "Why this video now",
        "targetAudience": "Beginners",
        "estimatedROI": 88,
        "priority": 1
      }
    ],
    "next30DaysPlan": ["Week 1: X", "Week 2: Y"],
    "next90DaysPlan": ["Month 1: X", "Month 2: Y"],
    "quickWins": ["Action 1"],
    "longTermPlays": ["Action 2"],
    "experimentalIdeas": ["Action 3"]
  },
  "opportunities": {
    "untappedTopics": [],
    "emergingTrends": [],
    "evergreenOpportunities": [],
    "weakCompetitors": [],
    "marketGaps": [],
    "contentClusters": [],
    "winningSeriesIdeas": []
  },
  "risks": [
    {
      "type": "Audience Fatigue",
      "description": "Explaining the risk",
      "severity": "High",
      "confidence": 90,
      "mitigationStrategy": "How to fix"
    }
  ],
  "knowledgeGraphLinks": []
}
`;

async function POST_handler(req: Request) {
  try {
    const { channelId, sessionIntelligence } = await req.json();

    // 1. Fetch cached intel from Knowledge Repository
    const formulas = await knowledgeRepo.searchFormulas({});
    const synergies = await knowledgeRepo.searchSynergyFrameworks({});
    const titles = await knowledgeRepo.searchTitleFrameworks({});
    
    // Check if strategy already exists for this channel and is very recent (cache-first architecture)
    if (channelId) {
      const existingStrategies = await knowledgeRepo.searchStrategicIntelligence({ channelId });
      if (existingStrategies.length > 0) {
        // Just return the most recent strategy
        const mostRecent = existingStrategies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        // If we want to strictly reuse without regenerating (unless forced) we could return here.
        // For now, we will generate a fresh strategy merging old + new data.
      }
    }

    const payload = {
      channelId,
      sessionIntelligence, // Data from the current session that hasn't been committed yet
      repositoryData: {
        formulas: formulas.slice(0, 10), // Limit payload size
        synergies: synergies.slice(0, 10),
        titles: titles.slice(0, 10)
      }
    };

    const ai = getAIProvider();
    const completion = await ai.generateText(
      JSON.stringify(payload),
      {
        systemPrompt: strategySystemPrompt,
        responseFormat: "json_object",
        featureKey: "intelligence"
      }
    );

    let extractedData;
    try {
      const cleaned = completion.replace(/```json/g, "").replace(/```/g, "").trim();
      extractedData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse Strategy Engine JSON:", completion);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const strategyId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // 2. Hydrate Recommendations with IDs
    const recommendations: StrategicRecommendation[] = extractedData.recommendations.map((rec: any) => ({
      ...rec,
      id: crypto.randomUUID(),
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 day expiry
      version: "1.0",
      createdAt
    }));

    const strategy: StrategicIntelligence = {
      id: strategyId,
      version: "1.0",
      createdAt,
      channelId: channelId || "global",
      recommendations,
      roadmap: extractedData.roadmap,
      opportunities: extractedData.opportunities,
      risks: extractedData.risks,
      knowledgeGraphLinks: extractedData.knowledgeGraphLinks || []
    };

    // 3. Save to Recommendation Repository & Strategy Repository
    await knowledgeRepo.saveStrategicIntelligence(strategy);
    for (const rec of recommendations) {
      await knowledgeRepo.saveRecommendation(rec);
    }

    return NextResponse.json({ success: true, strategy });
  } catch (err: any) {
    console.error("Strategy Engine Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = withErrorHandling(POST_handler);
