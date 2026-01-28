import { PersonalityMode, Message, UserPreferences } from '@/types';

export interface Model {
  id: string;
  name: string;
  role: 'primary' | 'fallback';
  description: string;
  isFree: boolean;
}

// GLM-4.5 Air is the PRIMARY model
// Other models are FALLBACK only (used when primary is unavailable)
export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air',
    role: 'primary',
    description: 'Primary AI model - optimized for personal assistant tasks.',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    role: 'fallback',
    description: 'Fallback model - used when primary is unavailable.',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    role: 'fallback',
    description: 'Fallback model - lightweight and fast.',
    isFree: true,
  },
  {
    id: 'google/gemma-3-4b-it:free',
    name: 'Gemma 3 4B',
    role: 'fallback',
    description: 'Fallback model - Google compact model.',
    isFree: true,
  },
];

// PRIMARY MODEL - GLM-4.5 Air
export const DEFAULT_MODEL_ID = 'z-ai/glm-4.5-air:free';

// Fallback order when primary fails
export const FALLBACK_MODEL_IDS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'google/gemma-3-4b-it:free',
];

export function getModelById(id: string): Model | undefined {
  return AVAILABLE_MODELS.find(m => m.id === id);
}

export function getPrimaryModel(): Model {
  return AVAILABLE_MODELS.find(m => m.role === 'primary')!;
}

export function getFallbackModels(): Model[] {
  return AVAILABLE_MODELS.filter(m => m.role === 'fallback');
}
