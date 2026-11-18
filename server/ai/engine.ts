import { isGeminiConfigured, runGeminiInference } from './geminiProvider.ts';
import {
  getHuggingFaceTokenInfo,
  isHuggingFaceConfigured,
  runHuggingFaceInference,
} from './huggingfaceProvider.ts';
import { buildCareerAssessmentPrompt, buildFuturePredictionPrompt } from './prompts.ts';
import type {
  AIModelId,
  AIProviderStatus,
  CareerAssessmentInput,
  FuturePredictionInput,
  GeneratedCareerAssessment,
  GeneratedFuturePrediction,
} from './types.ts';

export function getAIProviderStatus(): AIProviderStatus {
  const { envKey: hfEnvKey } = getHuggingFaceTokenInfo();
  const hfConfigured = hfEnvKey !== null;
  const geminiConfigured = isGeminiConfigured();

  return {
    hfConfigured,
    hfEnvKey,
    geminiConfigured,
    defaultModel: hfConfigured ? 'Qwen/Qwen3-8B' : 'gemini-4-hydrogen',
    supportedModels: [
      {
        id: 'Qwen/Qwen3-8B',
        label: 'Qwen3-8B (Hugging Face)',
        family: 'Qwen3 (Hugging Face)',
        available: hfConfigured,
        note: hfConfigured
          ? `Connected via Hugging Face Inference Router (${hfEnvKey})`
          : 'Requires HF_TOKEN secret; routes through Gemini reasoning engine when HF_TOKEN is unset',
      },
      {
        id: 'Qwen/Qwen3.8-2.4T-A95B',
        label: 'Qwen3.8-2.4T-A95B (Hugging Face)',
        family: 'Qwen3 (Hugging Face)',
        available: hfConfigured,
        note: hfConfigured
          ? `Connected via Hugging Face Inference Router (${hfEnvKey})`
          : 'Requires HF_TOKEN secret; routes through Gemini reasoning engine when HF_TOKEN is unset',
      },
      {
        id: 'gemini-4-hydrogen',
        label: 'Gemini 4 Hydrogen',
        family: 'Gemini',
        available: geminiConfigured,
        note: 'Active server-side reasoning fallback and structured JSON engine',
      },
    ],
  };
}

async function executeWithModularRouting<T>(params: {
  preferredModel: AIModelId;
  system: string;
  user: string;
}): Promise<{ data: T; modelVersion: string; providerUsed: string }> {
  const hfReady = isHuggingFaceConfigured();
  const geminiReady = isGeminiConfigured();

  const wantsQwen = params.preferredModel.startsWith('Qwen/');

  if (wantsQwen && hfReady) {
    try {
      const res = await runHuggingFaceInference<T>({
        model: params.preferredModel,
        system: params.system,
        user: params.user,
      });
      return {
        data: res.data,
        modelVersion: res.modelUsed,
        providerUsed: 'huggingface-router',
      };
    } catch (hfError) {
      if (!geminiReady) {
        throw hfError;
      }
      console.warn('Hugging Face inference unavailable, routing to Gemini fallback:', hfError);
    }
  }

  if (!geminiReady) {
    throw new Error(
      'No AI inference provider is configured. Set GEMINI_API_KEY or HF_TOKEN in Settings > Secrets.'
    );
  }

  const geminiRes = await runGeminiInference<T>({
    system: params.system,
    user: params.user,
  });

  return {
    data: geminiRes.data,
    modelVersion: wantsQwen ? `${geminiRes.modelUsed} (Qwen3-compatible schema)` : geminiRes.modelUsed,
    providerUsed: 'gemini-server',
  };
}

export async function generateCareerAssessment(
  input: CareerAssessmentInput
): Promise<GeneratedCareerAssessment> {
  const { system, user } = buildCareerAssessmentPrompt(input.profile, input.previousAssessment);
  const result = await executeWithModularRouting<Omit<GeneratedCareerAssessment, 'modelVersion' | 'providerUsed'>>({
    preferredModel: input.preferredModel,
    system,
    user,
  });

  return {
    ...result.data,
    modelVersion: result.modelVersion,
    providerUsed: result.providerUsed,
    comparedWithAssessmentId: input.previousAssessment?.id || result.data.comparedWithAssessmentId || '',
    historicalComparison: input.previousAssessment ? result.data.historicalComparison ?? null : null,
  };
}

export async function generateFuturePrediction(
  input: FuturePredictionInput
): Promise<GeneratedFuturePrediction> {
  const { system, user } = buildFuturePredictionPrompt({
    category: input.category,
    subjectTitle: input.subjectTitle,
    country: input.country,
    city: input.city,
    focusSector: input.focusSector,
    inputContext: input.inputContext,
    linkedProfile: input.linkedProfile,
  });

  const result = await executeWithModularRouting<Omit<GeneratedFuturePrediction, 'modelVersion' | 'providerUsed'>>({
    preferredModel: input.preferredModel,
    system,
    user,
  });

  return {
    ...result.data,
    category: input.category,
    modelVersion: result.modelVersion,
    providerUsed: result.providerUsed,
  };
}
