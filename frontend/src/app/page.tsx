'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message, PersonalityMode, Memory } from '@/types';
import { loadMemory, addMessage, resetMemory } from '@/lib/memory';
import ChatContainer from '@/components/Chat/ChatContainer';
import Sidebar from '@/components/Workspace/Sidebar';
import MainArea from '@/components/Workspace/MainArea';
import SettingsModal from '@/components/SettingsModal';
import { Language } from '@/lib/i18n';
import Header from '@/components/Header';
import { Toaster, toast } from 'sonner';

export default function Home() {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [spokenLanguage, setSpokenLanguage] = useState<'id-ID' | 'en-US' | 'auto'>('auto');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load memory and fetch history on mount
  useEffect(() => {
    const initialMemory = loadMemory();

    fetch('http://localhost:8000/history')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
      })
      .then(history => {
        setMemory({
          ...initialMemory,
          conversations: history
        });
      })
      .catch(err => {
        console.error('Failed to load history:', err);
        // Fallback to local memory if backend fails, but warn
        setMemory(initialMemory);
      });
  }, []);

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

  const handleReset = useCallback(async () => {
    if (!confirm("Are you sure you want to clear the entire chat history?")) return;

    try {
      const res = await fetch('http://localhost:8000/history', { method: 'DELETE' });
      if (res.ok) {
        setMemory(resetMemory());
        toast.success("History cleared");
      } else {
        toast.error("Failed to clear history");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error clearing history");
    }
  }, []);

  const handleSend = useCallback(async (input: string) => {
    if (!memory) return;

    const userMessage = createMessage(input, 'user');
    let updatedMemory = addMessage(memory, userMessage);
    setMemory(updatedMemory);
    setIsLoading(true);

    try {
      // Prepare context
      const context = updatedMemory.conversations.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: context }),
      });

      if (!response.ok) throw new Error(response.statusText);

      // Create placeholder for assistant message
      const assistantMessage = createMessage('', 'assistant');
      setMemory(prev => prev ? addMessage(prev, assistantMessage) : null);

      if (!response.body) return;

      // Stream handling
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedResponse += chunk;

        // Update last message with new content
        setMemory(prev => {
          if (!prev) return null;
          const newConversations = [...prev.conversations];
          const lastMsgIndex = newConversations.length - 1;

          if (lastMsgIndex >= 0) {
            newConversations[lastMsgIndex] = {
              ...newConversations[lastMsgIndex],
              content: streamedResponse
            };
          }

          return {
            ...prev,
            conversations: newConversations
          };
        });
      }

    } catch (error) {
      console.error('Streaming error:', error);
      const errorMessage = createMessage(
        'Connection failed or backend error.',
        'assistant'
      );
      setMemory(prev => prev ? addMessage(prev, errorMessage) : null);
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
      <Toaster position="top-center" />
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onReset={handleReset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <MainArea>
        <Header onClear={handleReset} />
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
