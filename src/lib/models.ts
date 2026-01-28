import { PersonalityMode, Message, UserPreferences } from '@/types';

export interface Model {
  id: string;
  name: string;
  role: 'primary' | 'fallback';
  description: string;
  isFree: boolean;
}

// In-memory Quota Guard state (clears on server restart)
interface BlockedModel {
  id: string;
  blockedAt: number;
  reason: string;
  expiresAt: number;
}

const blockedModels = new Map<string, BlockedModel>();
const BLOCK_DURATION_MS = 10000; // 10 seconds

// Base metadata for known models (Updated with valid OpenRouter :free IDs)
const MODEL_METADATA: Record<string, Partial<Model>> = {
  'z-ai/glm-4.5-air:free': { name: 'GLM 4.5 Air', description: 'Primary - High Speed & Agentic' },
  'google/gemini-2.0-flash-exp:free': { name: 'Gemini 2.0 Flash', description: 'Fallback 1 - Fast & Reliable.' },
  'meta-llama/llama-3.3-70b-instruct:free': { name: 'Llama 3.3 70B', description: 'Fallback 2 - Smartest.' },
  'deepseek/deepseek-r1-0528:free': { name: 'DeepSeek R1', description: 'Fallback 3 - Technical Reasoning.' },
  'nousresearch/hermes-3-llama-3.1-405b:free': { name: 'Hermes 3 405B', description: 'High-power fallback.' },
  'mistralai/mistral-small-3.1-24b-instruct:free': { name: 'Mistral Small', description: 'Stable generalist.' },
  'upstage/solar-pro-3:free': { name: 'Solar Pro', description: 'Alternative reasoning model.' },
  'qwen/qwen3-next-80b-a3b-instruct:free': { name: 'Qwen 3 Next', description: 'Experimental high-capacity.' },
};

/**
 * Get the prioritized list of models to try
 */
export function getModelPool(): Model[] {
  const rawList = (process.env.OPENROUTER_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);

  // Valid list of currently available FREE endpoints
  const modelIds = rawList.length > 0 ? rawList : [
    'z-ai/glm-4.5-air:free',
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1-0528:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'upstage/solar-pro-3:free',
    'qwen/qwen3-next-80b-a3b-instruct:free'
  ];

  const now = Date.now();

  return modelIds
    .filter(id => {
      const block = blockedModels.get(id);
      if (block) {
        if (now < block.expiresAt) return false;
        blockedModels.delete(id);
      }
      return true;
    })
    .map((id, index) => {
      const meta = MODEL_METADATA[id] || {};
      return {
        id,
        name: meta.name || id.split('/').pop() || id,
        role: index === 0 ? 'primary' : 'fallback',
        description: meta.description || 'Free AI Model',
        isFree: true
      };
    });
}

/**
 * Report a model failure to the Quota Guard
 */
export function reportModelFailure(id: string, isQuotaError: boolean): void {
  if (isQuotaError) {
    blockedModels.set(id, {
      id,
      blockedAt: Date.now(),
      reason: 'Quota/Spend Limit Exceeded',
      expiresAt: Date.now() + BLOCK_DURATION_MS
    });
    console.warn(`🚫 QUOTA GUARD: Blocked ${id} for 10s.`);
  }
}

export const DEFAULT_MODEL_ID = getModelPool()[0]?.id || 'z-ai/glm-4.5-air:free';
export const FALLBACK_MODEL_IDS = getModelPool().slice(1).map(m => m.id);

export function getModelById(id: string): Model | undefined {
  return getModelPool().find(m => m.id === id);
}

export function getPrimaryModel(): Model {
  return getModelPool()[0] || {
    id: DEFAULT_MODEL_ID,
    name: 'GLM 4.5 Air',
    role: 'primary',
    description: 'Primary AI model',
    isFree: true
  };
}

export function getFallbackModels(): Model[] {
  return getModelPool().slice(1);
}
