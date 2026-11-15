import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatView from './views/ChatView';
import SummaryView from './views/SummaryView';
import QuestionsView from './views/QuestionsView';
import QuizView from './views/QuizView';
import FlashcardsView from './views/FlashcardsView';
import NotebookView from './views/NotebookView';
import {
  getStatus,
  uploadDocuments,
  sendChatMessage,
  getMessages,
  resetSession,
  saveNote,
} from './api/client';

export default function App() {
  const [status, setStatus] = useState(null);
  const [activeMode, setActiveMode] = useState('chat');
  const [persona, setPersona] = useState('chill_buddy');
  const [messages, setMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [alexMood, setAlexMood] = useState('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Dark Mode Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial status and message fetch
  const refreshStatus = async () => {
    try {
      const data = await getStatus();
      setStatus(data);
    } catch (e) {
      console.error('Status fetch failed:', e);
    }
  };

  const refreshMessages = async () => {
    try {
      const data = await getMessages();
      setMessages(data.messages || []);
    } catch (e) {
      console.error('Messages fetch failed:', e);
    }
  };

  useEffect(() => {
    refreshStatus();
    refreshMessages();
  }, []);

  // Upload handler
  const handleUpload = async (files) => {
    setIsUploading(true);
    setAlexMood('reading');
    try {
      await uploadDocuments(files);
      await refreshStatus();
      setMessages([]);
      setAlexMood('explaining');
    } catch (err) {
      alert(err.message || 'Upload failed');
      setAlexMood('idle');
    } finally {
      setIsUploading(false);
    }
  };

  // Chat message send handler
  const handleSendMessage = async (question) => {
    // Add user message optimistically
    const userMsg = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);
    setAlexMood('thinking');

    try {
      const res = await sendChatMessage(question, persona);
      const assistantMsg = {
        role: 'assistant',
        content: res.reply,
        sources: res.sources,
        follow_ups: res.follow_ups,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setAlexMood('explaining');

      // Auto Read Aloud if enabled
      if (voiceEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = res.reply.replace(/[*#_`>]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      alert(err.message || 'Failed to send message');
      setAlexMood('idle');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Reset session handler
  const handleReset = async () => {
    if (!confirm('Are you sure you want to clear current uploaded documents and chat?')) {
      return;
    }
    try {
      await resetSession();
      await refreshStatus();
      setMessages([]);
      setAlexMood('idle');
    } catch (err) {
      alert(err.message || 'Failed to reset session');
    }
  };

  // Save note helper
  const handleSaveNote = async (note) => {
    try {
      await saveNote(note.title, note.content, note.tag);
    } catch (err) {
      alert(err.message || 'Failed to save note');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <Navbar
        status={status}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onReset={handleReset}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left / Sidebar Controls */}
          <Sidebar
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            persona={persona}
            setPersona={setPersona}
            onUpload={handleUpload}
            isUploading={isUploading}
            status={status}
            alexMood={alexMood}
            setAlexMood={setAlexMood}
          />

          {/* Active View Container */}
          <section className="flex-1 min-w-0">
            {activeMode === 'chat' && (
              <ChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
                onSaveNote={handleSaveNote}
                voiceEnabled={voiceEnabled}
              />
            )}

            {activeMode === 'summary' && (
              <SummaryView
                onSaveNote={handleSaveNote}
                setAlexMood={setAlexMood}
              />
            )}

            {activeMode === 'questions' && (
              <QuestionsView
                onSaveNote={handleSaveNote}
                setAlexMood={setAlexMood}
              />
            )}

            {activeMode === 'quiz' && (
              <QuizView setAlexMood={setAlexMood} />
            )}

            {activeMode === 'flashcards' && (
              <FlashcardsView setAlexMood={setAlexMood} />
            )}

            {activeMode === 'notebook' && (
              <NotebookView setAlexMood={setAlexMood} />
            )}
          </section>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 text-center text-xs text-slate-400">
        <p>
          Alex · AI Study Companion · Designed with empathy for college students · Powered by Google Gemini & React
        </p>
      </footer>
    </div>
  );
}
