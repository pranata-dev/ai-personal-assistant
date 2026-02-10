// AI Model Configuration for Multi-Model Support

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export const MODELS: AIModel[] = [
  {
    id: "tngtech/deepseek-r1t2-chimera:free",
    name: "Logic",
    description: "Best for reasoning, RAG, and complex analysis.",
  },
  {
    id: "qwen/qwen3-coder:free",
    name: "Dev",
    description: "Specialized for Python, React, and general coding tasks.",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Fast",
    description: "Fast fallback for quick responses.",
  },
];

export const DEFAULT_MODEL_ID = "tngtech/deepseek-r1t2-chimera:free";
