/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Sparkles,
  PhoneCall,
  Sliders,
  Box,
} from 'lucide-react';
import {
  ActiveTab,
  ChatMessage,
  AppSettings,
  DEFAULT_SETTINGS,
  EmotionType,
  MemoryCategory,
  CompanionMemory,
} from './types';
import { SakuraBackground } from './components/SakuraBackground';
import { ChatView } from './components/ChatView';
import { VirtualRoomView } from './components/VirtualRoomView';
import { AvatarStageView } from './components/AvatarStageView';
import { LiveVoiceView } from './components/LiveVoiceView';
import { SettingsView } from './components/SettingsView';
import { MemoryManagerModal } from './components/MemoryManagerModal';
import { playSound } from './utils/soundEffects';
import { speakText, stopSpeaking } from './utils/speech';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [activeEmotion, setActiveEmotion] = useState<EmotionType>('neutral');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);

  // Settings loaded from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('zero_two_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Chat messages loaded from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('zero_two_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Save settings to localStorage
  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('zero_two_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('zero_two_settings', JSON.stringify(DEFAULT_SETTINGS));
    } catch {}
  };

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zero_two_chat_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleClearHistory = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setMessages([]);
    try {
      localStorage.removeItem('zero_two_chat_messages');
    } catch {}
    playSound.click(settings.soundEffectsEnabled);
  };

  // Memory Management Handlers
  const handleAddMemory = (category: MemoryCategory, content: string) => {
    const newMem: CompanionMemory = {
      id: `mem-${Date.now()}`,
      category,
      content,
      timestamp: Date.now(),
    };
    handleUpdateSettings({
      memories: [newMem, ...settings.memories],
    });
  };

  const handleUpdateMemory = (id: string, newContent: string, newCategory: MemoryCategory) => {
    handleUpdateSettings({
      memories: settings.memories.map((m) =>
        m.id === id ? { ...m, content: newContent, category: newCategory } : m
      ),
    });
  };

  const handleDeleteMemory = (id: string) => {
    handleUpdateSettings({
      memories: settings.memories.filter((m) => m.id !== id),
    });
  };

  const handleClearAllMemories = () => {
    handleUpdateSettings({
      memories: [],
    });
  };

  // Send message to backend Gemini API
  const handleSendMessage = useCallback(
    async (text: string, useSearch: boolean): Promise<string | null> => {
      if (!text.trim() || isLoading) return null;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setActiveEmotion('thinking');

      try {
        const payload = {
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          message: text.trim(),
          useSearch,
          userNickname: settings.userNickname,
          assistantNickname: settings.assistantNickname,
          memories: settings.memories.map((m) => ({
            category: m.category,
            content: m.content,
          })),
        };

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to get response from server.');
        }

        const returnedEmotion: EmotionType = (data.emotion as EmotionType) || 'neutral';
        const modelReply = data.reply || '';

        const aiMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: modelReply,
          timestamp: Date.now(),
          emotion: returnedEmotion,
          groundingSources: data.groundingSources,
          searchNotice: data.searchNotice,
          suggestedMemory: data.suggestedMemory,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setActiveEmotion(returnedEmotion);
        playSound.chime(settings.soundEffectsEnabled);

        // Auto speak if enabled and on Chat or Room tab
        if (settings.voiceEnabled && settings.autoSpeak && (activeTab === 'chat' || activeTab === 'room')) {
          setIsSpeaking(true);
          speakText(modelReply, {
            pitch: settings.voicePitch,
            rate: settings.voiceRate,
            volume: settings.voiceVolume,
            voiceURI: settings.selectedVoiceURI,
            onEnd: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
          });
        }

        return modelReply;
      } catch (err: any) {
        console.error('Chat error:', err);
        const errorText =
          err?.message ||
          "Zero Two got a little flustered! Her neural link had a hiccup. Please try again in a moment, Darling!";

        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `[Notice] ${errorText}`,
          timestamp: Date.now(),
          emotion: 'surprised',
        };

        setMessages((prev) => [...prev, errorMsg]);
        setActiveEmotion('surprised');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, settings, activeTab]
  );

  const handleTabChange = (tab: ActiveTab) => {
    playSound.click(settings.soundEffectsEnabled);
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[#0d0714] text-white relative select-none">
      {/* Anime Sakura Petal Atmosphere (Hidden in 3D Room which has its own 3D petals) */}
      {activeTab !== 'room' && <SakuraBackground enabled={settings.particlesEnabled} />}

      {/* Main Tab View Port */}
      <main className="flex-1 overflow-hidden relative z-1 flex flex-col">
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onClearHistory={handleClearHistory}
            settings={settings}
            activeEmotion={activeEmotion}
            onEmotionChange={setActiveEmotion}
            onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
            onSaveSuggestedMemory={handleAddMemory}
            isSpeaking={isSpeaking}
          />
        )}

        {activeTab === 'room' && (
          <VirtualRoomView
            emotion={activeEmotion}
            onEmotionChange={setActiveEmotion}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            messages={messages}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'avatar' && (
          <AvatarStageView
            emotion={activeEmotion}
            onEmotionChange={setActiveEmotion}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'live' && (
          <LiveVoiceView
            onSendMessage={handleSendMessage}
            emotion={activeEmotion}
            onEmotionChange={setActiveEmotion}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSettings={handleResetSettings}
            onClearHistory={handleClearHistory}
            messageCount={messages.length}
            onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
          />
        )}
      </main>

      {/* Android-First Ergonomic Bottom Navigation Bar */}
      <nav className="h-16 shrink-0 bg-slate-950/90 backdrop-blur-xl border-t border-pink-500/25 px-1 relative z-30 flex items-center justify-around safe-bottom">
        {/* Chat Tab */}
        <button
          onClick={() => handleTabChange('chat')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'chat'
              ? 'text-pink-400 font-bold scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {messages.length > 0 && activeTab !== 'chat' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Chat</span>
        </button>

        {/* 3D Virtual Room Tab */}
        <button
          onClick={() => handleTabChange('room')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'room'
              ? 'text-pink-400 font-bold scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Box className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">3D Room</span>
        </button>

        {/* Avatar Interactive Stage Tab */}
        <button
          onClick={() => handleTabChange('avatar')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'avatar'
              ? 'text-pink-400 font-bold scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Avatar</span>
        </button>

        {/* Live Voice Call Tab */}
        <button
          onClick={() => handleTabChange('live')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'live'
              ? 'text-pink-400 font-bold scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <PhoneCall className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Voice</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => handleTabChange('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'settings'
              ? 'text-pink-400 font-bold scale-105'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Settings</span>
        </button>
      </nav>

      {/* Partner Memory Management Modal */}
      <MemoryManagerModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={settings.memories}
        onAddMemory={handleAddMemory}
        onUpdateMemory={handleUpdateMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearAllMemories={handleClearAllMemories}
        soundEnabled={settings.soundEffectsEnabled}
      />
    </div>
  );
}
