import type {
  CareerAssessment,
  FuturePrediction,
  PersonalProfile,
  PredictionCategoryId,
} from '../../src/types/intelligence.ts';

export type AIModelId = 'Qwen/Qwen3-8B' | 'Qwen/Qwen3.8-2.4T-A95B' | 'gemini-4-hydrogen';

export interface CareerAssessmentInput {
  profile: PersonalProfile;
  preferredModel: AIModelId;
  previousAssessment?: CareerAssessment | null;
}

export type GeneratedCareerAssessment = Omit<
  CareerAssessment,
  'id' | 'ownerId' | 'profileId' | 'profileSnapshot' | 'createdAt'
>;

export interface FuturePredictionInput {
  category: PredictionCategoryId;
  subjectTitle: string;
  country: string;
  city: string;
  focusSector: string;
  inputContext: string;
  linkedProfile?: PersonalProfile | null;
  preferredModel: AIModelId;
}

export type GeneratedFuturePrediction = Omit<
  FuturePrediction,
  'id' | 'ownerId' | 'profileId' | 'createdAt'
>;

export interface AIProviderStatus {
  hfConfigured: boolean;
  hfEnvKey: string | null;
  geminiConfigured: boolean;
  defaultModel: AIModelId;
  supportedModels: {
    id: AIModelId;
    label: string;
    family: 'Qwen3 (Hugging Face)' | 'Gemini';
    available: boolean;
    note: string;
  }[];
}
