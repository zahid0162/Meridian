import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { extractJsonFromModelText } from './jsonParser.ts';

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY');
}

export async function runGeminiInference<T>(params: {
  system: string;
  user: string;
}): Promise<{ data: T; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: params.user,
    config: {
      systemInstruction: params.system,
      responseMimeType: 'application/json',
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MEDIUM,
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return {
    data: extractJsonFromModelText<T>(text),
    modelUsed: 'gemini-4-hydrogen',
  };
}
