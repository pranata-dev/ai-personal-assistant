import { PersonalityMode, Message, UserPreferences } from '@/types';

export interface Model {
  id: string;
  name: string;
  role: 'general' | 'coding' | 'vision' | 'fast';
  description: string;
  isFree: boolean;
}

// Stable free models from OpenRouter with verified IDs
// Using only models that are known to be reliable
export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    role: 'general',
    description: 'Best balanced model for instruction following and reasoning.',
    isFree: true,
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air',
    role: 'general',
    description: 'Z.AI latest model, excellent for general tasks.',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    role: 'fast',
    description: 'Fast and lightweight model for quick responses.',
    isFree: true,
  },
  {
    id: 'google/gemma-3-4b-it:free',
    name: 'Gemma 3 4B',
    role: 'fast',
    description: 'Google compact model, efficient for general tasks.',
    isFree: true,
  },
  {
    id: 'qwen/qwen3-4b:free',
    name: 'Qwen3 4B',
    role: 'fast',
    description: 'Lightweight Alibaba model, good for simple tasks.',
    isFree: true,
  },
];

export const DEFAULT_MODEL_ID = 'meta-llama/llama-3.3-70b-instruct:free';

export function getModelById(id: string): Model | undefined {
  return AVAILABLE_MODELS.find(m => m.id === id);
}
