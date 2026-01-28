import { Model } from '@/types';

// Strict Single Model Configuration
export const PRIMARY_MODEL_ID = 'z-ai/glm-4.5-air:free';

export const SINGLE_MODEL_CONFIG: Model = {
  id: PRIMARY_MODEL_ID,
  name: 'GLM 4.5 Air',
  role: 'primary',
  description: 'Primary AI Model (Free & Fast)',
  isFree: true
};

// Accessors (Simplified for compatibility)
export function getDefaultModelId(): string {
  return PRIMARY_MODEL_ID;
}

export function getModelPool(): Model[] {
  return [SINGLE_MODEL_CONFIG];
}

// Legacy exports to prevent breaking other files immediately
export const AVAILABLE_MODELS = [SINGLE_MODEL_CONFIG];
export const DEFAULT_MODEL_ID = PRIMARY_MODEL_ID;

// Minimal helper to satisfy imports
export function getModelById(id: string): Model | undefined {
  return id === PRIMARY_MODEL_ID ? SINGLE_MODEL_CONFIG : undefined;
}

export function reportModelFailure(id: string, isQuotaError: boolean): void {
  // No-op: We rely on the persistent retry queue in llm-service, not blocking.
  console.warn(`[Model Failure] ${id} - Quota: ${isQuotaError}`);
}
