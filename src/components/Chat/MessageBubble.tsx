'use client';

import { Message, PersonalityMode } from '@/types';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageBubbleProps {
    message: Message;
    mode: PersonalityMode;
}

export default function MessageBubble({ message, mode }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatContent = (content: string) => {
        return content
            .split('\n')
            .map((line, i) => {
                line = line.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-white">$1</span>');
                line = line.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-[13px] font-mono text-zinc-300 border border-zinc-700/50">$1</code>');
                if (line.startsWith('- ')) {
                    line = `<div class="flex gap-3 items-start"><span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-600 flex-shrink-0"></span><span>${line.slice(2)}</span></div>`;
                }
                return line;
            })
            .join('<div class="h-2"></div>'); // Spacing between paragraphs
    };

    return (
        <div className={`group flex gap-5 max-w-4xl mx-auto w-full px-4 py-2 hover:bg-zinc-900/40 rounded-xl transition-colors ${isUser ? '' : ''}`}>
            {/* Icon Column */}
            <div className="flex-shrink-0 w-8 pt-1">
                {isUser ? (
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <User size={16} />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Bot size={16} />
                    </div>
                )}
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-zinc-200">
                        {isUser ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                        {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div
                    className="text-[15px] leading-relaxed text-zinc-300 markdown-content"
                    dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                />

                {/* Actions (visible on hover) */}
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    {!isUser && (
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700 transition-all"
                            title="Copy"
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
