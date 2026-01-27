'use client';

import { useRef, useEffect } from 'react';
import { Message, PersonalityMode } from '@/types';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import { Bot, Sparkles, Terminal } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

interface ChatContainerProps {
    messages: Message[];
    mode: PersonalityMode;
    isLoading: boolean;
    onSend: (message: string) => void;
}

export default function ChatContainer({ messages, mode, isLoading, onSend }: ChatContainerProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-zinc-500">
                            <Bot size={32} />
                        </div>
                        <h2 className="text-lg font-medium text-zinc-200 mb-2">
                            AI Assistant
                        </h2>
                        <p className="text-zinc-500 text-sm max-w-sm leading-relaxed mb-8">
                            Professional thinking partner aimed at productivity and problem solving.
                        </p>

                        <div className="grid grid-cols-2 gap-3 max-w-md w-full">
                            {[
                                { label: 'Summarize Text', icon: Terminal, prompt: 'Initialize thought dump...' },
                                { label: 'Generate Prompt', icon: Sparkles, prompt: 'Create a system prompt...' },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => onSend(item.prompt)}
                                    className="px-4 py-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 
                    border border-zinc-800 hover:border-zinc-700
                    text-zinc-400 hover:text-zinc-200 text-sm text-left
                    transition-all duration-200 flex items-center gap-3"
                                >
                                    <item.icon size={14} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} mode={mode} />
                ))}

                {isLoading && (
                    <div className="max-w-3xl mx-auto w-full flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <Bot size={14} className="text-zinc-500" />
                        </div>
                        <TypingIndicator mode={mode} />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <InputArea onSend={onSend} isLoading={isLoading} mode={mode} />
        </div>
    );
}
