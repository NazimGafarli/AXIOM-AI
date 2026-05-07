import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === "undefined") {
  console.warn("GEMINI_API_KEY is not defined. AI features will fail.");
}

export const MODEL_NAMES = {
  PRO: "gemini-3.1-pro-preview",
  FLASH: "gemini-3-flash-preview",
  LITE: "gemini-3.1-flash-lite-preview",
};

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export { Type };

export function isQuotaError(error: any): boolean {
  if (!error) return false;
  
  // Handle various error formats from different SDKs/API versions
  const message = (error.message || error?.error?.message || "").toLowerCase();
  const status = String(error.status || error?.error?.status || "").toUpperCase();
  const reason = (error?.reason || "").toUpperCase();

  return (
    message.includes("429") || 
    message.includes("resource_exhausted") || 
    message.includes("quota exceeded") ||
    message.includes("at capacity") ||
    message.includes("out of credits") ||
    status === "RESOURCE_EXHAUSTED" ||
    reason === "QUOTA"
  );
}

/**
 * Utility to parse JSON from model response, 
 * cleaning up any potential Markdown blocks.
 */
export function parseJSONResponse(text: string) {
  // Try to find the first '{' and last '}' to extract a JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    // If no braces found, try cleaning as before just in case it's a simple string or malformed
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON Parse Error (No braces):", e, "Original text:", text);
      throw new Error("The AI returned an invalid format. Please try again.");
    }
  }

  const jsonContent = text.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonContent);
  } catch (e) {
    console.error("JSON Parse Error (With braces):", e, "Extracted content:", jsonContent);
    // Final fallback: try raw text cleaning
    const cleanedFallback = text.replace(/```json\n?|```/g, "").trim();
    try {
      return JSON.parse(cleanedFallback);
    } catch (e2) {
      throw new Error("Failed to parse the mathematical solution. Please try re-phrasing.");
    }
  }
}
