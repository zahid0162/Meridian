export function extractJsonFromModelText<T>(rawText: string): T {
  // Strip Qwen3 <think>...</think> reasoning blocks if present
  const withoutThink = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Strip markdown code fences if present
  const withoutFences = withoutThink
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');
  const jsonSlice =
    firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
      ? withoutFences.slice(firstBrace, lastBrace + 1)
      : withoutFences;

  return JSON.parse(jsonSlice) as T;
}
