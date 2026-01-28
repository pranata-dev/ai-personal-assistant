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
const BLOCK_DURATION_MS = 10000; // 10 seconds (Reduced for transient free tier errors)

// Base metadata for known models (used to populate descriptions)
const MODEL_METADATA: Record<string, Partial<Model>> = {
  'z-ai/glm-4.5-air:free': { name: 'GLM 4.5 Air', description: 'Primary - High Speed & Agentic' },
  'google/gemini-2.0-flash-lite-preview-02-05:free': { name: 'Gemini 2.0 Flash Lite', description: 'Fallback 1 - Fastest.' },
  'meta-llama/llama-3.3-70b-instruct:free': { name: 'Llama 3.3 70B', description: 'Fallback 2 - Smartest.' },
  'google/gemini-2.0-pro-exp-02-05:free': { name: 'Gemini 2.0 Pro', description: 'Fallback model - High Quality Reasoning.' },
  'deepseek/deepseek-r1-distill-llama-70b:free': { name: 'DeepSeek R1', description: 'Fallback model - Reasoning.' },
  'qwen/qwen-2.5-72b-instruct:free': { name: 'Qwen 2.5 72B', description: 'Fallback model - Alternative.' },
  'liquid/lfm-40b:free': { name: 'Liquid LFM 40B', description: 'Fallback model - Generalist.' },
  'sophosympatheia/midnight-rose-70b:free': { name: 'Midnight Rose 70B', description: 'Fallback model - Creative.' },
  'microsoft/phi-3-medium-128k-instruct:free': { name: 'Phi-3 Medium', description: 'Fallback model - High Availability.' },
  'meta-llama/llama-3.2-11b-vision-instruct:free': { name: 'Llama 3.2 11B', description: 'Fallback model - Lightweight.' },
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

  // Default list if env is empty (Prioritize FREE models)
  const modelIds = rawList.length > 0 ? rawList : [
    'z-ai/glm-4.5-air:free',
    'google/gemini-2.0-flash-lite-preview-02-05:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-pro-exp-02-05:free',
    'deepseek/deepseek-r1-distill-llama-70b:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'liquid/lfm-40b:free',
    'sophosympatheia/midnight-rose-70b:free',
    'microsoft/phi-3-medium-128k-instruct:free',
    'meta-llama/llama-3.2-11b-vision-instruct:free'
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
        description: meta.description || 'Free AI Model',
        isFree: true
      };
    });
}

/**
 * Report a model failure to the Quota Guard
 * @param id Model ID
 * @param isQuotaError If true, blocks model for BLOCK_DURATION_MS
 */
export function reportModelFailure(id: string, isQuotaError: boolean): void {
  if (isQuotaError) {
    blockedModels.set(id, {
      id,
      blockedAt: Date.now(),
      reason: 'Quota/Spend Limit Exceeded',
      expiresAt: Date.now() + BLOCK_DURATION_MS
    });
    console.warn(`🚫 QUOTA GUARD: Blocked ${id} for ${(BLOCK_DURATION_MS / 1000).toFixed(0)}s.`);
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
export const AVAILABLE_MODELS = getModelPool();
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
