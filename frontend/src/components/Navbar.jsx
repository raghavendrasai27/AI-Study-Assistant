import React from 'react';
import {
  GraduationCap,
  FileText,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function Navbar({
  status,
  darkMode,
  setDarkMode,
  onReset,
  voiceEnabled,
  setVoiceEnabled,
}) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                Alex
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                AI Study Buddy
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive course companion & peer mentor
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Document Status Pill */}
          {status?.is_loaded ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <FileText className="w-3.5 h-3.5" />
              <span>{status.file_names?.length || 1} Document(s) active</span>
              <span className="text-emerald-500/70">·</span>
              <span className="text-[11px] opacity-80">{status.chunk_count} chunks</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Upload notes to begin</span>
            </div>
          )}

          {/* Voice Output Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-xl transition-all border ${
              voiceEnabled
                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 border-brand-200 dark:border-brand-800 shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={voiceEnabled ? 'Voice read-aloud active' : 'Enable voice read-aloud'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Reset Session */}
          {status?.is_loaded && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
              title="Clear all documents & chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
