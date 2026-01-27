'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message, PersonalityMode, Memory } from '@/types';
import { loadMemory, saveMemory, addMessage, setMode, resetMemory, getRecentContext } from '@/lib/memory';
import { detectIntent, getHelpMessage, getModeChangeMessage, getResetMemoryMessage, getPromptEngineerResponse, getThoughtDumpResponse } from '@/lib/ai-engine';
import Header from '@/components/Header';
import ChatContainer from '@/components/Chat/ChatContainer';
import ModeSelector from '@/components/ModeSelector';

export default function Home() {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModeOpen, setIsModeOpen] = useState(false);

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
    const modeMessage = createMessage(getModeChangeMessage(newMode), 'assistant');
    const finalMemory = addMessage(updatedMemory, modeMessage);

    setMemory(finalMemory);
  }, [memory, currentMode]);

  const handleReset = useCallback(() => {
    const freshMemory = resetMemory();
    const welcomeMessage = createMessage(getResetMemoryMessage(), 'assistant');
    const finalMemory = addMessage(freshMemory, welcomeMessage);

    setMemory(finalMemory);
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
      handleModeChange(intent.mode);
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

    // For prompt engineering and thought dump, show initial response
    if (intent.type === 'prompt_engineer') {
      const promptResponse = createMessage(getPromptEngineerResponse(input), 'assistant');
      updatedMemory = addMessage(updatedMemory, promptResponse);
      setMemory(updatedMemory);
      // Continue to API call for actual generation
    }

    if (intent.type === 'thought_dump') {
      const dumpResponse = createMessage(getThoughtDumpResponse(), 'assistant');
      updatedMemory = addMessage(updatedMemory, dumpResponse);
      setMemory(updatedMemory);
      // Continue to API call for actual analysis
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
        '⚠️ Gagal konek ke server. Coba lagi nanti ya!',
        'assistant'
      );
      setMemory(addMessage(updatedMemory, errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [memory, currentMode, handleModeChange, handleReset]);

  if (!memory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-3xl mx-auto h-screen flex flex-col">
        <Header mode={currentMode} onReset={handleReset} />

        <main className="flex-1 overflow-hidden">
          <ChatContainer
            messages={messages}
            mode={currentMode}
            isLoading={isLoading}
            onSend={handleSend}
          />
        </main>

        <ModeSelector
          currentMode={currentMode}
          onModeChange={handleModeChange}
          isOpen={isModeOpen}
          onToggle={() => setIsModeOpen(!isModeOpen)}
        />
      </div>
    </div>
  );
}
