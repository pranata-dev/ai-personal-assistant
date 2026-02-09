import { PersonalityMode, Message, Memory, UserPreferences } from '@/types';
import { DEFAULT_MODEL_ID } from '@/lib/models';

// Stateless Memory Logic - Resets on refresh
// We implement the Memory interface but don't persist it

const DEFAULT_PREFERENCES: UserPreferences = {
    language: 'en',
    explanationStyle: 'simple',
    currentMode: 'bestfriend',
    currentModelId: DEFAULT_MODEL_ID, // Initialize with default model
};

const DEFAULT_MEMORY: Memory = {
    conversations: [],
    preferences: DEFAULT_PREFERENCES,
    lastUpdated: Date.now()
};

// Return a fresh memory object
export function loadMemory(): Memory {
    return {
        ...DEFAULT_MEMORY,
        lastUpdated: Date.now()
    };
}

// No-op for save (stateless)
export function saveMemory(memory: Memory): void {
    // Intentionally empty - no persistence
}

export function addMessage(memory: Memory, message: Message): Memory {
    return {
        ...memory,
        conversations: [...memory.conversations, message],
        lastUpdated: Date.now()
    };
}

export function setMode(memory: Memory, mode: PersonalityMode): Memory {
    return {
        ...memory,
        preferences: {
            ...memory.preferences,
            currentMode: mode
        },
        lastUpdated: Date.now()
    };
}

export function setModel(memory: Memory, modelId: string): Memory {
    return {
        ...memory,
        preferences: {
            ...memory.preferences,
            currentModelId: modelId
        },
        lastUpdated: Date.now()
    };
}

export function resetMemory(): Memory {
    return {
        ...DEFAULT_MEMORY,
        lastUpdated: Date.now()
    };
}

export function getRecentContext(memory: Memory, limit: number = 10): Message[] {
    return memory.conversations.slice(-limit);
}
