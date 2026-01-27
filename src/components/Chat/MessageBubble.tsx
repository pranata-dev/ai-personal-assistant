'use client';

import { Message, PersonalityMode } from '@/types';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
    mode: PersonalityMode;
}

export default function MessageBubble({ message, mode }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    const formatContent = (content: string) => {
        return content
            .split('\n')
            .map((line, i) => {
                // Bold text
                line = line.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-white">$1</span>');
                // Inline code
                line = line.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-sm text-zinc-300 border border-zinc-700">$1</code>');
                // Bullet points
                if (line.startsWith('- ')) {
                    line = `<span class="flex gap-2"><span>•</span><span>${line.slice(2)}</span></span>`;
                }
                return line;
            })
            .join('<br/>');
    };

    return (
        <div className={`flex gap-4 max-w-3xl mx-auto w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
            {/* Bot Icon */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mt-1">
                    <Bot size={16} />
                </div>
            )}

            {/* Message Content */}
            <div className={`
        max-w-[85%] rounded-lg px-4 py-3
        ${isUser
                    ? 'bg-zinc-100/10 text-zinc-100 border border-zinc-800'
                    : 'bg-transparent text-zinc-300 pl-0'
                }
      `}>
                <div
                    className="text-sm leading-7"
                    dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                />
                <div className={`text-[10px] mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'text-zinc-500 text-right' : 'text-zinc-600'}`}>
                    {formatTime(message.timestamp)}
                </div>
            </div>

            {/* User Icon */}
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 mt-1">
                    <User size={16} />
                </div>
            )}
        </div>
    );
}

function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
