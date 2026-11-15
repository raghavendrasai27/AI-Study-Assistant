import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Layers,
  Sparkles,
  RotateCw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Trophy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { generateFlashcards } from '../api/client';

export default function FlashcardsView({ setAlexMood }) {
  const [deckSize, setDeckSize] = useState(8);
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastery, setMastery] = useState({}); // card id -> 'hard' | 'good' | 'easy'
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (deck.length === 0) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight' && currentIndex < deck.length - 1) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key === '1') {
        rateCard('hard');
      } else if (e.key === '2') {
        rateCard('good');
      } else if (e.key === '3') {
        rateCard('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, currentIndex]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setDeck([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMastery({});
    if (setAlexMood) setAlexMood('reading');

    try {
      const res = await generateFlashcards(deckSize);
      setDeck(res.flashcards);
      if (setAlexMood) setAlexMood('explaining');
    } catch (err) {
      alert(err.message || 'Failed to generate flashcards');
      if (setAlexMood) setAlexMood('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const rateCard = (level) => {
    const currentCard = deck[currentIndex];
    if (!currentCard) return;

    setMastery((prev) => ({ ...prev, [currentCard.id]: level }));

    if (level === 'easy' && Object.keys(mastery).length + 1 >= deck.length) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }

    // Advance to next card if not at end
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const speakCard = (e) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    const card = deck[currentIndex];
    if (!card) return;

    window.speechSynthesis.cancel();
    const textToSpeak = isFlipped
      ? `Answer: ${card.answer}. Key takeaway: ${card.takeaway || ''}`
      : `Question: ${card.question}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    window.speechSynthesis.speak(utterance);
  };

  const currentCard = deck[currentIndex];
  const masteredCount = Object.values(mastery).filter((v) => v === 'easy').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Active Recall Flashcards
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Flip through high-yield concepts with realistic 3D tactile card interaction.
            </p>
          </div>
        </div>

        {/* Deck generation controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <span>Cards:</span>
            <input
              type="range"
              min={3}
              max={15}
              value={deckSize}
              onChange={(e) => setDeckSize(Number(e.target.value))}
              className="w-24 accent-brand-600"
            />
            <span className="font-bold text-brand-600 dark:text-brand-400">{deckSize}</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-medium text-xs hover:bg-brand-700 transition-all shadow-sm shadow-brand-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Creating Deck...' : 'Generate Deck'}</span>
          </button>
        </div>
      </div>

      {deck.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <Layers className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            No Flashcards Generated Yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Generate Deck" to produce an active recall deck tailored to your uploaded study notes.
          </p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Deck Status Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">
              Card {currentIndex + 1} of {deck.length}
            </span>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Trophy className="w-3.5 h-3.5" />
                <span>{masteredCount} Mastered</span>
              </span>
              <span>·</span>
              <button
                onClick={handleShuffle}
                className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Shuffle Deck"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
            />
          </div>

          {/* 3D Interactive Flip Card */}
          <div className="perspective-1000 min-h-[300px]">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full min-h-[300px] preserve-3d transition-transform duration-500 cursor-pointer select-none rounded-3xl ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 backface-hidden w-full h-full rounded-3xl bg-gradient-to-br from-white to-slate-50/90 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200/90 dark:border-slate-700/80 p-6 sm:p-8 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    🏷️ {currentCard.topic}
                  </span>

                  <button
                    onClick={speakCard}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Listen to card"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-auto py-6 text-center">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {currentCard.question}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Press Space to Flip</span>
                  <span className="flex items-center gap-1 font-medium text-brand-600 dark:text-brand-400">
                    <RotateCw className="w-3 h-3" />
                    <span>Flip for answer</span>
                  </span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full rounded-3xl bg-gradient-to-br from-brand-50/70 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/40 border-2 border-brand-300/80 dark:border-brand-700/60 p-6 sm:p-8 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                    ✅ Answer
                  </span>

                  <button
                    onClick={speakCard}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Listen to answer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-auto py-4">
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    {currentCard.answer}
                  </p>

                  {currentCard.takeaway && (
                    <div className="mt-4 p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-brand-200/60 dark:border-brand-800/60 text-xs text-brand-900 dark:text-brand-200">
                      <span className="font-bold">💡 Takeaway: </span>
                      <span>{currentCard.takeaway}</span>
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-slate-400">
                  Rate your recall below to track mastery
                </div>
              </div>
            </div>
          </div>

          {/* Active Recall Rating Buttons (Leitner style) */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Recall Ease:
            </span>

            <div className="flex items-center gap-2 flex-1 justify-center sm:justify-end">
              <button
                onClick={() => rateCard('hard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium hover:bg-rose-100 transition-colors"
                title="Press 1"
              >
                <span>😣 Hard</span>
                <span className="text-[10px] opacity-60">(1)</span>
              </button>

              <button
                onClick={() => rateCard('good')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 transition-colors"
                title="Press 2"
              >
                <span>🙂 Good</span>
                <span className="text-[10px] opacity-60">(2)</span>
              </button>

              <button
                onClick={() => rateCard('easy')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 transition-colors"
                title="Press 3"
              >
                <span>🤩 Easy</span>
                <span className="text-[10px] opacity-60">(3)</span>
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => prev - 1);
                }
              }}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400">
              Use <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">←</kbd> and <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">→</kbd> keys
            </span>

            <button
              onClick={() => {
                if (currentIndex < deck.length - 1) {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => prev + 1);
                }
              }}
              disabled={currentIndex === deck.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
