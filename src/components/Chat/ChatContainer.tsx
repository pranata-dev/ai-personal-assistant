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
        <div className="flex flex-col h-full relative">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto w-full scrollbar-thin">
                <div className="min-h-full pb-4"> {/* Padding bottom for sticky input */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4 animate-fade-in">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-zinc-500">
                                <Bot size={32} />
                            </div>
                            <h2 className="text-xl font-medium text-zinc-200 mb-2">
                                Ready to collaborate
                            </h2>
                            <p className="text-zinc-500 text-sm max-w-sm leading-relaxed mb-8">
                                Select a mode or start typing to begin. Your session is private and stateless.
                            </p>

                            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                                {[
                                    { label: 'Draft Email', icon: Terminal, prompt: 'Draft a professional email regarding...' },
                                    { label: 'Brainstorm Ideas', icon: Sparkles, prompt: 'Brainstorm creative ideas for...' },
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => onSend(item.prompt)}
                                        className="px-4 py-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 
                      border border-zinc-800 hover:border-zinc-600
                      text-zinc-400 hover:text-zinc-200 text-sm text-left
                      transition-all duration-200 flex items-center gap-3 group"
                                    >
                                        <item.icon size={16} className="text-zinc-600 group-hover:text-zinc-400" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="py-4 space-y-1">
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} mode={mode} />
                        ))}

                        {isLoading && (
                            <div className="px-4 py-2 max-w-4xl mx-auto w-full">
                                <div className="flex items-center gap-2 text-zinc-500 text-sm h-8 ml-10">
                                    <span className="text-xs">Thinking</span>
                                    <TypingIndicator mode={mode} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* Input area - Sticky at bottom */}
            <div className="z-10 bg-zinc-950 border-t border-zinc-900/50">
                <InputArea onSend={onSend} isLoading={isLoading} mode={mode} />
            </div>
        </div>
    );
}
