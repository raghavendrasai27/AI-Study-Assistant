import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Coffee, Lightbulb, Trophy } from 'lucide-react';

const MOODS = {
  idle: {
    emoji: '🦉',
    badge: 'Study Buddy Ready',
    color: 'from-violet-500 to-indigo-600',
    tagline: "Hey! What are we conquering today? I'm right here with you.",
  },
  reading: {
    emoji: '📖',
    badge: 'Reading Notes...',
    color: 'from-amber-500 to-orange-500',
    tagline: 'Flipping through your study material to find the key ideas...',
  },
  thinking: {
    emoji: '💭',
    badge: 'Thinking...',
    color: 'from-blue-500 to-cyan-500',
    tagline: 'Connecting the concepts so it clicks naturally...',
  },
  explaining: {
    emoji: '💡',
    badge: 'Explaining',
    color: 'from-emerald-500 to-teal-500',
    tagline: "Here's the intuition! Take your time, ask if anything feels fuzzy.",
  },
  celebrating: {
    emoji: '🥳',
    badge: 'Crushing It!',
    color: 'from-pink-500 to-rose-500',
    tagline: "Woohoo! High five! You're making real progress!",
  },
  resting: {
    emoji: '☕',
    badge: 'Study Break',
    color: 'from-amber-600 to-yellow-600',
    tagline: 'Time for a sip of water, deep breath, and a gentle shoulder stretch.',
  },
};

const MOTIVATIONAL_NUDGES = [
  "“Small daily steps beat frantic last-minute cramming every single time.”",
  "“Don't worry if it feels tough right now. Confusion is just the brain forming new connections.”",
  "“Active recall is a superpower. Testing yourself cements long-term memory!”",
  "“Remember to hydrate and take deep breaths. You've totally got this.”",
  "“It's okay to ask 'Explain it like I'm 5'. Intuition always comes before formulas!”"
];

export default function AlexCompanion({ mood = 'idle', customMessage = null }) {
  const currentMood = MOODS[mood] || MOODS.idle;
  const [nudgeIndex, setNudgeIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setNudgeIndex((prev) => (prev + 1) % MOTIVATIONAL_NUDGES.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Ambient background glow */}
      <div className={`absolute -right-10 -top-10 w-28 h-28 bg-gradient-to-br ${currentMood.color} opacity-15 rounded-full blur-2xl pointer-events-none transition-all duration-700`} />

      <div className="flex items-start gap-3.5">
        {/* Animated Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentMood.color} flex items-center justify-center text-2xl shadow-md transition-transform duration-300 group-hover:scale-105 select-none animate-bounce-soft`}>
            {currentMood.emoji}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
          </span>
        </div>

        {/* Content & Speech */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1">
              Alex <span className="text-xs font-normal text-slate-400">· Study Buddy</span>
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {currentMood.badge}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {customMessage || currentMood.tagline}
          </p>

          {/* Motivational rotating quote */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] text-brand-600 dark:text-brand-400 italic">
            <Sparkles className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{MOTIVATIONAL_NUDGES[nudgeIndex]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
