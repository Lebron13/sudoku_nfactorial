'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDailyLeaderboard, getGlobalLeaderboard } from '@/lib/leaderboard';
import ThemeToggle from '@/components/ThemeToggle';
import { useLang } from '@/lib/i18n';
import LangToggle from '@/components/LangToggle';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function rankColor(rank: number): string {
  if (rank === 1) return '#e8c060';
  if (rank === 2) return '#a0a8b0';
  if (rank === 3) return '#c07050';
  return 'rgba(255,255,255,.38)';
}

const DIFF_COLOR: Record<string, string> = {
  easy: 'rgba(100,255,160,0.8)',
  medium: 'rgba(106,176,255,0.8)',
  hard: 'rgba(255,180,100,0.8)',
  expert: 'rgba(255,110,180,0.8)',
  daily: 'rgba(176,106,255,0.8)',
};

const DIFF_FILTERS = ['all', 'easy', 'medium', 'hard', 'expert'] as const;
type DiffFilter = typeof DIFF_FILTERS[number];

type ScoreRow = {
  display_name: string;
  city: string;
  time_seconds: number;
  mistakes: number;
  stars: number;
  difficulty?: string;
  completed_at: string;
};

// ─── page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const router = useRouter();
  const { t } = useLang();
  const [tab, setTab] = useState<'today' | 'all'>('today');
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      const data = tab === 'today'
        ? await getDailyLeaderboard()
        : await getGlobalLeaderboard(diffFilter === 'all' ? undefined : diffFilter);
      setRows(data as ScoreRow[]);
      setLoading(false);
    };
    load();
  }, [tab, diffFilter]);

  const irisLine: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 1,
    background: 'linear-gradient(90deg, transparent, #ff6eb4 20%, #b06aff 40%, #6ab0ff 60%, #6affd4 80%, transparent)',
    backgroundSize: '200% 100%',
    animation: 'iris 4s linear infinite',
    opacity: 0.5,
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header style={{
        height: 64, padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50,
      } as React.CSSProperties}>
        <span
          onClick={() => router.push('/')}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
          style={{ fontSize: 13, color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-dm)', fontWeight: 300, transition: 'color .2s', minWidth: 80 }}
        >
          ← Back
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 18, color: 'var(--text)', lineHeight: 1 }}>ZenSudoku</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-dm)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('nav_leaderboard')}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 80 }}>
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: 'var(--font-dm)', fontWeight: 300, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 1, background: 'rgba(255,110,180,.55)', display: 'inline-block' }} />
            {t('lb_label')}
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 36, fontWeight: 400, color: 'var(--text)', lineHeight: 1.1, marginBottom: 6 }}>
            {t('nav_leaderboard')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}>
            The fastest solvers across every difficulty, updated in real time.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 4 }}>
            {([['today', t('lb_tab_today')], ['all', t('lb_tab_alltime')]] as [string, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTab(val as 'today' | 'all')}
                style={{
                  padding: '6px 18px', borderRadius: 8, fontSize: 12,
                  fontFamily: 'var(--font-dm)', cursor: 'pointer', transition: 'all .2s',
                  background: tab === val ? 'rgba(255,110,180,.12)' : 'transparent',
                  color: tab === val ? '#ff6eb4' : 'rgba(255,255,255,.38)',
                  border: tab === val ? '1px solid rgba(255,110,180,.2)' : '1px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Difficulty filter (All Time only) */}
          {tab === 'all' && (
            <div style={{ display: 'inline-flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, gap: 2 }}>
              {DIFF_FILTERS.map(d => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11,
                    fontFamily: 'var(--font-dm)', cursor: 'pointer', transition: 'all .2s',
                    background: diffFilter === d ? 'rgba(255,255,255,.08)' : 'transparent',
                    color: diffFilter === d ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.35)',
                    border: diffFilter === d ? '1px solid rgba(255,255,255,.12)' : '1px solid transparent',
                    textTransform: 'capitalize', whiteSpace: 'nowrap',
                  }}
                >
                  {d === 'all' ? 'All' : d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', minHeight: 160 }}>
          <div style={irisLine} />

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto auto auto', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            {['#', t('lb_col_player').toUpperCase(), t('lb_col_time').toUpperCase(), '★', tab === 'all' ? 'DIFF' : 'MISTAKES'].map(h => (
              <div key={h} style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-dm)' }}>{h}</div>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,110,180,0.7)', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--text-faint)', fontFamily: 'var(--font-dm)' }}>Loading…</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && rows.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 10, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, color: 'var(--text-muted)' }}>No scores yet.</div>
              <div style={{ fontSize: 13, color: 'var(--text-faint)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}>
                {tab === 'today' ? 'Be the first to solve today\'s puzzle.' : 'Play a game to appear here.'}
              </div>
            </div>
          )}

          {/* Rows */}
          {!loading && rows.map((row, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'grid', gridTemplateColumns: '44px 1fr auto auto auto', gap: 12,
                padding: '15px 20px',
                borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                background: hoveredRow === i ? 'rgba(255,255,255,.025)' : 'transparent',
                transition: 'background .2s', alignItems: 'center',
              }}
            >
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 15, color: rankColor(i + 1) }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-dm)' }}>
                  {row.display_name || 'Anonymous'}
                </div>
                {row.city ? (
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-dm)', marginTop: 1 }}>{row.city}</div>
                ) : null}
              </div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 15, color: 'var(--text)' }}>
                {fmt(row.time_seconds)}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,200,80,.5)', letterSpacing: 2, fontFamily: 'var(--font-dm)' }}>
                {row.stars === 3 ? '★★★' : row.stars === 2 ? '★★☆' : '★☆☆'}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-dm)', color: tab === 'all' && row.difficulty ? (DIFF_COLOR[row.difficulty] ?? 'rgba(255,255,255,.4)') : 'rgba(255,255,255,.4)', textTransform: 'capitalize' }}>
                {tab === 'all' ? (row.difficulty ?? '—') : (row.mistakes === 0 ? 'Perfect' : `${row.mistakes} err`)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <button
            onClick={() => router.push('/game/easy')}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.85)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.92)')}
            style={{ padding: '13px 32px', borderRadius: 100, background: 'rgba(255,255,255,0.92)', color: '#080808', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 400, transition: 'background .2s', marginRight: 10 }}
          >
            Start playing
          </button>
          <button
            onClick={() => router.push('/daily')}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'); (e.currentTarget.style.color = 'rgba(255,255,255,0.9)'); }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'); (e.currentTarget.style.color = 'rgba(255,255,255,0.7)'); }}
            style={{ padding: '13px 32px', borderRadius: 100, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 300, transition: 'border-color .2s, color .2s' }}
          >
            Today&apos;s puzzle →
          </button>
        </div>
      </main>

      <style>{`
        @keyframes iris { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
