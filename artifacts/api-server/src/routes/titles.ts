import { Router } from "express";
import { db } from "@workspace/db";
import { titleAnalysesTable } from "@workspace/db";
import { AnalyzeTitlesBody, GenerateTitlesBody } from "@workspace/api-zod";
import { callAI } from "./ai.js";
import { desc } from "drizzle-orm";

const router = Router();

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzeTitlesBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { titles, outputMode, customPrompt } = parsed.data;
  const titlesText = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const defaultAnalysis = `You are an elite YouTube CTR and title strategist who has analyzed thousands of viral YouTube titles. You understand the psychology behind what makes viewers click — and what makes them scroll past.

Analyze these ${titles.length} competitor YouTube titles using the framework below. Be brutally honest and deeply specific.

TITLES TO ANALYZE:
${titlesText}

---

ANALYZE USING THESE LAYERS:

## 1. HOOK PSYCHOLOGY PER TITLE
For each title, identify which hook technique is used:
- **Specific Promise** — promises a clear, tangible result ("3 Ways to Double Your Retention")
- **Curiosity Gap** — creates an information gap the viewer must close ("The Secret They Don't Want You to Know")
- **Bold Claim** — makes a strong, provocative statement ("This Mistake is Killing Your Channel")
- **Shocking Stat/Fact** — uses a number or fact to shock ("I Lost $50K Doing This")
- **Problem Statement** — addresses a pain point directly ("Why Your Videos Get Zero Views")
- **Story Hook** — pulls you into a narrative ("I Quit My Job to Test This — Here's What Happened")

## 2. CTR TRIGGERS (EMOTIONAL & PSYCHOLOGICAL)
- What emotions do these titles trigger? (fear, curiosity, greed, urgency, FOMO, excitement)
- Which words are power words (proven high-CTR vocabulary)?
- Which titles use numbers — and how effectively?
- Personalization patterns ("You", "Your", "I", "My")

## 3. KEYWORD STRATEGY
- Primary keyword in each title — where is it placed (front, middle, end)?
- Secondary keywords identified
- SEO intent: Informational / Investigative / Transactional / Navigational
- Keyword density vs natural readability balance

## 4. FORMAT & STRUCTURE PATTERNS
- Character length analysis (YouTube optimal: 50–70 characters)
- Common format patterns across titles (listicle, question, how-to, story, statement)
- Bracket/parenthesis use [e.g., (Worked in 24 hours)]
- Capitalization patterns

## 5. CURIOSITY GAP ANALYSIS
- Which titles withhold information to force a click?
- Rate each title's curiosity gap: None / Weak / Medium / Strong / Elite
- What information is being teased vs revealed?

## 6. WINNING FORMULA
- What is the single most powerful title pattern used across this set?
- Write a fill-in-the-blank formula template that captures the best elements:
  e.g., "[Number] [Emotional Word] [Topic] That [Unexpected Outcome] (Even If [Common Objection])"
- What emotional vocabulary should ALL future titles use from this niche?

## 7. RANKING: TOP 3 PERFORMING TITLES
Rank the top 3 titles by likely CTR performance and explain exactly why each one wins.

## 8. GAPS & OPPORTUNITIES
What patterns are MISSING from these titles that could outperform them?`;

  const prompt = customPrompt?.trim()
    ? `You are an expert faceless YouTuber and YouTube title analyst with multiple successful faceless channels generating millions of views. You think like a strategist, not just an analyst.

TITLES TO ANALYZE (go through EACH one individually):
${titlesText}

---

USER INSTRUCTIONS — follow these exactly:
${customPrompt.trim()}

---

MANDATORY OUTPUT FORMAT (always use these exact markdown headings):

Start with:
## OVERALL PATTERNS
(2–3 sentences on what makes this title set work overall)

Then for EACH of the ${titles.length} titles (numbered 1 through ${titles.length}), use this exact heading format:
## TITLE [N]: [exact title text]
Under each title cover:
- **Format:** (listicle / question / bold claim / story / specific promise)
- **Why it wins:** the specific psychological trigger
- **Primary keyword:** what it is, placement (front/middle/end), character count
- **Vocabulary:** power words, emotional words, curiosity words used
- **Curiosity gap:** None / Weak / Medium / Strong / Elite
- **Rewrite suggestion:** one stronger version

End with:
## WINNING FORMULA
The single fill-in-the-blank template extracted from this title set.

## VOCABULARY TO STEAL
Bullet list of the best words/phrases from these titles to reuse.`
    : defaultAnalysis;

  const analysis = await callAI(prompt, outputMode);

  const [saved] = await db.insert(titleAnalysesTable).values({
    titles,
    analysis,
    outputMode,
  }).returning();

  return res.json({
    id: saved.id,
    analysis: saved.analysis,
    outputMode: saved.outputMode,
    createdAt: saved.createdAt.toISOString(),
  });
});

router.post("/generate", async (req, res) => {
  const parsed = GenerateTitlesBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { analysis, niche, outputMode, customGeneratePrompt } = parsed.data;

  const defaultGeneratePrompt = `You are an elite YouTube title strategist. Based on the deep competitor title analysis below, generate 5 viral YouTube titles that will outperform the competition.

COMPETITOR ANALYSIS:
${analysis}

${niche ? `NICHE/TOPIC: ${niche}` : ""}

---

RULES FOR THE 5 TITLES:

1. **CTR Psychology First** — every title must trigger at least ONE of: curiosity, fear, urgency, FOMO, greed, or excitement
2. **Use the winning formula** extracted from the analysis — match the format pattern that dominated
3. **Keyword placement** — primary keyword in the first 3–5 words where possible (for SEO)
4. **Length** — 50–70 characters is the sweet spot. Do not exceed 80.
5. **Power words** — use high-CTR emotional vocabulary from the analysis
6. **Curiosity gap** — at least 3 of the 5 titles must create an information gap
7. **Each title must be distinctly different** — vary the format (listicle, question, bold claim, story hook, specific promise)
8. **No clickbait** — the title must honestly reflect what the video delivers

OUTPUT FORMAT:
List the 5 titles numbered 1–5. After each title, write ONE sentence explaining which hook technique it uses and why it will perform.

Then add:
**STRONGEST TITLE:** [pick the #1 title]
**3 POWER VARIATIONS of the strongest title:**
- Variation A: [same topic, different angle]
- Variation B: [same topic, different emotion]
- Variation C: [same topic, question format]

Then end with:
**WHY THESE WILL WIN:** 2–3 sentences on the combined strategy.`;

  const prompt = customGeneratePrompt?.trim()
    ? `You are an elite YouTube title strategist with deep expertise in faceless channels that generate millions of views.

COMPETITOR TITLE ANALYSIS (this is your foundation — extract the winning formula, subject, emotional vocabulary, and keyword strategy from it):
${analysis}

${niche ? `NICHE/TOPIC: ${niche}` : ""}

---

USER INSTRUCTIONS — follow these exactly:
${customGeneratePrompt.trim()}

---

MANDATORY OUTPUT FORMAT (always include, regardless of user instructions):
List the 5 titles numbered 1–5.
After each title, include:
- Hook technique used
- Character count
- Why this will outperform the competitor's version

Then add:
**STRONGEST TITLE:** [pick the #1 title]
**3 POWER VARIATIONS:**
- Variation A: [same topic, different angle]
- Variation B: [same topic, different emotion]
- Variation C: [same topic, question format]`
    : defaultGeneratePrompt;

  const result = await callAI(prompt, outputMode);

  const lines = result.split("\n").filter((l) => l.trim());
  const titleLines = lines.filter((l) => /^\d+[.)]\s/.test(l.trim())).slice(0, 5);
  const titles = titleLines.length >= 3
    ? titleLines.map((l) => l.replace(/^\d+[.)]\s*/, "").replace(/\s*—.*$/, "").replace(/\*\*/g, "").trim())
    : lines.filter((l) => l.trim().length > 20 && l.trim().length < 120).slice(0, 5);

  return res.json({
    titles: titles.length >= 3 ? titles : ["See full response below"],
    explanation: result,
  });
});

router.get("/", async (_req, res) => {
  const rows = await db.select().from(titleAnalysesTable).orderBy(desc(titleAnalysesTable.createdAt)).limit(20);
  return res.json({
    analyses: rows.map((r) => ({
      id: r.id,
      titles: r.titles as string[],
      analysis: r.analysis,
      outputMode: r.outputMode,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

export default router;
