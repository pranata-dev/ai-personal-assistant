import { Memory, Message, UserPreferences, PersonalityMode } from '@/types';

const MEMORY_KEY = 'ai-assistant-memory';
const MAX_CONVERSATIONS = 50;

export const defaultPreferences: UserPreferences = {
    language: 'id',
    explanationStyle: 'simple',
    currentMode: 'bestfriend'
};

export function loadMemory(): Memory {
    if (typeof window === 'undefined') {
        return {
            conversations: [],
            preferences: defaultPreferences,
            lastUpdated: Date.now()
        };
    }

    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load memory:', e);
    }

    return {
        conversations: [],
        preferences: defaultPreferences,
        lastUpdated: Date.now()
    };
}

export function saveMemory(memory: Memory): void {
    if (typeof window === 'undefined') return;

    try {
        // Keep only last N conversations
        const trimmedMemory = {
            ...memory,
            conversations: memory.conversations.slice(-MAX_CONVERSATIONS),
            lastUpdated: Date.now()
        };
        localStorage.setItem(MEMORY_KEY, JSON.stringify(trimmedMemory));
    } catch (e) {
        console.error('Failed to save memory:', e);
    }
}

export function addMessage(memory: Memory, message: Message): Memory {
    return {
        ...memory,
        conversations: [...memory.conversations, message],
        lastUpdated: Date.now()
    };
}

export function updatePreferences(memory: Memory, updates: Partial<UserPreferences>): Memory {
    return {
        ...memory,
        preferences: { ...memory.preferences, ...updates },
        lastUpdated: Date.now()
    };
}

export function setMode(memory: Memory, mode: PersonalityMode): Memory {
    return updatePreferences(memory, { currentMode: mode });
}

export function resetMemory(): Memory {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(MEMORY_KEY);
    }
    return {
        conversations: [],
        preferences: defaultPreferences,
        lastUpdated: Date.now()
    };
}

export function getRecentContext(memory: Memory, count: number = 10): Message[] {
    return memory.conversations.slice(-count);
}
