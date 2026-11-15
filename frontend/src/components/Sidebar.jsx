import React, { useRef, useState } from 'react';
import {
  MessageSquare,
  FileText,
  HelpCircle,
  Brain,
  Layers,
  BookOpen,
  UploadCloud,
  File,
  X,
  Sparkles,
  Zap,
  Coffee,
  GraduationCap
} from 'lucide-react';
import AlexCompanion from './AlexCompanion';
import PomodoroTimer from './PomodoroTimer';

const MODES = [
  { id: 'chat', label: 'Chat with Alex', icon: MessageSquare, badge: 'Popular' },
  { id: 'summary', label: 'Smart Summary', icon: FileText },
  { id: 'questions', label: 'Practice Sets', icon: HelpCircle },
  { id: 'quiz', label: 'Interactive Quiz', icon: Brain, badge: 'Scored' },
  { id: 'flashcards', label: 'Flashcard Deck', icon: Layers, badge: 'Active Recall' },
  { id: 'notebook', label: 'Revision Notes', icon: BookOpen },
];

const PERSONAS = [
  { id: 'chill_buddy', name: 'Chill Buddy', icon: Coffee, desc: 'Warm, relatable analogies & plain speak' },
  { id: 'exam_coach', name: 'Exam Coach', icon: Zap, desc: 'High-yield traps, mnemonics & speed' },
  { id: 'socratic_mentor', name: 'Socratic Mentor', icon: GraduationCap, desc: 'Guiding questions & deep intuition' },
];

export default function Sidebar({
  activeMode,
  setActiveMode,
  persona,
  setPersona,
  onUpload,
  isUploading,
  status,
  alexMood,
  setAlexMood,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (pdfFiles.length > 0) {
      onUpload(pdfFiles);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-5">
      {/* 1. Alex Companion Avatar */}
      <AlexCompanion mood={alexMood} />

      {/* 2. Document Upload Dropzone */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Study Materials (PDF)
          </span>
          {status?.file_names?.length > 0 && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {status.file_names.length} file(s) loaded
            </span>
          )}
        </div>

        {/* Dropzone area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-brand-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <UploadCloud className="w-6 h-6 mx-auto mb-1 text-slate-400 dark:text-slate-500" />
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
            {isUploading ? '📖 Ingesting PDF notes...' : 'Drop lecture slides or PDFs here'}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            or click to browse files
          </p>
        </div>

        {/* Loaded files list */}
        {status?.file_names?.length > 0 && (
          <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
            {status.file_names.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300"
              >
                <File className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                <span className="truncate flex-1 font-medium">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Study Mode Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Study Modes
        </div>
        <nav className="space-y-1 mt-1">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                  <span>{mode.label}</span>
                </div>
                {mode.badge && (
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60'
                    }`}
                  >
                    {mode.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Alex Personality Persona Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Alex's Persona
          </span>
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
        </div>
        <div className="space-y-1.5">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const isSelected = persona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`w-full text-left p-2 rounded-xl transition-all border ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 shadow-xs'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                  <span className="font-semibold text-xs">{p.name}</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 ml-5.5 leading-tight">
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Pomodoro Focus Timer */}
      <PomodoroTimer onModeChange={setAlexMood} />
    </aside>
  );
}
