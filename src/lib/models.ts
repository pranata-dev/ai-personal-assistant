import { PersonalityMode, Message, UserPreferences } from '@/types';

export interface Model {
  id: string;
  name: string;
  role: 'general' | 'coding' | 'vision' | 'fast';
  description: string;
  isFree: boolean;
}

// Updated with verified free models from OpenRouter (as of 2024-2025)
export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    role: 'general',
    description: 'Best balanced model for instruction following and reasoning.',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1',
    role: 'general',
    description: 'Advanced reasoning model with chain-of-thought capabilities.',
    isFree: true,
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    role: 'general',
    description: 'Google open model, great for general conversation.',
    isFree: true,
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 3.1',
    role: 'fast',
    description: 'Fast and efficient, good for quick responses.',
    isFree: true,
  },
  {
    id: 'qwen/qwen3-4b:free',
    name: 'Qwen3 4B',
    role: 'fast',
    description: 'Lightweight model, very fast for simple tasks.',
    isFree: true,
  },
];

export const DEFAULT_MODEL_ID = 'meta-llama/llama-3.3-70b-instruct:free';

export function getModelById(id: string): Model | undefined {
  return AVAILABLE_MODELS.find(m => m.id === id);
}
