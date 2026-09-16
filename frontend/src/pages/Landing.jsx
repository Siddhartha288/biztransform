import { Link } from 'react-router-dom';
import { ArrowRight, Radar, Map, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-3xl">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-teal">
          Small business digital transformation
        </p>
        <h1 className="mb-5 font-display text-4xl font-bold leading-tight text-text sm:text-6xl">
          Know your digital maturity.
          <span className="block text-amber"> Get a plan that fits.</span>
        </h1>
        <p className="mb-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          BizTransform helps small business owners take a short Yes/No assessment, see a clear
          maturity score, and receive an AI-built action roadmap you can start this month.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={isAuthenticated ? '/assessment' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl bg-amber px-5 py-3 text-sm font-semibold text-ink transition hover:bg-amber/90"
          >
            Start assessment <ArrowRight size={16} />
          </Link>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-text transition hover:border-teal/50"
          >
            {isAuthenticated ? 'Go to dashboard' : 'Log in'}
          </Link>
        </div>
      </div>

      <div className="mt-20 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Radar,
            title: 'Visual maturity score',
            body: 'A radar chart across five digital categories — presence, payments, marketing, operations, and data.',
          },
          {
            icon: Map,
            title: 'Personalized roadmap',
            body: 'AI turns your answers into concrete 1–4 week actions aimed at your weakest spots.',
          },
          {
            icon: ShieldCheck,
            title: 'Advisor view',
            body: 'Advisors can see which businesses need support and track their latest scores.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-surface/80 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 text-teal">
              <Icon size={18} />
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
            <p className="text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
