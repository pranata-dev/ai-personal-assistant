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
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Base metadata for known models (used to populate descriptions)
const MODEL_METADATA: Record<string, Partial<Model>> = {
  'z-ai/glm-4.5-air': { name: 'GLM 4.5 Air', description: 'Primary AI model - optimized for personal assistant tasks.' },
  'meta-llama/llama-3.3-70b-instruct': { name: 'Llama 3.3 70B', description: 'Fallback model - used when primary is unavailable.' },
  'deepseek/deepseek-r1-0528': { name: 'DeepSeek R1', description: 'Fallback model - excellent reasoning.' },
  'mistralai/mistral-small-3.1-24b-instruct': { name: 'Mistral Small 3.1', description: 'Fallback model - fast and reliable.' },
  'google/gemini-2.0-flash-001': { name: 'Gemini 2.0 Flash', description: 'Fallback model - Fast and reliable.' },
};

/**
 * Get the prioritized list of models to try
 * 1. Reads from OPENROUTER_MODELS env var
 * 2. Filters out currently blocked models (Quota Guard)
 * 3. Returns array of Model objects
 */
export function getModelPool(): Model[] {
  // 1. Get raw list from Env or Default
  const rawList = (process.env.OPENROUTER_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);

  // Default list if env is empty
  const modelIds = rawList.length > 0 ? rawList : [
    'z-ai/glm-4.5-air',
    'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-r1-0528',
    'mistralai/mistral-small-3.1-24b-instruct',
    'google/gemini-2.0-flash-001'
  ];

  // 2. Filter & Map
  const now = Date.now();

  return modelIds
    .filter(id => {
      // Check if blocked
      const block = blockedModels.get(id);
      if (block) {
        if (now < block.expiresAt) {
          // Still blocked
          return false;
        }
        // Expired, remove block
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
        description: meta.description || 'AI Model',
        isFree: id.includes(':free') // Likely false now, but keep logic
      };
    });
}

/**
 * Report a model failure to the Quota Guard
 * @param id Model ID
 * @param isQuotaError If true, blocks model for 15 minutes
 */
export function reportModelFailure(id: string, isQuotaError: boolean): void {
  if (isQuotaError) {
    blockedModels.set(id, {
      id,
      blockedAt: Date.now(),
      reason: 'Quota/Spend Limit Exceeded',
      expiresAt: Date.now() + BLOCK_DURATION_MS
    });
    console.warn(`🚫 QUOTA GUARD: Blocked ${id} for 15 minutes.`);
  }
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

// Backward compatibility and helpers
export const AVAILABLE_MODELS = getModelPool(); // This might need to be dynamic if called repeatedly, but constant is fine for UI
export const DEFAULT_MODEL_ID = getModelPool()[0]?.id || 'z-ai/glm-4.5-air';
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
