import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Sparkles, RefreshCw } from 'lucide-react';
import api from '../api/client';
import RadarScoreChart from '../components/RadarScoreChart';
import RoadmapCard from '../components/RoadmapCard';
import VendorFinder from '../components/VendorFinder';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [error, setError] = useState('');

  const loadList = useCallback(async () => {
    const { data } = await api.get('/assessments');
    const list = data.assessments || [];
    setAssessments(list);
    const fromQuery = Number(searchParams.get('assessment'));
    const initial =
      (fromQuery && list.find((a) => a.id === fromQuery)?.id) || list[0]?.id || null;
    setSelectedId(initial);
    return initial;
  }, [searchParams]);

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setDetail(null);
      setRoadmap(null);
      return;
    }
    const { data } = await api.get(`/assessments/${id}`);
    setDetail(data);
    try {
      const road = await api.get(`/assessments/${id}/roadmap`);
      setRoadmap(road.data.content);
    } catch {
      setRoadmap(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const id = await loadList();
        if (!cancelled && id) await loadDetail(id);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadList, loadDetail]);

  useEffect(() => {
    if (!selectedId || loading) return;
    loadDetail(selectedId).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load assessment');
    });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateRoadmap = async () => {
    if (!selectedId) return;
    setRoadmapLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/assessments/${selectedId}/roadmap`, {
        force: Boolean(roadmap),
      });
      setRoadmap(data.content);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate roadmap');
    } finally {
      setRoadmapLoading(false);
    }
  };

  const trendData = [...assessments]
    .reverse()
    .map((a) => ({
      date: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: a.score,
    }));

  if (loading) {
    return <div className="px-4 py-20 text-center font-mono text-sm text-muted">Loading dashboard…</div>;
  }

  if (!assessments.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="mb-3 font-display text-3xl font-bold">No assessments yet</h1>
        <p className="mb-6 text-sm text-muted">Take the 15-question quiz to see your maturity score.</p>
        <Link
          to="/assessment"
          className="inline-flex rounded-xl bg-amber px-5 py-3 text-sm font-semibold text-ink"
        >
          Start assessment
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-teal">Maturity dashboard</p>
          <h1 className="font-display text-3xl font-bold">Your digital score</h1>
        </div>
        <Link
          to="/assessment"
          className="rounded-xl border border-border px-4 py-2 text-sm text-muted transition hover:border-amber/40 hover:text-text"
        >
          Retake assessment
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {assessments.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelectedId(a.id)}
            className={`rounded-xl border px-3 py-2 text-left text-xs font-mono transition ${
              selectedId === a.id
                ? 'border-amber bg-amber/10 text-amber'
                : 'border-border text-muted hover:text-text'
            }`}
          >
            {new Date(a.date).toLocaleDateString()} · {a.score}%
          </button>
        ))}
      </div>

      {detail && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-muted">Overall level</p>
                <h2 className="font-display text-2xl font-semibold text-text">{detail.level}</h2>
              </div>
              <p className="font-mono text-4xl font-semibold text-amber">{detail.total_score}</p>
            </div>
            <RadarScoreChart categories={detail.categories || []} />
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(detail.categories || []).map((c) => (
                <div key={c.key || c.label} className="rounded-lg bg-ink/50 px-2 py-2 text-center">
                  <p className="font-mono text-sm text-teal">{c.score}%</p>
                  <p className="truncate text-[10px] text-muted">{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {trendData.length > 1 && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="mb-4 font-display text-lg font-semibold">Score trend</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid stroke="#2A2A42" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: '#9C9BB3', fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#9C9BB3', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: '#1B1B2C',
                          border: '1px solid #2A2A42',
                          borderRadius: 12,
                        }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#F5A623" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">Action roadmap</h3>
                <button
                  type="button"
                  onClick={generateRoadmap}
                  disabled={roadmapLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:bg-amber/90 disabled:opacity-60"
                >
                  {roadmapLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> {roadmap ? 'Regenerate' : 'Generate my roadmap'}
                    </>
                  )}
                </button>
              </div>

              {roadmap ? (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted">{roadmap.intro}</p>
                  <div className="space-y-3">
                    {(roadmap.actions || []).map((action, i) => (
                      <RoadmapCard key={`${action.title}-${i}`} action={action} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Generate a personalized plan based on this assessment&apos;s weak categories.
                </p>
              )}
            </div>

            <VendorFinder />
          </div>
        </div>
      )}
    </div>
  );
}
