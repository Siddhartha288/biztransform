import { Check, X } from 'lucide-react';

export default function QuestionCard({
  question,
  categoryLabel,
  current,
  total,
  onAnswer,
  answering,
}) {
  const progress = total ? Math.round((current / total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-xl rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-mono text-muted">
          <span>{categoryLabel}</span>
          <span>
            {current} / {total}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal to-amber transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="mb-8 font-display text-xl font-semibold leading-snug text-text sm:text-2xl">
        {question}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={answering}
          onClick={() => onAnswer(1)}
          className="flex items-center justify-center gap-2 rounded-xl border border-teal/40 bg-teal/10 px-4 py-4 text-sm font-semibold text-teal transition hover:bg-teal/20 disabled:opacity-50"
        >
          <Check size={18} /> Yes
        </button>
        <button
          type="button"
          disabled={answering}
          onClick={() => onAnswer(0)}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-ink/60 px-4 py-4 text-sm font-semibold text-muted transition hover:border-amber/40 hover:text-text disabled:opacity-50"
        >
          <X size={18} /> No
        </button>
      </div>
    </div>
  );
}
