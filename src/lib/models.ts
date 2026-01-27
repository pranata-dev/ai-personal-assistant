import { PersonalityMode, Message, UserPreferences } from '@/types';

export interface Model {
  id: string;
  name: string;
  role: 'general' | 'coding' | 'vision' | 'fast';
  description: string;
  isFree: boolean;
}

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    role: 'general',
    description: 'Best balanced model for instruction following and reasoning.',
    isFree: true,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    role: 'vision',
    description: 'Multimodal model capable of processing text and images.',
    isFree: true,
  },
  {
    id: 'qwen/qwen-2.5-7b-instruct:free',
    name: 'Qwen 2.5 7B',
    role: 'coding',
    description: 'Specialized for code generation and mathematical logic.',
    isFree: true,
  },
  {
    id: 'mistralai/mistral-small-24b-instruct-2501:free',
    name: 'Mistral Small',
    role: 'fast',
    description: 'Lightweight and fast, good for quick chats.',
    isFree: true,
  },
];

export const DEFAULT_MODEL_ID = 'meta-llama/llama-3.3-70b-instruct:free';

export function getModelById(id: string): Model | undefined {
  return AVAILABLE_MODELS.find(m => m.id === id);
}
