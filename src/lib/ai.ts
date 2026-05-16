// src/lib/ai.ts — AxiomAI · single OpenRouter key, all 5 models

export type Plan = "free" | "plus" | "pro" | "elite";

export interface AIModel {
  id: string;
  name: string;
  badge: "FREE" | "PLUS" | "PRO" | "ELITE";
  minPlan: Plan;
  color: string;
  desc: string;
  apiModel: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "deepseek-r1",
    name: "DeepSeek V3",
    badge: "FREE",
    minPlan: "free",
    color: "text-cyan-400",
    desc: "Chain-of-thought · Best for algebra & calculus",
    apiModel: "openrouter/auto",
  },
  {
    id: "gemini-flash",
    name: "Gemini 2.0 Flash",
    badge: "FREE",
    minPlan: "free",
    color: "text-blue-400",
    desc: "Google AI · Fast, accurate, great for word problems",
    apiModel: "google/gemini-2.0-flash-exp:free",
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    badge: "PLUS",
    minPlan: "plus",
    color: "text-purple-400",
    desc: "Expert at multi-step reasoning & proofs",
    apiModel: "mistralai/mistral-large",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    badge: "PRO",
    minPlan: "pro",
    color: "text-yellow-400",
    desc: "OpenAI flagship · Highest accuracy on hard problems",
    apiModel: "openai/gpt-4o",
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4.5",
    badge: "ELITE",
    minPlan: "elite",
    color: "text-pink-400",
    desc: "Best for proofs, research & LaTeX explanations",
    apiModel: "anthropic/claude-sonnet-4-5",
  },
];

export const PLAN_RANK: Record<string, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  elite: 3,
};

export function getAvailableModels(plan: string): AIModel[] {
  const rank = PLAN_RANK[plan] ?? 0;
  return AI_MODELS.filter((m) => PLAN_RANK[m.minPlan] <= rank);
}

export function isModelLocked(model: AIModel, plan: string): boolean {
  return PLAN_RANK[model.minPlan] > (PLAN_RANK[plan] ?? 0);
}

// ─── Math System Prompt ───────────────────────────────────────────────────────

export const MATH_SYSTEM_PROMPT = `You are AxiomAI, the world's most advanced mathematics tutor and problem-solving engine.

ABSOLUTE RULES — follow every single one:
1. RESPOND ONLY WITH A SINGLE VALID JSON OBJECT. No markdown fences, no backticks, no preamble, no trailing text.
2. ALL mathematical expressions inside JSON strings MUST use LaTeX. Escape every backslash twice (e.g. \\\\frac, \\\\sqrt, \\\\int, \\\\sum, \\\\pi, \\\\times, \\\\cdot).
3. Show EVERY step — never skip algebra, never skip substitution, never simplify in one leap.
4. For word problems: extract all variables first (step 1), write the equation (step 2), then solve.
5. Decimal answers: always give at least 4 decimal places unless the answer is a whole number or simple fraction.
6. Fractions: prefer exact fractions over decimals when rational (e.g. \\\\frac{1}{3} not 0.3333).
7. final_answer MUST be the simplest exact form (fraction, integer, or rounded 4 d.p. decimal).
8. final_answer_latex MUST be valid KaTeX-renderable LaTeX.
9. Minimum 3 steps, maximum 10 steps. Each step must advance the solution meaningfully.
10. If the problem has no solution or is ill-defined, set final_answer to "No solution" and explain in steps.

JSON SCHEMA (return EXACTLY this structure):
{
  "topic": "string",
  "subtopic": "string",
  "difficulty": "Elementary" | "Medium" | "Hard" | "Expert",
  "final_answer": "string",
  "final_answer_latex": "string",
  "problem_summary": "string",
  "steps": [
    {
      "step_number": 1,
      "title": "string",
      "latex": "string",
      "plain_english": "string"
    }
  ],
  "has_graph": false,
  "graph_function": ""
}`;

// ─── OpenRouter caller (used for ALL models) ──────────────────────────────────

async function callOpenRouter(
  apiModel: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4000
): Promise<string> {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) throw new Error("VITE_OPENROUTER_API_KEY is not set in Netlify environment variables.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://www.axiomai.website",
      "X-Title": "AxiomAI",
    },
    body: JSON.stringify({
      model: apiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter error ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter returned an empty response.");
  return text.trim();
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function callAI(modelId: string, userPrompt: string): Promise<string> {
  const model = AI_MODELS.find((m) => m.id === modelId);
  if (!model) throw new Error(`Unknown model id: "${modelId}"`);

  try {
    return await callOpenRouter(model.apiModel, MATH_SYSTEM_PROMPT, userPrompt, 4000);
  } catch (e) {
    if (model.id === "deepseek-r1") throw e;
    console.warn(`[AxiomAI] ${model.name} failed, falling back to auto:`, e);
    return await callOpenRouter("openrouter/auto", MATH_SYSTEM_PROMPT, userPrompt, 4000);
  }
}

// ─── Chat caller (ProfessorChat) ─────────────────────────────────────────────

export async function callAIChat(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) throw new Error("VITE_OPENROUTER_API_KEY is not set.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://www.axiomai.website",
      "X-Title": "AxiomAI",
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter chat error ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty chat response.");
  return text.trim();
}

// ─── Quiz caller (QuizPortal) ─────────────────────────────────────────────────

export async function callAIQuiz(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) throw new Error("VITE_OPENROUTER_API_KEY is not set.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://www.axiomai.website",
      "X-Title": "AxiomAI",
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: "You are a math quiz generator. Always respond with valid JSON only, no markdown, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter quiz error ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty quiz response.");
  return text.trim();
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

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

  throw new Error("The AI returned a response that could not be parsed. Please try again.");
}

// ─── Error utilities ──────────────────────────────────────────────────────────

export function isQuotaError(error: any): boolean {
  const msg = (error?.message || String(error)).toLowerCase();
  return (
    msg.includes("429") || msg.includes("quota") || msg.includes("rate_limit") ||
    msg.includes("resource_exhausted") || msg.includes("at capacity") ||
    msg.includes("out of credits") || msg.includes("too many requests") ||
    msg.includes("402") || msg.includes("insufficient balance")
  );
}

export function isAuthError(error: any): boolean {
  const msg = (error?.message || "").toLowerCase();
  return (
    msg.includes("401") || msg.includes("403") || msg.includes("invalid_api_key") ||
    msg.includes("authentication") || msg.includes("unauthorized") ||
    msg.includes("not configured") || msg.includes("not set")
  );
}

export function getErrorMessage(error: any, modelName: string): string {
  if (isQuotaError(error)) return `${modelName} is at capacity. Try a different AI model.`;
  if (isAuthError(error))
    return `OpenRouter API key is missing. Add VITE_OPENROUTER_API_KEY in Netlify → Environment variables.`;
  return error?.message || `An unexpected error occurred with ${modelName}.`;
}
