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
  id: string | number; // Compatible with Backend (int) and Frontend (string)
  role: 'user' | 'assistant';
  content: string;
  timestamp: number | string;
  mode?: PersonalityMode;
}

export interface UserPreferences {
  language: 'id' | 'en';
  explanationStyle: ExplanationStyle;
  currentMode: PersonalityMode;
  currentModelId: string;
}

export interface Memory {
  conversations: Message[];
  preferences: UserPreferences;
  lastUpdated: number;
}
