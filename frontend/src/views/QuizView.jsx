import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { generateQuiz } from '../api/client';

export default function QuizView({ setAlexMood }) {
  const [quizSize, setQuizSize] = useState(5);
  const [quiz, setQuiz] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setIsSubmitted(false);
    setUserAnswers({});
    if (setAlexMood) setAlexMood('reading');

    try {
      const res = await generateQuiz(quizSize);
      setQuiz(res.quiz);
      if (setAlexMood) setAlexMood('thinking');
    } catch (err) {
      alert(err.message || 'Failed to generate quiz');
      if (setAlexMood) setAlexMood('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (qIdx, optionKey) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optionKey }));
  };

  const handleSubmit = () => {
    if (Object.keys(userAnswers).length < quiz.length) {
      if (!confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }

    setIsSubmitted(true);
    const correctCount = quiz.filter((q, idx) => userAnswers[idx] === q.correct).length;
    const pct = Math.round((correctCount / quiz.length) * 100);

    if (pct >= 70) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      if (setAlexMood) setAlexMood('celebrating');
    } else {
      if (setAlexMood) setAlexMood('explaining');
    }
  };

  const handleRetake = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    if (setAlexMood) setAlexMood('idle');
  };

  const score = quiz.filter((q, idx) => userAnswers[idx] === q.correct).length;
  const percentage = quiz.length > 0 ? Math.round((score / quiz.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Interactive Self-Test Quiz
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test your recall with dynamic multiple choice questions directly from your notes.
            </p>
          </div>
        </div>

        {/* Generator controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <span>Questions:</span>
            <input
              type="range"
              min={3}
              max={10}
              value={quizSize}
              onChange={(e) => setQuizSize(Number(e.target.value))}
              className="w-24 accent-brand-600"
            />
            <span className="font-bold text-brand-600 dark:text-brand-400">{quizSize}</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-medium text-xs hover:bg-brand-700 transition-all shadow-sm shadow-brand-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Crafting Quiz...' : 'New Quiz'}</span>
          </button>
        </div>
      </div>

      {/* Quiz Content */}
      {quiz.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <Brain className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            Ready to test your knowledge?
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "New Quiz" above to let Alex generate questions based on your uploaded study material.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score banner if submitted */}
          {isSubmitted && (
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              percentage >= 70
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${percentage >= 70 ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base">
                    Score: {score} / {quiz.length} ({percentage}%)
                  </h4>
                  <p className="text-xs opacity-85 mt-0.5">
                    {percentage >= 80
                      ? '🌟 Outstanding! You have mastered these concepts!'
                      : percentage >= 60
                      ? '👍 Solid effort! Review the explanations below to seal the gaps.'
                      : '💪 Great practice run! Go through the explanations and give it another spin.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-4">
            {quiz.map((q, idx) => {
              const selectedOption = userAnswers[idx];
              const isCorrect = isSubmitted && selectedOption === q.correct;
              const isWrong = isSubmitted && selectedOption && selectedOption !== q.correct;

              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : isWrong
                        ? 'border-rose-200 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-start gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs flex-shrink-0 font-bold">
                        {idx + 1}
                      </span>
                      <span>{q.question}</span>
                    </span>

                    {isSubmitted && (
                      <div className="flex-shrink-0">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {Object.entries(q.options).map(([key, text]) => {
                      const isOptionSelected = selectedOption === key;
                      const isOptionCorrect = isSubmitted && key === q.correct;
                      const isOptionWrongSelected = isSubmitted && isOptionSelected && key !== q.correct;

                      return (
                        <button
                          key={key}
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(idx, key)}
                          className={`text-left p-3 rounded-xl border text-xs sm:text-[12.5px] transition-all flex items-center gap-2.5 ${
                            isOptionCorrect
                              ? 'bg-emerald-500 text-white border-emerald-600 font-semibold shadow-2xs'
                              : isOptionWrongSelected
                              ? 'bg-rose-500 text-white border-rose-600 font-semibold shadow-2xs'
                              : isOptionSelected
                              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-900 dark:text-brand-200 border-brand-500 font-medium'
                              : 'bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                            isOptionCorrect || isOptionWrongSelected
                              ? 'bg-white/20 text-white'
                              : isOptionSelected
                              ? 'bg-brand-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            {key}
                          </span>
                          <span className="flex-1">{text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation box when submitted */}
                  {isSubmitted && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11.5px] text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-400 mb-0.5">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Explanation:</span>
                      </div>
                      <p className="leading-relaxed pl-5">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Action */}
          {!isSubmitted && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white font-medium text-xs sm:text-sm hover:bg-brand-700 transition-all shadow-sm shadow-brand-500/25"
              >
                <span>Submit Quiz & View Results</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
