import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import api from '../api/client';

export default function AdvisorPortal() {
  const [businesses, setBusinesses] = useState([]);
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/admin/businesses');
        if (!cancelled) setBusinesses(data.businesses || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load businesses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    const copy = [...businesses];
    copy.sort((a, b) => {
      const sa = a.latest_assessment?.score;
      const sb = b.latest_assessment?.score;
      if (sa == null && sb == null) return a.name.localeCompare(b.name);
      if (sa == null) return 1;
      if (sb == null) return -1;
      return sortAsc ? sa - sb : sb - sa;
    });
    return copy;
  }, [businesses, sortAsc]);

  if (loading) {
    return <div className="px-4 py-20 text-center font-mono text-sm text-muted">Loading businesses…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-teal">Advisor portal</p>
          <h1 className="font-display text-3xl font-bold">Business overview</h1>
        </div>
        <button
          type="button"
          onClick={() => setSortAsc((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted transition hover:border-teal/40 hover:text-text"
        >
          <ArrowDownUp size={14} />
          Score {sortAsc ? '↑ low to high' : '↓ high to low'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-ink/40 font-mono text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Assessed</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    No business accounts yet.
                  </td>
                </tr>
              )}
              {sorted.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-ink/30">
                  <td className="px-4 py-3 font-medium text-text">
                    {b.business_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">{b.name}</td>
                  <td className="px-4 py-3 text-muted">{b.email}</td>
                  <td className="px-4 py-3 font-mono text-amber">
                    {b.latest_assessment ? `${b.latest_assessment.score}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-teal">
                    {b.latest_assessment?.level || 'Not assessed'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {b.latest_assessment
                      ? new Date(b.latest_assessment.date).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
