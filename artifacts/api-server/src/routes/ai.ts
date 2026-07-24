import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT =
  "You are a world-class YouTube growth strategist specializing in faceless channels that generate millions of views. You understand CTR psychology, retention engineering, and viral content structure deeply. You have analyzed thousands of YouTube channels and written hundreds of viral scripts.";

export async function callAI(userPrompt: string, outputMode: "docs" | "text"): Promise<string> {
  const modeInstruction =
    outputMode === "docs"
      ? `Return a structured markdown report with clear headings (##), bullet points, and sections. Format like a professional document with: Summary, Key Insights, Analysis, Keywords, Strategy, and Final Output sections.`
      : `Return plain conversational text only. No markdown headings, no special formatting. Use simple paragraphs and bullet points only where absolutely necessary. Write like you're explaining to a friend.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT}\n\nOUTPUT FORMAT RULE: ${modeInstruction}` },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "No response generated.";
}
