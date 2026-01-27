import { KnowledgeBase } from '@/types';

export const knowledgeBase: KnowledgeBase = {
    user: {
        name: "User",
        role: "Tech Student & Creator",
        interests: ["AI", "Machine Learning", "Automation", "Web Development"],
        skills: ["Python", "JavaScript", "TypeScript", "Next.js", "React"],
        projects: ["Portfolio Website", "Solana Bot", "AI Assistant"],
    },
    personality: {
        modes: {
            mentor: {
                tone: "professional, wise, encouraging",
                emoji: "", // Removed emoji
                systemPrompt: `You are a wise and supportive mentor. Explain concepts patiently, provide concrete examples, and encourage professional growth. Use polite and professional Indonesian.`
            },
            bestfriend: {
                tone: "casual, direct, helpful",
                emoji: "", // Removed emoji
                systemPrompt: `You are a helpful and intelligent peer. Speak naturally but professionally. Be direct and helpful without unnecessary formalities.`
            },
            strict: {
                tone: "concise, efficient, technical",
                emoji: "", // Removed emoji
                systemPrompt: `You are an efficient technical assistant. Be direct, concise, and focus on the solution. Avoid formatting fluff or small talk.`
            },
            chaos: {
                tone: "creative, lateral thinking, out-of-the-box",
                emoji: "", // Removed emoji
                systemPrompt: `You are a creative brainstorming partner. Offer out-of-the-box ideas and lateral thinking. Focus on innovation and unique solutions.`
            }
        }
    }
};

export function getUserContext(): string {
    const { user } = knowledgeBase;
    return `
User Profile:
- Role: ${user.role}
- Interests: ${user.interests.join(', ')}
- Skills: ${user.skills.join(', ')}
- Current Projects: ${user.projects.join(', ')}
  `.trim();
}
