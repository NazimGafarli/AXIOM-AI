// ─── src/lib/ai.ts ───────────────────────────────────────────────────────────
// Full multi-provider AI library for AXIOM-AI
// Free models via OpenRouter — verified slugs May 2026
// ─────────────────────────────────────────────────────────────────────────────

export type Plan = "free" | "plus" | "pro" | "research";

export interface AIModel {
  id: string;
  name: string;
  provider: "openrouter" | "mistral" | "openai" | "anthropic";
  badge: "FREE" | "PLUS" | "PRO" | "ELITE";
  minPlan: Plan;
  color: string;
  desc: string;
  apiModel: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "openrouter",
    badge: "FREE",
    minPlan: "free",
    color: "text-cyan-400",
    desc: "Math-specialized · Chain-of-thought reasoning",
    apiModel: "deepseek/deepseek-r1-0528:free",   // ✅ verified free May 2026
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini Flash (free)",
    provider: "openrouter",
    badge: "FREE",
    minPlan: "free",
    color: "text-blue-400",
    desc: "Google AI · Strong on word problems",
    apiModel: "google/gemma-4-26b-a4b:free",       // ✅ verified free May 2026
  },
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    provider: "mistral",
    badge: "PLUS",
    minPlan: "plus",
    color: "text-purple-400",
    desc: "Expert at multi-step word problems",
    apiModel: "mistral-large-latest",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    badge: "PRO",
    minPlan: "pro",
    color: "text-yellow-400",
    desc: "OpenAI flagship · Highest accuracy",
    apiModel: "gpt-4o",
  },
  {
    id: "claude-opus",
    name: "Claude Opus",
    provider: "anthropic",
    badge: "ELITE",
    minPlan: "research",
    color: "text-pink-400",
    desc: "Best for proofs, research & LaTeX",
    apiModel: "claude-opus-4-5",
  },
];

export const PLAN_RANK: Record<Plan | string, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  research: 3,
  elite: 3,
};

export function getAvailableModels(plan: Plan | string): AIModel[] {
  const rank = PLAN_RANK[plan] ?? 0;
  return AI_MODELS.filter((m) => PLAN_RANK[m.minPlan] <= rank);
}

export function isModelLocked(model: AIModel, plan: Plan | string): boolean {
  return PLAN_RANK[model.minPlan] > (PLAN_RANK[plan] ?? 0);
}

// ─── Math System Prompt ──────────────────────────────────────────────────────

export const MATH_SYSTEM_PROMPT = `You are AxiomAI, the world's most advanced mathematics tutor and problem-solving engine.

ABSOLUTE RULES — follow every single one:
1. RESPOND ONLY WITH A SINGLE VALID JSON OBJECT. No markdown fences, no backticks, no preamble, no trailing text.
2. ALL mathematical expressions inside JSON strings MUST use LaTeX. Escape every backslash twice (e.g. \\\\frac, \\\\sqrt, \\\\int, \\\\sum, \\\\pi, \\\\times, \\\\cdot).
3. Show EVERY step — never skip algebra, never skip substitution, never simplify in one leap.
4. For word problems: extract all variables first (step 1), write the equation (step 2), then solve.
5. Decimal answers: always give at least 4 decimal places of precision unless the answer is a whole number or a simple fraction.
6. Fractions: prefer exact fractions over decimals when the answer is rational (e.g. \\\\frac{1}{3} not 0.3333).
7. final_answer MUST be the simplest exact form (fraction, integer, or rounded 4 d.p. decimal).
8. final_answer_latex MUST be valid KaTeX-renderable LaTeX — test mentally before writing.
9. Minimum 3 steps, maximum 10 steps. Each step must advance the solution meaningfully.
10. If the problem has no solution or is ill-defined, set final_answer to "No solution" and explain in steps.

JSON SCHEMA (return EXACTLY this structure, no extra keys):
{
  "topic": "string — e.g. Algebra, Calculus, Statistics",
  "subtopic": "string — e.g. Quadratic Equations, Integration by Parts",
  "difficulty": "Elementary" | "Medium" | "Hard" | "Expert",
  "final_answer": "string — plain text final answer",
  "final_answer_latex": "string — LaTeX of final answer only",
  "problem_summary": "string — 1-2 sentences explaining what this problem teaches",
  "steps": [
    {
      "step_number": 1,
      "title": "string — short step title",
      "latex": "string — LaTeX expression for this step",
      "plain_english": "string — clear English explanation of what this step does and why"
    }
  ],
  "has_graph": false,
  "graph_function": ""
}`;

// ─── Per-Provider Callers ─────────────────────────────────────────────────────

async function callOpenRouter(apiModel: string, userPrompt: string): Promise<string> {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) throw new Error("VITE_OPENROUTER_API_KEY is not configured in Netlify environment variables.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://www.axiomai.website",
      "X-Title": "AxiomAI",
    },
    body: JSON.stringify({
      model: apiModel,
      messages: [
        { role: "system", content: MATH_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `OpenRouter error ${res.status}: ${err?.error?.message || res.statusText}`
    );
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter returned an empty response.");
  return text.trim();
}

async function callMistral(userPrompt: string): Promise<string> {
  const key = import.meta.env.VITE_MISTRAL_API_KEY;
  if (!key) throw new Error("VITE_MISTRAL_API_KEY is not configured in Netlify environment variables.");

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: MATH_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.05,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Mistral API error ${res.status}: ${err?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Mistral returned an empty response.");
  return text.trim();
}

async function callOpenAI(userPrompt: string): Promise<string> {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) throw new Error("VITE_OPENAI_API_KEY is not configured in Netlify environment variables.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: MATH_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.05,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI API error ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty response.");
  return text.trim();
}

async function callAnthropic(userPrompt: string): Promise<string> {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) throw new Error("VITE_ANTHROPIC_API_KEY is not configured in Netlify environment variables.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 3000,
      system: MATH_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Anthropic API error ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Anthropic returned an empty response.");
  return text.trim();
}

// ─── Main Dispatcher ──────────────────────────────────────────────────────────

export async function callAI(modelId: string, userPrompt: string): Promise<string> {
  const model = AI_MODELS.find((m) => m.id === modelId);
  if (!model) throw new Error(`Unknown model id: "${modelId}"`);

  switch (model.provider) {
    case "openrouter":
      return callOpenRouter(model.apiModel, userPrompt);
    case "mistral":
      return callMistral(userPrompt);
    case "openai":
      return callOpenAI(userPrompt);
    case "anthropic":
      return callAnthropic(userPrompt);
    default:
      throw new Error(`Unknown provider: "${(model as any).provider}"`);
  }
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────

export function parseJSONResponse(text: string): any {
  if (!text) throw new Error("Empty response from AI.");

  try { return JSON.parse(text); } catch (_) {}

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_) {}
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)); } catch (_) {}
  }

  const cleaned = text
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
  const f = cleaned.indexOf("{");
  const l = cleaned.lastIndexOf("}");
  if (f !== -1 && l > f) {
    try { return JSON.parse(cleaned.substring(f, l + 1)); } catch (e) {
      console.error("[AxiomAI] JSON parse failed:", e);
    }
  }

  throw new Error("The AI returned a response that could not be parsed. Please try again.");
}

// ─── Error Utilities ──────────────────────────────────────────────────────────

export function isQuotaError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || String(error)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate_limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("at capacity") ||
    msg.includes("out of credits") ||
    msg.includes("too many requests") ||
    msg.includes("402") ||
    msg.includes("insufficient balance")
  );
}

export function isAuthError(error: any): boolean {
  const msg = (error?.message || "").toLowerCase();
  return (
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("invalid_api_key") ||
    msg.includes("authentication") ||
    msg.includes("unauthorized") ||
    msg.includes("not configured")
  );
}

export function getErrorMessage(error: any, modelName: string): string {
  if (isQuotaError(error)) return `${modelName} is at capacity. Try a different AI model.`;
  if (isAuthError(error)) return `${modelName} API key is missing or invalid. Check your Netlify environment variables.`;
  return error?.message || `An unexpected error occurred with ${modelName}.`;
}
