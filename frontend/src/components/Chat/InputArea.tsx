'use client';

import { useState, useRef, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { PersonalityMode } from '@/types';
import { Language } from '@/lib/i18n';
import { toast } from 'sonner';

interface InputAreaProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    mode: PersonalityMode;
    spokenLanguage: 'id-ID' | 'en-US' | 'auto';
    language: Language;
}

export default function InputArea({ onSend, isLoading }: InputAreaProps) {
    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSend(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const loadingToast = toast.loading("Uploading document...");

        try {
            const res = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                toast.dismiss(loadingToast);
                toast.success("Knowledge Learned! 🧠", {
                    description: "I can now answer questions about this document."
                });
            } else {
                toast.dismiss(loadingToast);
                toast.error("Upload failed.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.dismiss(loadingToast);
            toast.error("Upload error.");
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <div className="max-w-3xl mx-auto relative flex items-end gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all">

                {/* File Upload Button */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.txt"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    title="Upload Document"
                    disabled={isLoading || isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Paperclip className="w-5 h-5" />
                    )}
                </button>

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    rows={1}
                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 max-h-32 min-h-[44px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                    style={{ height: 'auto' }}
                    disabled={isLoading}
                />

                <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            <div className="text-center mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                AI may display inaccurate info, including about people, so double-check its responses.
            </div>
        </div>
    );
}
