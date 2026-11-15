import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  BookMarked,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

const STARTER_PROMPTS = [
  { label: '💡 Summarize core concepts', query: 'Summarize the most important themes and concepts from my notes.' },
  { label: '🔑 Key definitions to memorize', query: 'What are the most crucial terms and definitions I need to know?' },
  { label: '🎯 Likely exam questions', query: 'Based on this material, what are the most likely exam questions or tricky topics?' },
  { label: "🧠 Explain like I'm 5", query: "Can you explain the central theme of these notes with a fun, intuitive real-world analogy?" },
];

export default function ChatView({
  messages,
  onSendMessage,
  isLoading,
  onSaveNote,
  voiceEnabled,
}) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [savedMessageMap, setSavedMessageMap] = useState({});
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const chatBottomRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Web Speech API - Text to Speech
  const speakText = (text, idx) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown chars before speech
    const cleanText = text.replace(/[*#_`>]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Slightly warmer/friendly pitch
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API - Speech to Text
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const toggleSource = (idx) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSaveToNotebook = (msg, idx) => {
    onSaveNote({
      title: 'Study Q&A Insight',
      content: msg.content,
      tag: 'Q&A',
    });
    setSavedMessageMap((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="flex flex-col h-[760px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Empty state / Welcome */}
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto py-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-brand-500/20 select-none">
              🦉
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Hey there! What are we studying today?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Ask anything about your uploaded notes. I’ll break down difficult concepts, provide intuitive analogies, and cite exact page numbers.
            </p>

            {/* Quick starter cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 text-left">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(prompt.query)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-xs text-slate-700 dark:text-slate-200 font-medium group flex items-start justify-between gap-2 shadow-2xs"
                >
                  <span>{prompt.label}</span>
                  <span className="text-slate-400 group-hover:text-brand-500 transition-colors">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-lg flex-shrink-0 text-white shadow-xs select-none">
                    🦉
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-br-xs font-normal'
                      : 'bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {/* Content */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Sources citation dropdown */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80">
                      <button
                        onClick={() => toggleSource(idx)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Sources from your notes ({msg.sources.length})</span>
                        {expandedSources[idx] ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {expandedSources[idx] && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10.5px] text-slate-600 dark:text-slate-300 shadow-2xs"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar on Assistant responses */}
                  {!isUser && (
                    <div className="mt-3 pt-2 flex items-center justify-between gap-3 text-[11px] text-slate-400 border-t border-slate-200/40 dark:border-slate-700/40">
                      <div className="flex items-center gap-2">
                        {/* Read Aloud button */}
                        <button
                          onClick={() => speakText(msg.content, idx)}
                          className={`flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ${
                            speakingIndex === idx ? 'text-brand-600 font-semibold' : ''
                          }`}
                          title="Read out loud"
                        >
                          {speakingIndex === idx ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        {/* Save to Notebook */}
                        <button
                          onClick={() => handleSaveToNotebook(msg, idx)}
                          disabled={savedMessageMap[idx]}
                          className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:text-emerald-600"
                          title="Save to notebook"
                        >
                          {savedMessageMap[idx] ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <BookMarked className="w-3.5 h-3.5" />
                              <span>Save Note</span>
                            </>
                          )}
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400">Alex</span>
                    </div>
                  )}

                  {/* Suggested Follow-up chips */}
                  {!isUser && msg.follow_ups && msg.follow_ups.length > 0 && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Explore Next:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.follow_ups.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => onSendMessage(chip)}
                            className="text-left px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/40 text-[11px] text-slate-700 dark:text-slate-200 transition-all shadow-2xs"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg flex-shrink-0 text-slate-600 dark:text-slate-300 shadow-xs select-none">
                    🎓
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-lg text-white shadow-xs select-none animate-bounce-soft">
              🦉
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl rounded-bl-xs px-4 py-3 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span>Alex is flipping through your notes & thinking...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input area */}
      <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          {/* Speech-to-Text Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs'
            }`}
            title={isListening ? 'Listening... click to stop' : 'Speak your question'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to your voice...'
                : 'Ask Alex a question about your study material...'
            }
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-2xs placeholder:text-slate-400"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-brand-500/20"
            title="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
