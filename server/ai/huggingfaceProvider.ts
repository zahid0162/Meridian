import { extractJsonFromModelText } from './jsonParser.ts';

const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';

const HF_ENV_CANDIDATES = [
  'HF_TOKEN',
  'HF_INFERENCE_TOKEN',
  'HF_PROVIDER_TOKEN',
  'HF_API_TOKEN',
  'HF_API_KEY',
  'HF_INFERENCE_API_KEY',
  'HUGGINGFACE_TOKEN',
  'HUGGINGFACE_API_KEY',
  'HUGGINGFACE_API_TOKEN',
  'HUGGING_FACE_HUB_TOKEN',
  'HUGGINGFACEHUB_API_TOKEN',
  'INFERENCE_PROVIDER_TOKEN',
] as const;

export function getHuggingFaceTokenInfo(): { token: string | null; envKey: string | null } {
  for (const key of HF_ENV_CANDIDATES) {
    const raw = process.env[key]?.trim();
    if (raw && raw !== 'MY_HUGGINGFACE_TOKEN' && raw.length > 6) {
      return { token: raw, envKey: key };
    }
  }

  for (const key of Object.keys(process.env)) {
    const val = process.env[key]?.trim();
    if (!val || val === 'MY_HUGGINGFACE_TOKEN') continue;
    if (/^(HF|HUGGING_?FACE|INFERENCE).*(TOKEN|KEY|SECRET)$/i.test(key) && val.length > 6) {
      return { token: val, envKey: key };
    }
    if (val.startsWith('hf_') && val.length > 12) {
      return { token: val, envKey: key };
    }
  }

  return { token: null, envKey: null };
}

export function isHuggingFaceConfigured(): boolean {
  return getHuggingFaceTokenInfo().token !== null;
}

async function callHuggingFaceRouter(params: {
  token: string;
  model: string;
  system: string;
  user: string;
}): Promise<{ rawContent: string; modelUsed: string }> {
  const response = await fetch(HF_ROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
      max_tokens: 6144,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Hugging Face Router (${params.model}) failed (${response.status}): ${errBody.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Hugging Face Router (${params.model}) returned an empty response.`);
  }

  return {
    rawContent: content,
    modelUsed: payload.model || params.model,
  };
}

export async function runHuggingFaceInference<T>(params: {
  model: string;
  system: string;
  user: string;
}): Promise<{ data: T; modelUsed: string }> {
  const { token } = getHuggingFaceTokenInfo();
  if (!token) {
    throw new Error('HF_TOKEN is not configured.');
  }

  const candidates =
    params.model === 'Qwen/Qwen3-8B'
      ? ['Qwen/Qwen3-8B', 'Qwen/Qwen3-8B:fastest']
      : [params.model, 'Qwen/Qwen3-8B', 'Qwen/Qwen3-8B:fastest'];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const res = await callHuggingFaceRouter({
        token,
        model: candidate,
        system: params.system,
        user: params.user,
      });
      return {
        data: extractJsonFromModelText<T>(res.rawContent),
        modelUsed: res.modelUsed,
      };
    } catch (err) {
      lastError = err;
      console.warn(`HF Inference attempt failed for ${candidate}:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Hugging Face inference failed.');
}
