import React, { useState } from 'react';
import {
  FileText,
  Zap,
  Scale,
  Sparkles,
  Download,
  BookMarked,
  Check,
  Microscope,
} from 'lucide-react';
import { generateSummary } from '../api/client';

const DEPTH_OPTIONS = [
  {
    id: 'Short',
    title: 'Quick Skim',
    badge: '3-5 min read',
    icon: Zap,
    desc: 'High-yield key takeaways, core definitions, and instant memory triggers.',
  },
  {
    id: 'Medium',
    title: 'Balanced Revision',
    badge: '8-10 min read',
    icon: Scale,
    desc: 'Core themes, fundamental methods, key relationships, and essential conclusions.',
  },
  {
    id: 'Detailed',
    title: 'Deep-Dive Guide',
    badge: '15+ min read',
    icon: Microscope,
    desc: 'Exhaustive breakdown: step-by-step processes, nuances, formulas, and full context.',
  },
];

export default function SummaryView({ onSaveNote, setAlexMood }) {
  const [selectedDepth, setSelectedDepth] = useState('Medium');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    if (setAlexMood) setAlexMood('reading');
    try {
      const res = await generateSummary(selectedDepth);
      setSummary(res.summary);
      setIsSaved(false);
      if (setAlexMood) setAlexMood('explaining');
    } catch (err) {
      alert(err.message || 'Failed to generate summary');
      if (setAlexMood) setAlexMood('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    onSaveNote({
      title: `Revision Summary (${selectedDepth})`,
      content: summary,
      tag: 'Summary',
    });
    setIsSaved(true);
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Alex_Revision_Summary_${selectedDepth}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Smart Revision Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transform your lecture slides and textbook notes into a high-yield study sheet.
            </p>
          </div>
        </div>
      </div>

      {/* Depth Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DEPTH_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedDepth === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelectedDepth(opt.id)}
              className={`text-left p-4 rounded-xl border transition-all relative ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {opt.badge}
                </span>
              </div>
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                {opt.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {opt.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium text-xs sm:text-sm hover:bg-brand-700 transition-all shadow-sm shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? 'Alex is brewing your summary...' : 'Generate Revision Sheet'}</span>
        </button>
      </div>

      {/* Generated Summary Area */}
      {summary && (
        <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Revision Notes ({selectedDepth})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaved}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:text-emerald-600"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <BookMarked className="w-3.5 h-3.5" />}
                <span>{isSaved ? 'Saved to Notebook' : 'Save to Notebook'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export (.md)</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-[13px] leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-sans">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}
