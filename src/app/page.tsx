'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message, PersonalityMode, Memory } from '@/types';
import { loadMemory, saveMemory, addMessage, setMode, resetMemory, getRecentContext } from '@/lib/memory';
import { detectIntent, getHelpMessage, getModeChangeMessage, getResetMemoryMessage, getPromptEngineerResponse, getThoughtDumpResponse } from '@/lib/ai-engine';
import ChatContainer from '@/components/Chat/ChatContainer';
import Sidebar from '@/components/Workspace/Sidebar';
import RightPanel from '@/components/Workspace/RightPanel';
import MainArea from '@/components/Workspace/MainArea';

export default function Home() {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      // Just switch mode, no message
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
  }, [memory, currentMode, handleModeChange, handleReset]);

  if (!memory) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-zinc-950 overflow-hidden text-zinc-200 font-sans selection:bg-zinc-800 selection:text-white">
      {/* 1. Left Sidebar */}
      <Sidebar
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onReset={handleReset}
      />

      {/* 2. Main Chat Area */}
      <MainArea>
        <ChatContainer
          messages={messages}
          mode={currentMode}
          isLoading={isLoading}
          onSend={handleSend}
        />
      </MainArea>

      {/* 3. Right Panel (Optional) */}
      {messages.length > 0 && (
        <div className="hidden xl:block">
          <RightPanel memory={memory} mode={currentMode} />
        </div>
      )}
    </div>
  );
}
