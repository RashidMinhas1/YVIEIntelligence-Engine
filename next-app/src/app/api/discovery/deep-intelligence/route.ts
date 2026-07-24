import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { DeepContentIntelligenceResponse, Channel, SimilarChannelsResponse, OutlierDetectionResponse, IntelligenceReport } from "@/lib/types/discovery";

async function POST_handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, similarData, outlierData, reportData } = body as {
      channel: Channel;
      similarData: SimilarChannelsResponse;
      outlierData: OutlierDetectionResponse;
      reportData: IntelligenceReport;
    };
    
    if (!channel || !channel.id) {
      return NextResponse.json({ error: "Missing channel data" }, { status: 400 });
    }

    const provider = getAIProvider();
    
    const sourceDataVersion = String(Date.now());

    const aiPrompt = `
      You are an elite, psychological YouTube Content Strategist and AI Consultant.
      Your job is to generate "Deep Content Intelligence". Do NOT perform basic analytics.
      Instead, deconstruct the channel's DNA, extract its psychological profile, and build a reusable knowledge graph.
      
      REQUIREMENTS:
      1. Synthesize evidence from ALL provided modules (Channel, Similar Channels, Outliers, Intelligence Report).
      2. Weight "Outlier Videos" higher, but they are not the sole source of truth.
      3. For every conclusion (Content DNA, Audience Psychology, Content Strategy), explicitly cite the evidence.
      4. Answer Consultant-style questions: "Why does this work?", "When to use it?", "When NOT to use it?".
      5. Extract a relational Knowledge Graph (e.g. Topic -> Hook -> Curiosity -> Retention).
      
      INPUT DATA:
      === TARGET CHANNEL ===
      ${JSON.stringify({ title: channel.title, niche: channel.niche })}
      
      === SIMILAR CHANNELS (COMPETITOR LANDSCAPE) ===
      ${JSON.stringify(similarData?.similarChannels?.map(c => ({ class: c.competitorClass, growthOpportunity: c.growthOpportunity })) || [])}
      
      === OUTLIER DETECTION (HIGHEST WEIGHT) ===
      ${JSON.stringify(outlierData?.videos?.filter(v => v.isOutlier).map(v => ({ title: v.title, reasoning: v.viralReasoning, score: v.outlierScore })) || [])}

      === INTELLIGENCE REPORT ===
      ${JSON.stringify({ viralFormula: reportData?.viralFormula, gaps: reportData?.contentGapAnalysis })}

      Generate the DeepContentIntelligenceResponse strictly matching this JSON schema:
      {
        "contentDNA": {
          "storytellingStructure": "<string>",
          "hookArchitecture": "<string>",
          "narrativePacing": "<string>",
          "emotionalProgression": "<string>",
          "curiosityLifecycle": "<string>",
          "ctaStrategy": "<string>",
          "authorityBuilding": "<string>",
          "viewerRetentionTechniques": ["<string>"],
          "evidence": "<string>"
        },
        "audiencePsychology": {
          "beginnerVsAdvanced": "<string>",
          "viewerIntent": "<string>",
          "painPoints": ["<string>"],
          "emotionalMotivations": ["<string>"],
          "learningExpectations": "<string>",
          "entertainmentExpectations": "<string>",
          "evidence": "<string>"
        },
        "contentStrategy": {
          "evergreenStrategy": { "strategy": "<string>", "confidenceScore": <number>, "evidence": "<string>" },
          "trendStrategy": { "strategy": "<string>", "confidenceScore": <number>, "evidence": "<string>" },
          "seriesStrategy": { "strategy": "<string>", "confidenceScore": <number>, "evidence": "<string>" },
          "educationalStrategy": { "strategy": "<string>", "confidenceScore": <number>, "evidence": "<string>" },
          "documentaryStrategy": { "strategy": "<string>", "confidenceScore": <number>, "evidence": "<string>" },
          "entertainmentStrategy": { "strategy": "<string>", "confidenceScore": <number>, "evidence": "<string>" }
        },
        "patternStability": {
          "sustainablePatterns": ["<string>"],
          "temporaryTrends": ["<string>"],
          "algorithmDrivenSuccess": ["<string>"],
          "repeatableSystems": ["<string>"]
        },
        "knowledgeGraph": [
          { "from": "<string>", "to": "<string>", "relationship": "<string>", "context": "<string>" }
        ],
        "consultantInsights": [
          {
            "observation": "<string>",
            "whyItWorks": "<string>",
            "whenItWorks": "<string>",
            "whenItFails": "<string>",
            "whoShouldUseIt": "<string>",
            "expectedImpact": "<string>",
            "confidenceScore": <number>,
            "supportingEvidence": "<string>"
          }
        ]
      }
    `;

    const aiRes = await provider.generateText(aiPrompt, {
      systemPrompt: "You are an elite psychological YouTube Strategist. Output strictly valid JSON.",
      responseFormat: "json_object",
      featureKey: "intelligence"
    });

    const intelligenceData = JSON.parse(aiRes);

    const deepIntelligence: DeepContentIntelligenceResponse = {
      id: `deep_intel_${Date.now()}_${channel.id}`,
      channelId: channel.id,
      meta: {
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        aiModel: "primary-intelligence-model",
        sourceDataVersion
      },
      ...intelligenceData
    };

    return NextResponse.json(deepIntelligence);

  } catch (error: any) {
    console.error("[Deep Content Intelligence] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withErrorHandling(POST_handler);
