import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import QuestionCard from '../components/QuestionCard';

export default function Assessment() {
  const navigate = useNavigate();
  const [flatQuestions, setFlatQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/questions');
        const flat = [];
        for (const cat of data.categories || []) {
          for (const q of cat.questions || []) {
            flat.push({
              id: q.id,
              text: q.text,
              categoryLabel: cat.label,
            });
          }
        }
        if (!cancelled) setFlatQuestions(flat);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load questions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = flatQuestions[index];
  const progressLabel = useMemo(
    () => ({ current: index + 1, total: flatQuestions.length }),
    [index, flatQuestions.length]
  );

  const finish = async (finalAnswers) => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/assessments', { responses: finalAnswers });
      navigate(`/dashboard?assessment=${data.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const onAnswer = async (answer) => {
    if (!current || submitting) return;
    const nextAnswers = [...answers, { question_id: current.id, answer }];
    setAnswers(nextAnswers);

    if (index + 1 >= flatQuestions.length) {
      await finish(nextAnswers);
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-20 text-center font-mono text-sm text-muted">Loading questions…</div>
    );
  }

  if (error && !current) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-red-300">{error}</div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-teal">15 questions</p>
        <h1 className="font-display text-3xl font-bold">Digital maturity assessment</h1>
        <p className="mt-2 text-sm text-muted">Answer Yes or No — about 3 minutes.</p>
      </div>

      {error && (
        <div className="mx-auto mb-4 max-w-xl rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {current && (
        <QuestionCard
          question={current.text}
          categoryLabel={current.categoryLabel}
          current={progressLabel.current}
          total={progressLabel.total}
          onAnswer={onAnswer}
          answering={submitting}
        />
      )}
    </div>
  );
}
