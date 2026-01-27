'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message, PersonalityMode, Memory } from '@/types';
import { loadMemory, saveMemory, addMessage, setMode, setModel, resetMemory, getRecentContext } from '@/lib/memory';
import { detectIntent, getHelpMessage, getPromptEngineerResponse, getThoughtDumpResponse } from '@/lib/ai-engine';
import { DEFAULT_MODEL_ID } from '@/lib/models';
import ChatContainer from '@/components/Chat/ChatContainer';
import Sidebar from '@/components/Workspace/Sidebar';
import RightPanel from '@/components/Workspace/RightPanel';
import MainArea from '@/components/Workspace/MainArea';
import SettingsModal from '@/components/SettingsModal';
import { Language } from '@/lib/i18n';
import Header from '@/components/Header';

export default function Home() {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Theme state removed - managed by next-themes
  // Theme state removed - managed by next-themes
  const [spokenLanguage, setSpokenLanguage] = useState<'id-ID' | 'en-US' | 'auto'>('auto');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // Load memory on mount - NO LocalStorage
  useEffect(() => {
    setMemory(loadMemory());
  }, []);

  // Save memory when it changes
  useEffect(() => {
    if (memory) {
      saveMemory(memory);
    }
  }, [memory]);

  // Theme Effect - Apply dark/light mode class to html element
  // Theme Effect removed - managed by next-themes

  // Derive memory-based stats
  const currentMode = memory?.preferences.currentMode ?? 'bestfriend';
  const currentModelId = memory?.preferences.currentModelId ?? DEFAULT_MODEL_ID;
  const currentLanguage = (memory?.preferences.language as Language) ?? 'en';
  const messages = memory?.conversations ?? [];

  const createMessage = (content: string, role: 'user' | 'assistant'): Message => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: Date.now(),
    mode: currentMode
  });

  const handleModeChange = useCallback((newMode: PersonalityMode) => {
    if (!memory) return;
    const updatedMemory = setMode(memory, newMode);
    setMemory(updatedMemory);
  }, [memory]);

  const handleModelChange = useCallback((newModelId: string) => {
    if (!memory) return;
    const updatedMemory = setModel(memory, newModelId);
    setMemory(updatedMemory);
  }, [memory]);

  // FIX: This now correctly updates the language in memory
  const handleLanguageChange = useCallback((lang: Language) => {
    if (!memory) return;
    setMemory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          language: lang
        }
      };
    });
  }, [memory]);

  const handleReset = useCallback(() => {
    const freshMemory = resetMemory();
    setMemory(freshMemory);
  }, []);

  const handleSend = useCallback(async (input: string) => {
    if (!memory) return;

    // Add user message
    const userMessage = createMessage(input, 'user');
    let updatedMemory = addMessage(memory, userMessage);
    setMemory(updatedMemory);

    // Detect intent
    const intent = detectIntent(input);

    // Handle special intents locally
    if (intent.type === 'mode_switch' && intent.mode) {
      const modeMem = setMode(updatedMemory, intent.mode);
      setMemory(modeMem);
      return;
    }

    if (intent.type === 'reset_memory') {
      handleReset();
      return;
    }

    if (intent.type === 'help') {
      const helpMessage = createMessage(getHelpMessage(currentMode), 'assistant');
      setMemory(addMessage(updatedMemory, helpMessage));
      return;
    }

    if (intent.type === 'prompt_engineer') {
      const promptResponse = createMessage(getPromptEngineerResponse(input), 'assistant');
      updatedMemory = addMessage(updatedMemory, promptResponse);
      setMemory(updatedMemory);
    }

    if (intent.type === 'thought_dump') {
      const dumpResponse = createMessage(getThoughtDumpResponse(), 'assistant');
      updatedMemory = addMessage(updatedMemory, dumpResponse);
      setMemory(updatedMemory);
    }

    // Call API for AI response
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          mode: currentMode,
          model: currentModelId, // Pass the selected model
          history: getRecentContext(updatedMemory, 10)
        })
      });

      const data = await response.json();

      if (data.error) {
        const errorMessage = createMessage(
          `⚠️ ${data.error}`,
          'assistant'
        );
        setMemory(addMessage(updatedMemory, errorMessage));
      } else {
        const assistantMessage = createMessage(data.response, 'assistant');
        setMemory(addMessage(updatedMemory, assistantMessage));
      }
    } catch {
      const errorMessage = createMessage(
        '⚠️ Connection failed.',
        'assistant'
      );
      setMemory(addMessage(updatedMemory, errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [memory, currentMode, currentModelId, handleModeChange, handleReset]);

  if (!memory) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-zinc-400 animate-spin" />
      </div>
    );
  }

  return (

    <div className="h-screen flex overflow-hidden font-sans transition-colors duration-200 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-zinc-800 dark:selection:text-white">
      {/* 1. Left Sidebar */}
      <Sidebar
        currentMode={currentMode}
        currentModelId={currentModelId}
        language={currentLanguage}
        isOpen={isSidebarOpen}
        onModeChange={handleModeChange}
        onModelChange={handleModelChange}
        onReset={handleReset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSystemStatus={() => setIsRightPanelOpen(true)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 2. Main Chat Area */}
      <MainArea>
        <Header mode={currentMode} onReset={handleReset} />
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
        {/* Transparent wrapper/overlay for modals if needed */}
      </MainArea>

      {/* 3. Right Panel (System Status) - Only shown when opened from sidebar */}
      {isRightPanelOpen && (
        <div className="hidden xl:block">
          <RightPanel
            memory={memory}
            mode={currentMode}
            isOpen={isRightPanelOpen}
            onToggle={() => setIsRightPanelOpen(false)}
          />
        </div>
      )}

      {/* Settings Modal */}
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
