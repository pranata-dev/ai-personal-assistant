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
const BLOCK_DURATION_MS = 60000; // 1 minute block for rate limits

// Base metadata for known models (Updated with valid OpenRouter :free IDs)
const MODEL_METADATA: Record<string, Partial<Model>> = {
  'z-ai/glm-4.5-air:free': { name: 'GLM 4.5 Air', description: 'Primary - High Speed' },
  'google/gemini-2.0-flash-exp:free': { name: 'Gemini 2.0 Flash', description: 'Fast & Reliable.' },
  'google/gemini-2.0-pro-exp-02-05:free': { name: 'Gemini 2.0 Pro', description: 'High Intelligence.' },
  'meta-llama/llama-3.3-70b-instruct:free': { name: 'Llama 3.3 70B', description: 'Smartest Open Model.' },
  'deepseek/deepseek-r1:free': { name: 'DeepSeek R1', description: 'Reasoning Expert.' },
  'nousresearch/hermes-3-llama-3.1-405b:free': { name: 'Hermes 3 405B', description: 'High-power fallback.' },
  'mistralai/mistral-small-3.1-24b-instruct:free': { name: 'Mistral Small', description: 'Stable generalist.' },
  'qwen/qwen-2.5-coder-32b-instruct:free': { name: 'Qwen 2.5 Coder', description: 'Code specialist.' },
};

// Prioritized list of model IDs to try
// Prioritized list of model IDs to try
const DEFAULT_MODEL_LIST = [
  'z-ai/glm-4.5-air:free',                  // PRIMARY (User Requested)
];

/**
 * Get the prioritized list of models to try, filtering out blocked ones
 */
export function getModelPool(): Model[] {
  const envVar = process.env.OPENROUTER_MODELS;
  const rawList = (envVar || '').split(',').map(s => s.trim()).filter(Boolean);

  const modelIds = rawList.length > 0 ? rawList : DEFAULT_MODEL_LIST;

  const now = Date.now();

  return modelIds
    .filter(id => {
      const block = blockedModels.get(id);
      if (block) {
        if (now < block.expiresAt) return false; // Still blocked
        blockedModels.delete(id); // Expired
      }
      return true;
    })
    .map((id, index) => {
      const meta = MODEL_METADATA[id] || {};
      // Role is relative to the *filtered* list, which dictates fallback order
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
  // Use aggressive retry instead of blocking for the single primary model
  if (id === 'z-ai/glm-4.5-air:free') {
    console.warn(`⚠️ Rate Limit/Error on Primary Model ${id}. Relying on LLM Service retry logic.`);
    return;
  }

  // We block for any 429 (Rate Limit) or Quota error
  // Even for rate limits, temporary blocking allows rotation to other models
  const blockTime = isQuotaError ? 60000 : 30000; // 1 min for quota, 30s for general errors/rate limits

  blockedModels.set(id, {
    id,
    blockedAt: Date.now(),
    reason: isQuotaError ? 'Quota/Spend Limit' : 'Rate Limit/Error',
    expiresAt: Date.now() + blockTime
  });
  console.warn(`🚫 QUOTA GUARD: Blocked ${id} for ${blockTime / 1000}s.`);
}

/**
 * Check if a model is currently blocked
 */
export function isModelBlocked(id: string): boolean {
  const block = blockedModels.get(id);
  if (!block) return false;

  if (Date.now() > block.expiresAt) {
    blockedModels.delete(id);
    return false;
  }
  return true;
}

// Accessors
export function getDefaultModelId(): string {
  const pool = getModelPool();
  // Return first available, or the hardcoded default if all blocked (to force a try)
  return pool[0]?.id || DEFAULT_MODEL_LIST[0];
}

export function getFallbackModels(): Model[] {
  const pool = getModelPool();
  return pool.slice(1);
}

export function getModelById(id: string): Model | undefined {
  // Check both current pool and metadata to find it even if blocked
  const valid = getModelPool().find(m => m.id === id);
  if (valid) return valid;

  // Fallback to metadata reconstruction if blocked/hidden
  const meta = MODEL_METADATA[id];
  if (meta) {
    return {
      id,
      name: meta.name || id,
      role: 'fallback', // assumption
      description: meta.description || '',
      isFree: true
    };
  }
  return undefined;
}

export function getPrimaryModel(): Model {
  const pool = getModelPool();
  return pool[0] || {
    id: DEFAULT_MODEL_LIST[0],
    name: MODEL_METADATA[DEFAULT_MODEL_LIST[0]]?.name || 'Primary',
    role: 'primary',
    description: 'Primary AI Model',
    isFree: true
  };
}

// Legacy exports for compatibility (Deprecate usage over time)
export const AVAILABLE_MODELS = getModelPool(); // Warning: Static snapshot
export const DEFAULT_MODEL_ID = DEFAULT_MODEL_LIST[0]; // Constant for reference
export const FALLBACK_MODEL_IDS = DEFAULT_MODEL_LIST.slice(1); // Constant for reference
