import { Router } from "express";
import { db } from "@workspace/db";
import { scriptAnalysesTable, generatedScriptsTable } from "@workspace/db";
import { AnalyzeScriptBody, GenerateScriptBody } from "@workspace/api-zod";
import { callAI } from "./ai.js";
import { desc } from "drizzle-orm";

const router = Router();

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzeScriptBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { script, outputMode } = parsed.data;
  const wordCount = script.split(/\s+/).length;
  const estMinutes = Math.round(wordCount / 145);
  const hookText = script.split(/\s+/).slice(0, 80).join(" ");

  const prompt = `You are an elite YouTube script analyst who has studied thousands of viral scripts across faceless channels, commentary channels, news channels, and educational niches. You understand exactly what separates 100K-view scripts from dead content.

Analyze this YouTube script with surgical precision using the proven frameworks below.

---

SCRIPT STATS:
- Word count: ${wordCount} words
- Estimated runtime: ~${estMinutes} minutes (at 130-160 WPM)
- Hook preview (first 80 words): "${hookText}..."

FULL SCRIPT:
${script}

---

ANALYZE USING THESE FRAMEWORKS:

## 1. HOOK ANALYSIS (First 10–15 seconds)
The largest viewer drop-off happens in the first 15–30 seconds. Identify:
- Which hook technique is used: Specific Promise / Curiosity Gap / Bold Claim / Problem Statement / Shocking Stat
- How effectively does it prevent scrolling?
- Does the intro stay within 3–4 lines (short intro rule)?
- Rate the hook: Weak / Average / Strong / Elite — and explain why

## 2. SCRIPT FRAMEWORK IDENTIFICATION
Which framework does this script use?
- AIDA (Attention → Interest → Desire → Action)
- PAS (Problem → Agitate → Solution)
- Problem–Solution–Benefit
- Storytelling Arc (Hook → Conflict → Resolution → Lesson)
- 3-Level Script Model (Structural Clarity + Psychological Triggers + Performance Layer)
Explain exactly how the framework is applied.

## 3. RETENTION MECHANICS
- Open Loops used (e.g., "Later I'll show you..."): list them
- Pattern Interrupts: visual cues, music shifts, on-screen graphics mentioned?
- Rehooks: Are there re-engagement sentences after every 2 paragraphs? List examples.
- Curiosity Gaps: where does it tease future value without revealing everything?
- Transition pacing: is it fast enough between sections?

## 4. TONE & STORYTELLING
- Tone (e.g., authoritative, conversational, sarcastic, dramatic)
- Humor/Sarcasm ratio (ideal: ~20% light humor in most niches)
- Storytelling structure: does it tell a story or just list facts?
- Clip suggestions mentioned in the script (faceless channel readiness)

## 5. SEO & KEYWORD USAGE
- Primary and secondary keywords identified
- Natural keyword placement vs forced
- Search intent alignment

## 6. CTA PLACEMENT
- Mid-roll soft CTA present?
- End-of-video strong CTA present?
- Rate CTA effectiveness

## 7. WEAKNESSES & GAPS
- Where does the script risk losing viewers?
- Any filler, repetition, over-explaining?
- Missing elements (rehooks, open loops, pattern interrupts)?

## 8. REUSABLE FORMULA
Extract a 6-step formula from this script that an AI can replicate to produce a similar high-retention script. Be specific and actionable.`;

  const analysis = await callAI(prompt, outputMode);

  const scriptPreview = script.substring(0, 300) + (script.length > 300 ? "..." : "");

  const [saved] = await db.insert(scriptAnalysesTable).values({
    scriptPreview,
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
  const parsed = GenerateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { title, scriptAnalysis, targetWordCount, outputMode } = parsed.data;
  const wordTarget = targetWordCount || 1300;

  const prompt = `You are an elite YouTube script writer. You have written scripts that have gotten 100K+ views in a single day across niches like news, commentary, celebrity drama, sports, politics, and education. You know every proven script framework by heart.

${scriptAnalysis ? `COMPETITOR SCRIPT ANALYSIS (use this as your format template — extract the tone, hook style, framework, rehook frequency, and engagement mechanics from it):

${scriptAnalysis}

---` : ""}

TITLE: "${title}"
TARGET: ~${wordTarget} words (at 130-160 WPM = ~${Math.round(wordTarget / 145)} minutes)

Write a COMPLETE, READY-TO-RECORD YouTube script using ALL of these proven rules:

---

RULES YOU MUST FOLLOW:

### HOOK (First 10–15 seconds — most critical)
- Maximum 3–4 lines — short intro rule is non-negotiable
- Use ONE of: Specific Promise | Curiosity Gap | Bold Claim | Shocking Stat | Problem Statement
- Must prevent scrolling instantly. Example style:
  "I tested 10 viral YouTube script formats. Only one doubled my retention."
  "This one mistake is killing your watch time — and you don't even know you're making it."
- Do NOT start with "Hey guys", "Welcome back", or generic intros

### SETUP (after hook)
- Clarify: the problem, the promise, the outcome
- Example: "By the end of this video, you'll have a formula you can use immediately."

### BODY — RETENTION MECHANICS (mandatory)
1. REHOOKS after every 2 paragraphs — small sentences that pull viewers back:
   - Can be sarcastic, dramatic, or a plot twist
   - Use "But...", "However...", "What happened next shocked everyone..."
   - Add shocking stats or counterintuitive facts as rehooks
   - Write these as natural spoken sentences — no labels or brackets

2. OPEN LOOPS throughout — tease future content without revealing it:
   - "Later I'll show you the exact formula I used..."
   - "And that leads to something even more surprising..."
   - Write these as natural spoken sentences — no labels or brackets

3. STORYTELLING — even factual scripts must sound like a story:
   - Use narrative arc: Hook → Conflict → Rising tension → Resolution → Lesson
   - Make viewers feel like they're watching a story unfold, not reading a list

4. HUMOR/SARCASM — ~20% light humor keeps it human:
   - Subtle jabs, ironic observations, relatable jokes
   - Do NOT force humor — make it feel natural

5. CURIOSITY GAPS — tease future reveals:
   - "And the answer? Not what you'd expect."
   - "You won't believe what happened at step 3."

### VALUE DELIVERY
- Clear sections with transitions
- Avoid: rambling, repetition, over-explaining, filler phrases
- Write conversationally — short sentences, natural rhythm, punchy

### CTA PLACEMENT
- Mid-roll SOFT CTA (around halfway): mention a related video or subscription naturally — as plain spoken words
- End STRONG CTA: clear, direct, outcome-focused — as plain spoken words
  Example: "If this worked for you, hit subscribe — I drop strategies like this every week."

### FORMAT
- Write the full script as clean voiceover narration only — words the presenter will speak out loud
- Do NOT include any production notes, stage directions, or bracketed labels such as [B-ROLL], [CLIP], [GRAPHIC], [REHOOK], [OPEN LOOP], [MID-ROLL CTA], [END CTA], or any similar markers
- No headers, no section titles, no meta-commentary — just the spoken script from first word to last
- Do NOT add meta-commentary like "Here is your script" — start directly with the hook

Now write the complete script:`;

  const rawScript = await callAI(prompt, outputMode);

  // Strip ANY bracketed text (production notes, markers, directions)
  const script = rawScript
    .replace(/\[[^\]]+\]/g, "")        // remove ALL bracketed content
    .replace(/\s+/g, " ")               // normalize multiple spaces
    .replace(/\n{3,}/g, "\n\n")        // collapse excess blank lines
    .trim();

  const wordCount = script.split(/\s+/).length;

  const [saved] = await db.insert(generatedScriptsTable).values({
    title,
    script,
    wordCount,
    outputMode,
  }).returning();

  return res.json({
    id: saved.id,
    title: saved.title,
    script: saved.script,
    wordCount: saved.wordCount,
    outputMode: saved.outputMode,
    createdAt: saved.createdAt.toISOString(),
  });
});

export default router;
