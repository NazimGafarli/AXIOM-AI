const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "undefined") {
  console.warn("VITE_OPENROUTER_API_KEY is not defined. AI features will fail.");
}

async function callOpenRouter(model: string, prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://www.axiomai.website",
      "X-Title": "AxiomAI",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert math tutor. Solve math problems step by step clearly and concisely. Always return valid JSON only, no markdown, no backticks, no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`OpenRouter error ${res.status}: ${err?.error?.message || "unknown"}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from " + model);
  return text;
}

export async function askGroq(prompt: string): Promise<string> {
  // ── Primary: Gemini 2.0 Flash free via OpenRouter ──
  try {
    return await callOpenRouter("google/gemini-2.0-flash-exp:free", prompt);
  } catch (e) {
    console.warn("Gemini free failed, trying DeepSeek free:", e);
  }

  // ── Fallback: DeepSeek V3 free via OpenRouter ──
  try {
    return await callOpenRouter("deepseek/deepseek-chat-v3-0324:free", prompt);
  } catch (e) {
    console.error("Both free models failed:", e);
    throw new Error("All AI providers failed. Please try again.");
  }
}

export function isQuotaError(error: any): boolean {
  if (!error) return false;
  const message = (error.message || "").toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate_limit") ||
    message.includes("quota exceeded") ||
    message.includes("402") ||
    message.includes("insufficient balance")
  );
}

export function parseJSONResponse(text: string) {
  // Strip markdown code fences if present
  const stripped = text.replace(/```json\n?|```/g, "").trim();

  // Try direct parse first
  try {
    return JSON.parse(stripped);
  } catch (_) {}

  // Extract JSON object from surrounding text
  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("The AI returned an invalid format. Please try again.");
  }

  const jsonContent = stripped.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonContent);
  } catch (e) {
    throw new Error("Failed to parse the solution. Please try again.");
  }
}
