'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ZenMascot } from '@/components/ZenMascot'
import ThemeToggle from '@/components/ThemeToggle'
import { useLang } from '@/lib/i18n'
import LangToggle from '@/components/LangToggle'

// ─── Style constants ──────────────────────────────────────────────────────────

const glass: CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
}

const irisLine: CSSProperties = {
  height: 1,
  background: 'linear-gradient(90deg,transparent,#ff6eb4 20%,#b06aff 40%,#6ab0ff 60%,#6affd4 80%,transparent)',
  backgroundSize: '200% 100%',
  animation: 'iris 4s linear infinite',
  opacity: 0.45,
}

const irisLineSubtle: CSSProperties = {
  ...irisLine,
  opacity: 1,
  background: 'linear-gradient(90deg,transparent,rgba(255,110,180,.28) 25%,rgba(176,106,255,.22) 50%,rgba(106,176,255,.22) 75%,transparent)',
}

const sectionStyle: CSSProperties = { padding: '96px 48px', background: 'var(--bg)' }

const labelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,.45)',
  fontWeight: 300,
  marginBottom: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  'Daily puzzle live',
  'AI Coach · Powered by Claude',
  '3,241 players online',
  'Puzzle #247 · Hard',
  'Global leaderboard',
  'Senior mode available',
]

const DIFF_CARDS = [
  { key: 'easy',   name: 'Easy',   href: '/game/easy',   color: 'rgba(100,255,160,1)', avg: 'avg 4 min',  fill: 25,  topLine: 'rgba(100,255,160,.6)' },
  { key: 'medium', name: 'Medium', href: '/game/medium', color: 'rgba(106,176,255,1)', avg: 'avg 12 min', fill: 50,  topLine: 'rgba(106,176,255,.6)' },
  { key: 'hard',   name: 'Hard',   href: '/game/hard',   color: 'rgba(255,180,100,1)', avg: 'avg 24 min', fill: 75,  topLine: 'rgba(255,180,100,.6)' },
  { key: 'expert', name: 'Expert', href: '/game/expert', color: 'rgba(255,110,180,1)', avg: 'avg 45 min', fill: 100, topLine: 'rgba(255,110,180,.7)' },
]

const LEADERBOARD_ROWS = [
  { rank: 1, name: 'Arman K.',  city: 'Almaty, KZ',   time: '3:41', stars: 3 },
  { rank: 2, name: 'Sofia M.',  city: 'Istanbul, TR',  time: '4:12', stars: 3 },
  { rank: 3, name: 'James W.',  city: 'London, UK',    time: '4:58', stars: 3 },
  { rank: 4, name: 'Yuki T.',   city: 'Tokyo, JP',     time: '5:03', stars: 2 },
  { rank: 5, name: 'Layla H.',  city: 'Dubai, AE',     time: '5:44', stars: 2 },
]

// PRO_FEATURES now uses translations — removed

const TABS = ['Today', 'All time', 'By city']

const DEMO_QUESTIONS = [
  "Why does 7 go in row 3, col 5?",
  "What strategy should I use here?",
  "What is X-Wing technique?",
]

const DEMO_ANSWERS = [
  "The top-right 3×3 box already has a 7, eliminating that column. In row 3, columns 1, 4, and 8 are taken — leaving only one valid cell.",
  "Look for naked singles first — cells where only one number can go. Then scan each row and column for hidden singles.",
  "The X-Wing pattern appears when the same candidate appears in exactly two cells across two rows — you can eliminate it from those columns.",
]

function rankColor(rank: number): string {
  if (rank === 1) return '#e8c060'
  if (rank === 2) return '#a0a8b0'
  if (rank === 3) return '#c07050'
  return 'rgba(255,255,255,.38)'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const { t } = useLang()
  const DIFF_NAMES: Record<string, 'diff_easy' | 'diff_medium' | 'diff_hard' | 'diff_expert'> = {
    easy: 'diff_easy', medium: 'diff_medium', hard: 'diff_hard', expert: 'diff_expert',
  }
  const [activeTab, setActiveTab] = useState('Today')
  const [hovered, setHovered] = useState<string | null>(null)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [time, setTime] = useState({ h: '00', m: '00', s: '00' })
  const [qIndex, setQIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const handler = () => {
      const nav = document.getElementById('main-nav')
      if (!nav) return
      const s = nav.style as CSSStyleDeclaration & { WebkitBackdropFilter: string }
      if (window.scrollY > 60) {
        s.background = 'rgba(8,8,8,0.7)'
        s.backdropFilter = 'blur(32px) saturate(180%)'
        s.WebkitBackdropFilter = 'blur(32px) saturate(180%)'
      } else {
        s.background = 'rgba(255,255,255,0.08)'
        s.backdropFilter = 'blur(24px) saturate(180%)'
        s.WebkitBackdropFilter = 'blur(24px) saturate(180%)'
      }
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (charIndex < DEMO_ANSWERS[qIndex].length) {
      const t = setTimeout(() => {
        setDisplayed(prev => prev + DEMO_ANSWERS[qIndex][charIndex])
        setCharIndex(c => c + 1)
      }, 22)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        const next = (qIndex + 1) % DEMO_ANSWERS.length
        setQIndex(next)
        setDisplayed('')
        setCharIndex(0)
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [charIndex, qIndex])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.max(0, midnight.getTime() - now.getTime())
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTime({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section data-hero style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>

        <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6) saturate(1.3)' }}>
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_34FE3svcl12b2mgx7SoGywRHsRw/hf_20260422_073929_65bbacae-dad3-4257-b8cc-316a7b2e5415.mp4" type="video/mp4" />
        </video>

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.7) 100%)' }} />

        <nav
          id="main-nav"
          style={{ position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.12)', transition: 'background .3s, backdrop-filter .3s' }}
        >
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 19, color: '#fff', cursor: 'pointer' }} onClick={() => router.push('/')}>
            ZenSudoku <span style={{ fontStyle: 'italic', fontSize: 11, opacity: 0.55, fontFamily: 'var(--font-dm)', letterSpacing: '0.1em' }}>✦ PRO</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {([
              { label: t('nav_daily'),       action: () => router.push('/daily') },
              { label: t('nav_leaderboard'), action: () => router.push('/leaderboard') },
              { label: t('nav_stats'),       action: () => router.push('/stats') },
            ] as const).map(({ label, action }) => (
              <span
                key={label}
                onClick={action}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,.95)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.6)')}
                className={label === t('nav_stats') ? 'nav-link-hideable' : undefined}
                style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm)', fontWeight: 300, cursor: 'pointer', transition: 'color .18s' }}
              >
                {label}
              </span>
            ))}
            <ThemeToggle />
            <LangToggle />

            {user ? (
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setShowUserMenu(p => !p)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(255,110,180,0.15)',
                    border: '1px solid rgba(255,110,180,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: '#ff6eb4', cursor: 'pointer',
                    fontFamily: 'var(--font-dm)',
                  }}
                  title={user.email}
                >
                  {user.email?.[0].toUpperCase()}
                </div>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 44, right: 0,
                    background: 'rgba(12,12,12,0.98)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, padding: 6, minWidth: 140,
                    backdropFilter: 'blur(20px)', zIndex: 200,
                  }}>
                    <div
                      onClick={() => { router.push('/stats'); setShowUserMenu(false) }}
                      style={{ padding: '9px 14px', fontSize: 13, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', borderRadius: 8, transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >My Stats</div>
                    <div
                      onClick={async () => { await supabase.auth.signOut(); setUser(null); setShowUserMenu(false) }}
                      style={{ padding: '9px 14px', fontSize: 13, color: 'rgba(255,100,100,0.7)', cursor: 'pointer', borderRadius: 8, transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,60,60,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >Sign out</div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/auth')}
                style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.75)',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '7px 18px', borderRadius: 100,
                  cursor: 'pointer', fontFamily: 'var(--font-dm)',
                  fontWeight: 300, letterSpacing: '.04em',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,110,180,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255,110,180,0.3)'
                  e.currentTarget.style.color = '#ff6eb4'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                }}
              >
                {t('nav_signin')}
              </button>
            )}

            <button
              onClick={() => document.getElementById('pro')?.scrollIntoView({ behavior: 'smooth' })}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,110,180,.18)'; e.currentTarget.style.borderColor = 'rgba(255,110,180,.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', padding: '7px 18px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.22)', cursor: 'pointer', fontFamily: 'var(--font-dm)', letterSpacing: '0.06em', transition: 'background .2s, border-color .2s' }}
            >
              {t('nav_upgrade')} ✦
            </button>
          </div>
        </nav>

        <div className="hero-content" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', paddingTop: 100 }}>
          <div data-hero-content style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Left text */}
            <div>
              <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-dm)', fontWeight: 300, display: 'block', marginBottom: 14 }}>{t('hero_badge')}</span>
              <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 72, fontWeight: 400, color: '#fff', lineHeight: 1.05, marginBottom: 14 }}>
                {t('hero_title_1')}<br /><em>{t('hero_title_2')}</em>
              </h1>
              <p style={{ fontSize: 16, fontWeight: 300, color: 'rgba(255,255,255,0.55)', marginBottom: 28, maxWidth: 460, lineHeight: 1.65, fontFamily: 'var(--font-dm)' }}>
                {t('hero_subtitle')}
              </p>
              <div data-hero-actions style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => router.push('/game/easy')} style={{ background: 'rgba(255,255,255,0.92)', color: '#111', border: 'none', padding: '13px 26px', fontSize: 13, borderRadius: 100, cursor: 'pointer', fontFamily: 'var(--font-dm)' }}>{t('hero_start')}</button>
                <button onClick={() => router.push('/daily')} style={{ color: 'rgba(255,255,255,0.85)', padding: '13px 26px', fontSize: 13, borderRadius: 100, cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 300, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.18)' }}>{t('hero_daily_cta')} →</button>
                <button
                  onClick={() => router.push('/tutorial')}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,110,180,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,110,180,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,110,180,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,110,180,0.25)' }}
                  style={{ color: 'rgba(255,255,255,0.85)', padding: '13px 26px', fontSize: 13, borderRadius: 100, cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 300, background: 'rgba(255,110,180,0.1)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,110,180,0.25)', transition: 'all .2s' }}
                >✨ {t('hero_tutorial')}</button>
              </div>
            </div>

            {/* Right cards */}
            <div data-hero-right className="hero-right" style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 240 }}>
              {/* #247 / Daily puzzle card */}
              <div
                onClick={() => router.push('/daily')}
                onMouseEnter={() => setHovered('hero-1')}
                onMouseLeave={() => setHovered(null)}
                style={{ padding: '20px 28px', borderRadius: 18, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)', border: hovered === 'hero-1' ? '1px solid rgba(255,255,255,.28)' : '1px solid rgba(255,255,255,0.15)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'border-color .2s' }}
              >
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 38, color: '#fff', lineHeight: 1 }}>#247</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-dm)', marginTop: 4 }}>{t('hero_chip_daily')}</div>
              </div>

              {/* AI Coach card */}
              <div
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                onMouseEnter={() => setHovered('hero-2')}
                onMouseLeave={() => setHovered(null)}
                style={{ padding: '20px 28px', borderRadius: 18, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)', border: hovered === 'hero-2' ? '1px solid rgba(255,255,255,.28)' : '1px solid rgba(255,255,255,0.15)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'border-color .2s' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(100,255,160,0.9)', boxShadow: '0 0 8px rgba(100,255,160,0.6)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-dm)', fontWeight: 400 }}>{t('hero_chip_coach')}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-dm)' }}>{t('hero_chip_powered')}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 1: Ticker ────────────────────────────────────────────── */}
      <div style={{ overflow: 'hidden', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '18px 0', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', gap: 48, width: 'max-content', animation: 'ticker 18s linear infinite' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div
              key={i}
              onClick={item === 'Daily puzzle live' ? () => router.push('/daily') : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', whiteSpace: 'nowrap', fontFamily: 'var(--font-dm)', fontWeight: 300, cursor: item === 'Daily puzzle live' ? 'pointer' : 'default' }}
            >
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,110,180,.45)', display: 'inline-block', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Difficulty ─────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={irisLine} />
        <div style={{ ...labelStyle, marginTop: 48 }} className="reveal">
          <span style={{ width: 14, height: 1, background: 'rgba(255,110,180,.55)', display: 'inline-block' }} />
          {t('diff_label')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
          {DIFF_CARDS.map((card, i) => (
            <Link
              key={card.key}
              href={card.href}
              style={{
                ...glass,
                position: 'relative',
                overflow: 'hidden',
                padding: '32px 28px',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'border .25s, transform .25s',
                border: hovered === `diff-${card.key}` ? '1px solid rgba(255,255,255,.16)' : '1px solid rgba(255,255,255,.07)',
                transform: hovered === `diff-${card.key}` ? 'translateY(-3px)' : 'translateY(0)',
              }}
              className={`reveal d${i + 1}`}
              onMouseEnter={() => setHovered(`diff-${card.key}`)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Per-card iridescent top line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${card.topLine} 50%, transparent)`, backgroundSize: '200% 100%', animation: 'iris 4s linear infinite' }} />

              {/* Dot */}
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: card.color, boxShadow: `0 0 8px ${card.color}`, marginBottom: 22 }} />

              {/* Name */}
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 24, color: '#fff', marginBottom: 4 }}>{t(DIFF_NAMES[card.key])}</div>

              {/* Avg time */}
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-dm)', fontWeight: 300, marginBottom: 16 }}>{card.avg}</div>

              {/* Fill track */}
              <div style={{ height: 2, background: 'rgba(255,255,255,.07)', borderRadius: 1, marginBottom: 20 }}>
                <div style={{
                  width: `${card.fill}%`,
                  height: '100%',
                  borderRadius: 1,
                  background: card.fill === 100
                    ? 'linear-gradient(90deg, rgba(255,110,180,1), rgba(176,106,255,1))'
                    : card.color,
                }} />
              </div>

              {/* CTA */}
              <div style={{ fontSize: 13, color: hovered === `diff-${card.key}` ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.45)', transition: 'color .2s', fontFamily: 'var(--font-dm)', marginTop: 'auto' }}>
                {t('diff_start')}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Tutorial CTA ─────────────────────────────────────────────────── */}
      <section className="sec reveal" id="tutorial-cta" style={{ padding: '80px 48px' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)',
          padding: 56, display: 'grid', gridTemplateColumns: '180px 1fr auto',
          gap: 36, alignItems: 'center',
          background: 'rgba(255,255,255,0.015)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg,transparent,#ff6eb4,#b06aff,#6ab0ff,transparent)',
            backgroundSize: '200% 100%', animation: 'iris 4s linear infinite',
          }} />
          <div style={{ animation: 'zenFloat 3.5s ease-in-out infinite' }}>
            <ZenMascot size={160} mood="happy" />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(255,110,180,0.7)', marginBottom: 12, fontWeight: 300 }}>
              {t('tut_badge')}
            </div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 38, fontWeight: 400, lineHeight: 1.1, marginBottom: 12, color: '#fff' }}>
              {t('tut_title_1')} <em style={{ color: '#ff6eb4', fontStyle: 'italic', fontWeight: 400 }}>{t('tut_title_2')}</em>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 300, lineHeight: 1.7, maxWidth: 420 }}>
              {t('tut_subtitle')}
            </p>
          </div>
          <button
            onClick={() => router.push('/tutorial')}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            style={{
              padding: '14px 28px', borderRadius: 100,
              background: 'rgba(255,255,255,0.92)', color: '#080808',
              border: 'none', fontSize: 14, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              whiteSpace: 'nowrap', transition: 'opacity .2s',
            }}
          >{t('tut_start')}</button>
        </div>
      </section>

      {/* ── Section 3: Features ───────────────────────────────────────────── */}
      <section id="features" style={sectionStyle}>
        <div style={irisLineSubtle} />
        <div style={{ ...labelStyle, marginTop: 48 }} className="reveal">
          <span style={{ width: 14, height: 1, background: 'rgba(255,110,180,.55)', display: 'inline-block' }} />
          {t('feat_label')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>

          {/* Big card — AI Coach (spans 2 cols) */}
          <div style={{ ...glass, gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 16, overflow: 'hidden' }} className="reveal d1">
            {/* Left half */}
            <div style={{ padding: 36, borderRight: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 16 }}>
                🧠
              </div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, color: '#fff', marginBottom: 10 }}>{t('feat_coach_title')}</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.58)', lineHeight: 1.7, marginBottom: 20, fontFamily: 'var(--font-dm)', fontWeight: 300 }}>
                {t('feat_coach_desc')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Naked pairs', 'X-Wing', 'Swordfish', 'Pointing pairs', 'Hidden singles'].map(tag => (
                  <span key={tag} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.3)', fontFamily: 'var(--font-dm)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right half — Live demo */}
            <div style={{ padding: 36, background: 'rgba(255,255,255,.015)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,110,180,.5)', letterSpacing: '.15em', textTransform: 'uppercase', fontFamily: 'var(--font-dm)', marginBottom: 18 }}>
                {t('feat_live_demo')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(255,255,255,.07)' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,110,180,.7)', fontFamily: 'var(--font-dm)', marginBottom: 8 }}>
                    {DEMO_QUESTIONS[qIndex]}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontFamily: 'var(--font-dm)', fontWeight: 300, lineHeight: 1.6 }}>
                    {displayed}
                    {charIndex < DEMO_ANSWERS[qIndex].length && (
                      <span style={{ display: 'inline-block', width: 1.5, height: 12, background: 'rgba(255,110,180,.9)', animation: 'pulse 1s infinite', verticalAlign: 'middle', marginLeft: 1 }} />
                    )}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(255,255,255,.07)', opacity: 0.4 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', fontFamily: 'var(--font-dm)' }}>
                    {DEMO_QUESTIONS[(qIndex + 1) % DEMO_QUESTIONS.length]}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Small card: Notes mode */}
          <div
            style={{ ...glass, position: 'relative', overflow: 'hidden', padding: 32, borderRadius: 16 }}
            className="reveal d2"
            onMouseEnter={() => setHovered('feat-notes')}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,110,180,.6) 30%, rgba(176,106,255,.5) 70%, transparent)', backgroundSize: '200% 100%', animation: 'iris 4s linear infinite', opacity: hovered === 'feat-notes' ? 1 : 0, transition: 'opacity .3s' }} />
            <div style={{ fontSize: 20, marginBottom: 16 }}>📓</div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 18, color: '#fff', marginBottom: 10 }}>{t('feat_notes_title')}</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.58)', lineHeight: 1.7, fontFamily: 'var(--font-dm)', fontWeight: 300 }}>
              {t('feat_notes_desc')}
            </p>
          </div>

          {/* Small card: Undo history */}
          <div
            style={{ ...glass, position: 'relative', overflow: 'hidden', padding: 32, borderRadius: 16 }}
            className="reveal d3"
            onMouseEnter={() => setHovered('feat-undo')}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(106,176,255,.6) 30%, rgba(100,255,200,.5) 70%, transparent)', backgroundSize: '200% 100%', animation: 'iris 4s linear infinite', opacity: hovered === 'feat-undo' ? 1 : 0, transition: 'opacity .3s' }} />
            <div style={{ fontSize: 20, marginBottom: 16 }}>↩</div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 18, color: '#fff', marginBottom: 10 }}>{t('feat_undo_title')}</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.58)', lineHeight: 1.7, fontFamily: 'var(--font-dm)', fontWeight: 300 }}>
              {t('feat_undo_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4: Leaderboard ────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={irisLine} />
        <div style={{ ...labelStyle, marginTop: 48 }} className="reveal">
          <span style={{ width: 14, height: 1, background: 'rgba(255,110,180,.55)', display: 'inline-block' }} />
          {t('lb_label')}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 4, marginTop: 10, marginBottom: 32 }} className="reveal d1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-dm)',
                cursor: 'pointer',
                transition: 'all .2s',
                background: activeTab === tab ? 'rgba(255,110,180,.12)' : 'transparent',
                color: activeTab === tab ? '#ff6eb4' : 'rgba(255,255,255,.38)',
                border: activeTab === tab ? '1px solid rgba(255,110,180,.2)' : '1px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

          {/* Table */}
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }} className="reveal d2">
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto auto', gap: 12, padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              {['#', 'PLAYER', 'TIME', '★'].map(h => (
                <div key={h} style={{ fontSize: 9, color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-dm)' }}>{h}</div>
              ))}
            </div>
            {LEADERBOARD_ROWS.map((row, i) => (
              <div
                key={row.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr auto auto',
                  gap: 12,
                  padding: '15px 20px',
                  borderBottom: i < LEADERBOARD_ROWS.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                  background: hovered === `row-${row.rank}` ? 'rgba(255,255,255,.025)' : 'transparent',
                  transition: 'background .2s',
                  alignItems: 'center',
                }}
                className={`reveal d${Math.min(i + 1, 4)}`}
                onMouseEnter={() => setHovered(`row-${row.rank}`)}
                onMouseLeave={() => setHovered(null)}
              >
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 15, color: rankColor(row.rank) }}>{row.rank}</div>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', fontFamily: 'var(--font-dm)' }}>{row.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontFamily: 'var(--font-dm)' }}>{row.city}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 15, color: 'rgba(255,255,255,.85)' }}>{row.time}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,200,80,.5)', letterSpacing: 2, fontFamily: 'var(--font-dm)' }}>
                  {row.stars === 3 ? '★★★' : '★★☆'}
                </div>
              </div>
            ))}
          </div>

          {/* Daily challenge card */}
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', padding: 28, position: 'relative', overflow: 'hidden', alignSelf: 'start' }} className="reveal d3">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #ff6eb4 20%, #b06aff 50%, #6ab0ff 80%, transparent)', backgroundSize: '200% 100%', animation: 'iris 4s linear infinite', opacity: 0.6 }} />

            <div style={{ fontSize: 10, color: 'rgba(255,110,180,.55)', letterSpacing: '.15em', textTransform: 'uppercase', fontFamily: 'var(--font-dm)', marginBottom: 12 }}>
              {t('lb_daily')}
            </div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, color: '#fff', marginBottom: 6 }}>Puzzle #247</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', fontFamily: 'var(--font-dm)', fontWeight: 300, marginBottom: 24 }}>Thursday, May 15 · Hard</div>

            {/* Countdown */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 28 }}>
              {(['h', 'm', 's'] as const).map((unit, i) => (
                <div key={unit} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 34, color: '#fff', lineHeight: 1 }}>{time[unit]}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.38)', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-dm)', marginTop: 4 }}>
                      {unit === 'h' ? 'HRS' : unit === 'm' ? 'MIN' : 'SEC'}
                    </div>
                  </div>
                  {i < 2 && (
                    <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 24, color: 'rgba(255,255,255,.15)', marginTop: 4 }}>:</div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => router.push('/daily')} style={{ width: '100%', padding: '12px 0', borderRadius: 100, background: 'rgba(255,255,255,.92)', color: '#111', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm)' }}>
              {t('lb_play_today')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 5: Pro ────────────────────────────────────────────────── */}
      <section id="pro" style={sectionStyle}>
        <div style={irisLineSubtle} />

        <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,.08)', padding: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, position: 'relative', overflow: 'hidden', marginTop: 64 }} className="reveal">
          {/* Animated top border */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #ff6eb4 20%, #b06aff 40%, #6ab0ff 60%, #6affd4 80%, transparent)', backgroundSize: '200% 100%', animation: 'iris 4s linear infinite', opacity: 0.6 }} />

          {/* Subtle radial glow */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, background: 'radial-gradient(circle, rgba(255,110,180,.04), transparent 70%)', pointerEvents: 'none' }} />

          {/* Left */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 20 }}>
              <span style={{ width: 14, height: 1, background: 'rgba(255,110,180,.55)', display: 'inline-block' }} />
              ZenSudoku Pro ✦
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 40, fontWeight: 400, color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>
              {t('pro_title_1')}<br /><em>{t('pro_title_2')}</em>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 32, fontFamily: 'var(--font-dm)', fontWeight: 300, maxWidth: 340 }}>
              {t('pro_subtitle')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(['pro_feat_1','pro_feat_2','pro_feat_3','pro_feat_4','pro_feat_5'] as const).map((key, i) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }} className={`reveal d${Math.min(i + 1, 4)}`}>
                  <div style={{ width: 17, height: 17, borderRadius: '50%', border: '1px solid rgba(255,110,180,.3)', color: 'rgba(255,110,180,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}>{t(key)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — price box */}
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', padding: 36, background: 'rgba(255,255,255,.02)', position: 'relative', overflow: 'hidden', alignSelf: 'start' }} className="reveal d2">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, ...irisLine, opacity: 0.6 }} />
            <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.48)', fontFamily: 'var(--font-dm)', marginBottom: 20 }}>{t('pro_monthly')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 52, color: '#fff', lineHeight: 1 }}>$4.</span>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 26, color: '#fff' }}>99</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.48)', fontFamily: 'var(--font-dm)', marginBottom: 28 }}>{t('pro_per_month')}</div>
            <button style={{ width: '100%', padding: '13px 0', borderRadius: 100, background: 'rgba(255,255,255,.92)', color: '#111', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm)', marginBottom: 12 }}>
              {t('pro_trial')}
            </button>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.38)', textAlign: 'center', fontFamily: 'var(--font-dm)', marginBottom: 20 }}>
              {t('pro_no_card')}
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,.06)', marginBottom: 20 }} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.48)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}>
              $29.99 / {t('pro_yearly')}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,.05)', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.18)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}>
          Built by Valeriya Mukhizinova · nFactorial 2026
        </p>
      </div>

    </div>
  )
}
