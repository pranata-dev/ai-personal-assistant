'use client';

import { useRef, useEffect } from 'react';
import { Message, PersonalityMode } from '@/types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import InputArea from './InputArea';

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
        <div className="flex flex-col h-full">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="text-6xl mb-4 animate-bounce-slow">🤖</div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Halo! Aku asisten AI kamu
                        </h2>
                        <p className="text-gray-400 max-w-md">
                            Mau ngobrol, brainstorm, atau butuh bantuan bikin sesuatu?
                            Ketik <code className="bg-white/10 px-2 py-0.5 rounded">help</code> buat lihat semua fitur!
                        </p>
                        <div className="flex gap-2 mt-6 flex-wrap justify-center">
                            {['Ceritakan tentang dirimu', 'Mode chaos', 'Bikinin prompt'].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => onSend(suggestion)}
                                    className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 
                    text-gray-300 text-sm border border-white/10
                    transition-all duration-200 hover:scale-105"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} mode={mode} />
                ))}

                {isLoading && <TypingIndicator mode={mode} />}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <InputArea onSend={onSend} isLoading={isLoading} mode={mode} />
        </div>
    );
}
