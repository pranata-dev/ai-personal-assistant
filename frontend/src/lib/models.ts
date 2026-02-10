// AI Model Configuration for Multi-Model Support

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export const MODELS: AIModel[] = [
  {
    id: "tngtech/deepseek-r1t2-chimera:free",
    name: "DeepSeek R1 Chimera (Logic)",
    description: "Best for reasoning, RAG, and complex analysis.",
  },
  {
    id: "qwen/qwen3-coder:free",
    name: "Qwen 3 Coder (Dev)",
    description: "Specialized for Python, React, and general coding tasks.",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash (Fast)",
    description: "Fast fallback for quick responses.",
  },
];

export const DEFAULT_MODEL_ID = "tngtech/deepseek-r1t2-chimera:free";
