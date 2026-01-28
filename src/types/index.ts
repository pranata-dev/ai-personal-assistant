export type PersonalityMode = 'mentor' | 'bestfriend' | 'strict' | 'chaos';
export type ExplanationStyle = 'simple' | 'technical' | 'analogy';

export interface Model {
  id: string;
  name: string;
  role: 'primary' | 'fallback';
  description: string;
  isFree: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: PersonalityMode;
}

export interface UserPreferences {
  language: 'id' | 'en';
  explanationStyle: ExplanationStyle;
  currentMode: PersonalityMode;
  currentModelId: string; // New field for model selection
}

export interface Memory {
  conversations: Message[];
  preferences: UserPreferences;
  lastUpdated: number;
}

export interface KnowledgeBase {
  user: {
    name: string;
    role: string;
    interests: string[];
    skills: string[];
    projects: string[];
  };
  personality: {
    modes: Record<PersonalityMode, {
      tone: string;
      emoji: string;
      systemPrompt: string;
    }>;
  };
}
