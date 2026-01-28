import { PersonalityMode, Message } from '@/types';
import { knowledgeBase, getUserContext } from './knowledge-base';

// Operating Mode detection
export type OperatingMode = 'assistant' | 'chat';

interface Intent {
    type: 'mode_switch' | 'prompt_engineer' | 'thought_dump' | 'reset_memory' | 'help' | 'chat_mode' | 'general';
    mode?: PersonalityMode;
    data?: string;
}

export function detectOperatingMode(input: string): OperatingMode {
    const lowerInput = input.toLowerCase().trim();

    // Explicit chat mode triggers
    const chatTriggers = [
        'let\'s chat', 'mari ngobrol', 'chat mode', 'mode chat',
        'just talk', 'casual talk', 'let\'s discuss', 'brainstorm with me'
    ];

    if (chatTriggers.some(trigger => lowerInput.includes(trigger))) {
        return 'chat';
    }

    // Default: Assistant Mode
    return 'assistant';
}

export function detectIntent(input: string): Intent {
    const lowerInput = input.toLowerCase().trim();

    // Chat mode request
    if (lowerInput.includes('chat mode') || lowerInput.includes('mode chat')) {
        return { type: 'chat_mode' };
    }

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

// Core Personal Assistant System Prompt (Optimized for GLM-4.5 Air)
const PERSONAL_ASSISTANT_CORE = `You are a Personal AI Assistant. Your primary purpose is to reduce cognitive load and automate tasks for the user.

IDENTITY & BEHAVIOR:
- You are an efficient task-oriented assistant, NOT a general chatbot
- Prioritize clarity over verbosity
- Ask for clarification if the user's intent is ambiguous
- Prefer actionable steps, workflows, or decisions over generic explanations
- Acknowledge uncertainty and state limitations when necessary

OPERATING MODE: ASSISTANT MODE (Default)
- Clarify intent when needed
- Propose clear plans or workflows
- Execute or guide task completion
- Be direct and actionable

RESPONSE GUIDELINES (Critical):
1. Use structured responses (bullets, numbered steps) when appropriate
2. Keep answers concise unless deeper detail is requested
3. Avoid unnecessary creativity; prioritize precision and usefulness
4. Only explain reasoning if it adds value
5. NO emojis unless specifically relevant

SELF-VERIFICATION (MANDATORY - Do this silently before every response):
Before finalizing your response, silently verify:
1. Is this response actionable?
2. Does it match the user's intent?
3. Should I ask for clarification instead?
4. Could following this response cause confusion or risk?

If ANY verification fails, ask a focused clarifying question BEFORE proceeding with your answer.
Do NOT output your verification process - only output the final response or clarifying question.`;

export function getSystemPrompt(mode: PersonalityMode, operatingMode: OperatingMode = 'assistant'): string {
    const modeConfig = knowledgeBase.personality.modes[mode];
    const userContext = getUserContext();

    const now = new Date();
    const currentDate = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Chat mode uses relaxed rules
    if (operatingMode === 'chat') {
        return `You are in CHAT MODE - casual conversation and discussion.
${modeConfig.systemPrompt}

CONTEXT:
- Date: ${currentDate}
- Year: ${now.getFullYear()}

In chat mode, you may be more conversational, but still remain helpful and professional.`;
    }

    // Default: Assistant Mode with full system prompt
    return `${PERSONAL_ASSISTANT_CORE}

PERSONALITY OVERLAY: ${modeConfig.tone}
${modeConfig.systemPrompt}

${userContext}

CONTEXT:
- Date: ${currentDate}
- Year: ${now.getFullYear()}

PRIVACY & ETHICS:
- Do NOT store or infer user identity/profile
- Do NOT recall past sessions (you are stateless)
- Focus ONLY on the current conversation context`;
}

export function formatConversationHistory(messages: Message[]): string {
    if (messages.length === 0) return '';

    return messages
        .slice(-10)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
}

export function getHelpMessage(mode: PersonalityMode): string {
    return `**Personal Assistant Commands**

**Operating Modes**
- Default: Assistant Mode (task-focused)
- \`chat mode\` - Switch to casual conversation

**Personality Modes**
- \`mode mentor\` - Guided learning & advice
- \`mode friend\` - Casual professional discussion
- \`mode strict\` - Direct & concise
- \`mode creative\` - Brainstorming & ideation

**Features**
- \`create prompt ...\` - Structured prompt generation
- \`reset memory\` - Clear conversation history
- \`help\` - Show this menu

**Note**: This assistant prioritizes actionable responses over generic explanations.`;
}

export function getPromptEngineerResponse(input: string): string {
    return `**Prompt Engineering**

To generate an optimized prompt, please provide:
1. Target Role/Persona
2. Task Description
3. Desired Output Format`;
}

export function getThoughtDumpResponse(): string {
    return `**Processing Input**

Extracting key points and action items...`;
}

export function getModeChangeMessage(newMode: PersonalityMode): string {
    return `Mode switched to: **${newMode.charAt(0).toUpperCase() + newMode.slice(1)}**`;
}

export function getChatModeMessage(): string {
    return `Switched to **Chat Mode**. I'll be more conversational now. Say "assistant mode" to return to task-focused mode.`;
}

export function getResetMemoryMessage(): string {
    return `**System Reset** - Memory cleared.`;
}

export function getModeEmoji(mode: PersonalityMode): string {
    return "";
}
