import { PersonalityMode, Message } from '@/types';
import { knowledgeBase, getUserContext } from './knowledge-base';

interface Intent {
    type: 'mode_switch' | 'prompt_engineer' | 'thought_dump' | 'reset_memory' | 'help' | 'general';
    mode?: PersonalityMode;
    data?: string;
}

export function detectIntent(input: string): Intent {
    const lowerInput = input.toLowerCase().trim();

    // Mode switching
    if (lowerInput.includes('mode mentor') || lowerInput.includes('set mentor')) {
        return { type: 'mode_switch', mode: 'mentor' };
    }
    if (lowerInput.includes('mode friend') || lowerInput.includes('mode santai')) {
        return { type: 'mode_switch', mode: 'bestfriend' };
    }
    if (lowerInput.includes('mode strict') || lowerInput.includes('mode serius')) {
        return { type: 'mode_switch', mode: 'strict' };
    }
    if (lowerInput.includes('mode creative') || lowerInput.includes('mode chaos')) {
        return { type: 'mode_switch', mode: 'chaos' };
    }

    // Memory reset
    if (lowerInput.includes('reset memory') || lowerInput.includes('clear memory')) {
        return { type: 'reset_memory' };
    }

    // Help
    if (lowerInput === 'help' || lowerInput === '/help') {
        return { type: 'help' };
    }

    // Prompt engineering
    if (
        lowerInput.includes('create prompt') ||
        lowerInput.includes('improve prompt') ||
        lowerInput.includes('convert to prompt') ||
        lowerInput.includes('bikinin prompt')
    ) {
        return { type: 'prompt_engineer', data: input };
    }

    // Thought dump
    if (input.length > 300 && !input.includes('?') && input.split('\n').length <= 3) {
        return { type: 'thought_dump', data: input };
    }

    return { type: 'general' };
}

export function getSystemPrompt(mode: PersonalityMode): string {
    const modeConfig = knowledgeBase.personality.modes[mode];
    const userContext = getUserContext();

    const now = new Date();
    const currentDate = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `${modeConfig.systemPrompt}

${userContext}

CONTEXT:
- Date: ${currentDate}
- Year: ${now.getFullYear()}

PRIVACY & ETHICS:
- Do NOT store or infer user identity/profile
- Do NOT recall past sessions (you are stateless)
- Do NOT simulate having a memory of the user
- Focus ONLY on the current conversation context

RULES:
- Be concise and professional
- No emojis in responses unless necessary for context
- Use clean formatting (bullet points, code blocks)
- Answer directly`;
}

export function formatConversationHistory(messages: Message[]): string {
    if (messages.length === 0) return '';

    return messages
        .slice(-10)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
}

export function getHelpMessage(mode: PersonalityMode): string {
    return `**Available Commands**

**System Modes**
- \`mode mentor\` - Guided learning & advice
- \`mode friend\` - Casual professional discussion
- \`mode strict\` - Direct & concise
- \`mode creative\` - Brainstorming & ideation

**Features**
- \`create prompt ...\` - Structured prompt generation
- \`reset memory\` - Clear conversation history
- \`help\` - Show this menu

**Web Search**
Automatically searches for news, definitions, and data when asked.`;
}

export function getPromptEngineerResponse(input: string): string {
    return `**Prompt Engineering**

Processing your request. Please provide specifics on:
1. Target Role/Persona
2. Task Description
3. Desired Output Format`;
}

export function getThoughtDumpResponse(): string {
    return `**Analyzing Input**

Processing your text to extract key points and action items...`;
}

export function getModeChangeMessage(newMode: PersonalityMode): string {
    return `System mode switched to: **${newMode.charAt(0).toUpperCase() + newMode.slice(1)}**`;
}

export function getResetMemoryMessage(): string {
    return `**System Reset**\n\nMemory cleared. Context initialized.`;
}

// Keeping this for compatibility but it returns empty string now
export function getModeEmoji(mode: PersonalityMode): string {
    return "";
}
