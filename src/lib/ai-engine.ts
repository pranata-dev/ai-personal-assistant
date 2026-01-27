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
    if (lowerInput.includes('mode mentor') || lowerInput.includes('mentor mode')) {
        return { type: 'mode_switch', mode: 'mentor' };
    }
    if (lowerInput.includes('mode santai') || lowerInput.includes('mode bestfriend') || lowerInput.includes('santai mode')) {
        return { type: 'mode_switch', mode: 'bestfriend' };
    }
    if (lowerInput.includes('mode strict') || lowerInput.includes('strict mode') || lowerInput.includes('mode serius')) {
        return { type: 'mode_switch', mode: 'strict' };
    }
    if (lowerInput.includes('chaos mode') || lowerInput.includes('mode chaos')) {
        return { type: 'mode_switch', mode: 'chaos' };
    }

    // Memory reset
    if (lowerInput.includes('reset memory') || lowerInput.includes('hapus memory') || lowerInput.includes('clear memory')) {
        return { type: 'reset_memory' };
    }

    // Help
    if (lowerInput === 'help' || lowerInput === 'bantuan' || lowerInput === '/help') {
        return { type: 'help' };
    }

    // Prompt engineering
    if (
        lowerInput.includes('bikinin prompt') ||
        lowerInput.includes('buatin prompt') ||
        lowerInput.includes('improve prompt') ||
        lowerInput.includes('perbaiki prompt') ||
        lowerInput.includes('convert ide jadi prompt') ||
        lowerInput.includes('buat prompt untuk')
    ) {
        return { type: 'prompt_engineer', data: input };
    }

    // Thought dump (long unstructured text)
    if (input.length > 300 && !input.includes('?') && input.split('\n').length <= 3) {
        return { type: 'thought_dump', data: input };
    }

    return { type: 'general' };
}

export function getModeEmoji(mode: PersonalityMode): string {
    return knowledgeBase.personality.modes[mode].emoji;
}

export function getSystemPrompt(mode: PersonalityMode): string {
    const modeConfig = knowledgeBase.personality.modes[mode];
    const userContext = getUserContext();

    return `${modeConfig.systemPrompt}

${userContext}

ATURAN PENTING:
- Jangan pernah bilang "sebagai AI" atau "sebagai language model"
- Jangan terdengar seperti customer service
- Kalau tidak yakin, tanya SATU klarifikasi singkat
- Prefer contoh praktis daripada teori
- Jawaban singkat tapi thoughtful
- Referensikan info user secara natural kalau relevan`;
}

export function formatConversationHistory(messages: Message[]): string {
    if (messages.length === 0) return '';

    return messages
        .slice(-10)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
}

export function getHelpMessage(mode: PersonalityMode): string {
    const emoji = getModeEmoji(mode);

    return `${emoji} **Halo! Ini yang bisa aku bantu:**

**🔄 Ganti Mode:**
- \`mode mentor\` - Jadi mentor yang bijak
- \`mode santai\` - Jadi bestfriend yang asik
- \`mode strict\` - Langsung to the point
- \`chaos mode on\` - Mode chaotic tapi helpful 🔥

**✨ Prompt Engineering:**
- \`bikinin prompt untuk...\`
- \`improve prompt ini: [prompt]\`
- \`convert ide jadi prompt: [ide]\`

**📝 Smart Notes:**
- Paste teks panjang → aku summarize & extract key ideas

**🧠 Memory:**
- \`reset memory\` - Hapus semua conversation history

**💡 Tips:**
- Tanya apa aja, aku ngerti konteks kamu
- Mau penjelasan simple/teknis/analogi? Just ask!

Ada yang mau ditanya? 😊`;
}

export function getPromptEngineerResponse(input: string): string {
    // Check if it's an improvement request
    if (input.toLowerCase().includes('improve') || input.toLowerCase().includes('perbaiki')) {
        return `🔧 **Oke, aku bantu improve prompt-nya!**

Bisa kasih prompt yang mau diperbaiki? Paste aja di chat berikutnya, nanti aku:
1. Analisis struktur & kejelasan
2. Tambah context yang kurang
3. Bikin versi yang lebih powerful

Ready when you are! ✨`;
    }

    // Check if there's enough context
    const hasContext = input.length > 50;

    if (!hasContext) {
        return `✨ **Siap bikin prompt!**

Biar hasilnya maksimal, kasih tau:
- Prompt ini untuk apa? (generate code, brainstorm, analisis, dll)
- Output yang diharapkan seperti apa?

Contoh: "bikinin prompt untuk generate landing page dengan Next.js, tema futuristic"`;
    }

    return `🎯 **Got it! Lagi proses bikin prompt-nya...**

Bentar ya, aku structured-in dulu request-mu jadi prompt yang clean dan siap pakai.`;
}

export function getThoughtDumpResponse(): string {
    return `📝 **Nice brain dump!** Aku bantu organize ya:

Bentar, lagi proses:
- 📋 Summarize key points
- 💡 Extract actionable ideas  
- 🏷️ Suggest tags/categories

Loading... ✨`;
}

export function getModeChangeMessage(newMode: PersonalityMode): string {
    const emoji = getModeEmoji(newMode);
    const messages: Record<PersonalityMode, string> = {
        mentor: `${emoji} **Mode Mentor aktif!**\n\nSekarang aku jadi mentor yang bijak dan suportif. Siap bantu kamu belajar dan berkembang! Ada yang mau dibahas?`,
        bestfriend: `${emoji} **Mode Santai aktif!**\n\nYo! Sekarang kita ngobrol santai aja. Mau curhat, diskusi, atau butuh bantuan? Gas aja!`,
        strict: `${emoji} **Mode Strict aktif.**\n\nTo the point. Efisien. Tidak basa-basi. Apa yang perlu dikerjakan?`,
        chaos: `${emoji} **CHAOS MODE ACTIVATED!!!** 🌈✨🔥\n\nBRO MARI KITA GOOO! Aku siap bantu dengan energy level 9000! Tapi tetap helpful kok, tenang aja HAHA. What's up?!`
    };

    return messages[newMode];
}

export function getResetMemoryMessage(): string {
    return `🧹 **Memory cleared!**

Semua conversation history udah dihapus. Fresh start! 

Hai, salam kenal (lagi)! Ada yang bisa aku bantu? 😊`;
}
