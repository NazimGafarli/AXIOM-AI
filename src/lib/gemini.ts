import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

if (!apiKey || apiKey === "undefined") {
  console.warn("VITE_GROQ_API_KEY is not defined. AI features will fail.");
}

export const groqClient = new Groq({
  apiKey: apiKey || "",
  dangerouslyAllowBrowser: true,
});

export async function askGroq(prompt: string): Promise<string> {
  const response = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are an expert math tutor. Solve math problems step by step clearly and concisely.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  return response.choices[0]?.message?.content || "No answer";
}

export function isQuotaError(error: any): boolean {
  if (!error) return false;
  const message = (error.message || "").toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate_limit") ||
    message.includes("quota exceeded")
  );
}

export function parseJSONResponse(text: string) {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error("The AI returned an invalid format. Please try again.");
    }
  }
  const jsonContent = text.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonContent);
  } catch (e) {
    throw new Error("Failed to parse the solution. Please try again.");
  }
}
