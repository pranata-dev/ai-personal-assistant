'use client';

import { Message, PersonalityMode } from '@/types';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageBubbleProps {
    message: Message;
    mode: PersonalityMode;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
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
            .map((line) => {
                // Bold
                line = line.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="font-semibold text-zinc-900 dark:text-white">$1</strong>'
                );
                // Inline code
                line = line.replace(
                    /`([^`]+)`/g,
                    '<code class="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[13px] font-mono text-zinc-700 dark:text-zinc-300">$1</code>'
                );
                // List items
                if (line.startsWith('- ')) {
                    line = `<div class="flex gap-2 items-start"><span class="mt-2 w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500 flex-shrink-0"></span><span>${line.slice(2)}</span></div>`;
                }
                return line;
            })
            .join('<div class="h-1.5"></div>');
    };

    if (isUser) {
        return (
            <div className="flex justify-end px-4 py-1.5 max-w-3xl mx-auto w-full">
                <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[15px] leading-relaxed">
                    {message.content}
                </div>
            </div>
        );
    }

    return (
        <div className="group px-4 py-1.5 max-w-3xl mx-auto w-full">
            <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                <div dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} />

                {/* Copy action on hover */}
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={handleCopy}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Copy"
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
