'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message, PersonalityMode, Memory } from '@/types';
import { loadMemory, saveMemory, addMessage, resetMemory } from '@/lib/memory';
import ChatContainer from '@/components/Chat/ChatContainer';
import Sidebar from '@/components/Workspace/Sidebar';
import MainArea from '@/components/Workspace/MainArea';
import SettingsModal from '@/components/SettingsModal';
import { Language } from '@/lib/i18n';
import Header from '@/components/Header';

export default function Home() {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [spokenLanguage, setSpokenLanguage] = useState<'id-ID' | 'en-US' | 'auto'>('auto');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load memory on mount
  useEffect(() => {
    setMemory(loadMemory());
  }, []);

  // Save memory when it changes
  useEffect(() => {
    if (memory) {
      saveMemory(memory);
    }
  }, [memory]);

  const currentMode = memory?.preferences.currentMode ?? 'bestfriend';
  const currentLanguage = (memory?.preferences.language as Language) ?? 'en';
  const messages = memory?.conversations ?? [];

  const createMessage = (content: string, role: 'user' | 'assistant'): Message => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: Date.now(),
    mode: currentMode,
  });

  const handleLanguageChange = useCallback((lang: Language) => {
    if (!memory) return;
    setMemory((prev: Memory | null) => {
      if (!prev) return null;
      return {
        ...prev,
        preferences: { ...prev.preferences, language: lang },
      };
    });
  }, [memory]);

  const handleReset = useCallback(() => {
    setMemory(resetMemory());
  }, []);

  const handleSend = useCallback(async (input: string) => {
    if (!memory) return;

    const userMessage = createMessage(input, 'user');
    let updatedMemory = addMessage(memory, userMessage);
    setMemory(updatedMemory);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = createMessage(
          `Error: ${data.detail || 'Backend unavailable'}`,
          'assistant'
        );
        setMemory(addMessage(updatedMemory, errorMessage));
      } else {
        const assistantMessage = createMessage(data.response, 'assistant');
        setMemory(addMessage(updatedMemory, assistantMessage));
      }
    } catch {
      const errorMessage = createMessage(
        'Connection failed. Is the backend running on port 8000?',
        'assistant'
      );
      setMemory(addMessage(updatedMemory, errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [memory, currentMode]);

  // Loading state
  if (!memory) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-500 dark:border-t-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden font-sans bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onReset={handleReset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <MainArea>
        <Header onReset={handleReset} />
        <div className="flex-1 min-h-0 relative">
          <ChatContainer
            messages={messages}
            mode={currentMode}
            isLoading={isLoading}
            onSend={handleSend}
            spokenLanguage={spokenLanguage}
            language={currentLanguage}
          />
        </div>
      </MainArea>

      {/* Settings */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={currentLanguage}
        setLanguage={handleLanguageChange}
        spokenLanguage={spokenLanguage}
        setSpokenLanguage={setSpokenLanguage}
      />
    </div>
  );
}
