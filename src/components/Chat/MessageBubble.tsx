'use client';

import { Message, PersonalityMode } from '@/types';
import { getModeEmoji } from '@/lib/ai-engine';

interface MessageBubbleProps {
    message: Message;
    mode: PersonalityMode;
}

export default function MessageBubble({ message, mode }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const emoji = getModeEmoji(mode);

    const formatContent = (content: string) => {
        // Simple markdown-like formatting
        return content
            .split('\n')
            .map((line, i) => {
                // Bold text
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Inline code
                line = line.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm">$1</code>');
                // Bullet points
                if (line.startsWith('- ')) {
                    line = `<span class="flex gap-2"><span>•</span><span>${line.slice(2)}</span></span>`;
                }
                return line;
            })
            .join('<br/>');
    };

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
            {/* Avatar */}
            <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
        ${isUser
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : `bg-gradient-to-br ${getModeGradient(mode)}`
                }
      `}>
                {isUser ? '👤' : emoji}
            </div>

            {/* Message bubble */}
            <div className={`
        max-w-[80%] rounded-2xl px-4 py-3
        ${isUser
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                    : 'bg-white/10 backdrop-blur-sm border border-white/10 text-gray-100'
                }
      `}>
                <div
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                />
                <div className={`text-xs mt-2 ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
                    {formatTime(message.timestamp)}
                </div>
            </div>
        </div>
    );
}

function getModeGradient(mode: PersonalityMode): string {
    const gradients: Record<PersonalityMode, string> = {
        mentor: 'from-purple-500 to-indigo-600',
        bestfriend: 'from-cyan-500 to-teal-600',
        strict: 'from-orange-500 to-red-600',
        chaos: 'from-pink-500 via-purple-500 to-cyan-500'
    };
    return gradients[mode];
}

function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
