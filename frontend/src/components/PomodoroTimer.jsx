import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Flame, Bell } from 'lucide-react';

// Gentle audio bell synthesis via Web Audio API
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {
    // AudioContext blocked or unsupported
  }
}

export default function PomodoroTimer({ onModeChange }) {
  const [isFocus, setIsFocus] = useState(true);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      playChime();
      if (isFocus) {
        setSessionsCompleted((prev) => prev + 1);
        setIsFocus(false);
        setTimeLeft(5 * 60);
        if (onModeChange) onModeChange('resting');
      } else {
        setIsFocus(true);
        setTimeLeft(25 * 60);
        if (onModeChange) onModeChange('idle');
      }
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isFocus, onModeChange]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (!isActive && onModeChange) {
      onModeChange(isFocus ? 'thinking' : 'resting');
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isFocus ? 25 * 60 : 5 * 60);
  };

  const switchMode = (focusMode) => {
    setIsFocus(focusMode);
    setIsActive(false);
    setTimeLeft(focusMode ? 25 * 60 : 5 * 60);
    if (onModeChange) onModeChange(focusMode ? 'idle' : 'resting');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = isFocus ? 25 * 60 : 5 * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 dark:text-slate-200">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span>Study Sprint</span>
          {sessionsCompleted > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-[10px]">
              {sessionsCompleted} 🔥
            </span>
          )}
        </div>

        {/* Mode switcher tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-[11px]">
          <button
            onClick={() => switchMode(true)}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
              isFocus
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Focus (25m)
          </button>
          <button
            onClick={() => switchMode(false)}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
              !isFocus
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Break (5m)
          </button>
        </div>
      </div>

      {/* Timer display & progress */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-3xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
            {formattedTime}
          </div>
          <p className="text-[11px] text-slate-400">
            {isFocus ? (isActive ? '🎯 Stay locked in!' : 'Ready when you are') : '🧘 Relax your eyes & hydrate'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTimer}
            className={`p-2.5 rounded-xl font-medium shadow-sm transition-all ${
              isActive
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
            title={isActive ? 'Pause' : 'Start'}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
          <button
            onClick={resetTimer}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isFocus ? 'bg-brand-500' : 'bg-amber-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
