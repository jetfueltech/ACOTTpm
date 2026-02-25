
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for environments where process.env.API_KEY might not be directly available at module load time.
  // In a real build process, this would be handled by the build tool.
  // For this environment, we rely on it being set globally.
  console.warn("API_KEY for Gemini is not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "YOUR_API_KEY_PLACEHOLDER" }); // Fallback to avoid crash if not set

export const generatePropertyDescription = async (features: string): Promise<string> => {
  if (!API_KEY) {
    return "API Key not configured. Please set the API_KEY environment variable.";
  }
  try {
    const prompt = `Generate a compelling real estate property description based on the following features. Make it sound attractive to potential renters. Do not use markdown formatting, just plain text. Features: ${features}`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating property description:", error);
    if (error instanceof Error) {
        return `Failed to generate description: ${error.message}`;
    }
    return "Failed to generate description due to an unknown error.";
  }
};
