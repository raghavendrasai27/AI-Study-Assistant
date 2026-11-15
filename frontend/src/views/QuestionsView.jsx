import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  Eye,
  EyeOff,
  Download,
  BookMarked,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { generateQuestions } from '../api/client';

export default function QuestionsView({ onSaveNote, setAlexMood }) {
  const [numQuestions, setNumQuestions] = useState(6);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [questionType, setQuestionType] = useState('Mixed');
  const [questionsText, setQuestionsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    if (setAlexMood) setAlexMood('reading');
    try {
      const res = await generateQuestions(numQuestions, difficulty, questionType);
      setQuestionsText(res.questions);
      setIsSaved(false);
      if (setAlexMood) setAlexMood('explaining');
    } catch (err) {
      alert(err.message || 'Failed to generate practice questions');
      if (setAlexMood) setAlexMood('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    onSaveNote({
      title: `Practice Questions (${difficulty} - ${questionType})`,
      content: questionsText,
      tag: 'Practice',
    });
    setIsSaved(true);
  };

  const handleDownload = () => {
    const blob = new Blob([questionsText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Alex_Practice_Questions_${difficulty}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Custom Practice Sets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate exam-style questions with revealable answers & detailed rationales.
          </p>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-xs">
        {/* Count */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Question Count: <span className="text-brand-600 dark:text-brand-400 font-bold">{numQuestions}</span>
          </label>
          <input
            type="range"
            min={3}
            max={15}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full accent-brand-600 cursor-pointer"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Difficulty Level
          </label>
          <div className="flex rounded-lg bg-slate-200/70 dark:bg-slate-700/60 p-0.5">
            {['Mixed', 'Easy', 'Medium', 'Hard'].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-1 text-[11px] rounded-md font-medium transition-all ${
                  difficulty === d
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Question Type */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Question Format
          </label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="Mixed">Mixed (MCQs & Short Answer)</option>
            <option value="Multiple Choice Questions">Multiple Choice Only</option>
            <option value="Short Answer">Short Conceptual Answers</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium text-xs sm:text-sm hover:bg-brand-700 transition-all shadow-sm shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? 'Alex is drafting questions...' : 'Generate Practice Set'}</span>
        </button>
      </div>

      {/* Generated Practice Questions */}
      {questionsText && (
        <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Practice Questions ({difficulty})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaved}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:text-emerald-600"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <BookMarked className="w-3.5 h-3.5" />}
                <span>{isSaved ? 'Saved' : 'Save to Notebook'}</span>
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
            {questionsText}
          </div>
        </div>
      )}
    </div>
  );
}
