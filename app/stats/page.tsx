'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ThemeToggle from '@/components/ThemeToggle'
import { useLang } from '@/lib/i18n'
import LangToggle from '@/components/LangToggle'

type Result = {
  difficulty: string
  time: number
  mistakes: number
  stars?: number
  date: string
  won: boolean
}

export default function StatsPage() {
  const router = useRouter()
  const { t } = useLang()
  const [user, setUser] = useState<any>(null)
  const [results, setResults] = useState<Result[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      if (u) {
        const { data: p } = await supabase.from('profiles')
          .select('*').eq('id', u.id).single()
        setProfile(p)
      }

      const raw = JSON.parse(localStorage.getItem('zen_game_results') || '[]')
      setResults(raw)
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  // Compute stats
  const totalGames = results.length
  const wins = results.filter(r => r.won).length
  const winRate = totalGames > 0 ? Math.round((wins/totalGames)*100) : 0
  const avgTime = wins > 0
    ? Math.round(results.filter(r=>r.won).reduce((a,r)=>a+r.time,0)/wins)
    : 0

  const bestByDiff = ['easy','medium','hard','expert','daily'].map(d => {
    const wonGames = results.filter(r => r.difficulty === d && r.won)
    if (wonGames.length === 0) return { difficulty: d, time: null }
    return { difficulty: d, time: Math.min(...wonGames.map(r => r.time)) }
  })

  // Streak calculation
  const uniqueDays = [...new Set(results.filter(r=>r.won).map(r => r.date.split('T')[0]))].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    streak = 1
    for (let i = 1; i < uniqueDays.length; i++) {
      const expected = new Date(new Date(uniqueDays[i-1]).getTime() - 86400000).toISOString().split('T')[0]
      if (uniqueDays[i] === expected) streak++
      else break
    }
  }

  // Heatmap data — last 84 days (12 weeks)
  const heatmap: { date: string, count: number, won: number }[] = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date(Date.now() - i*86400000).toISOString().split('T')[0]
    const dayGames = results.filter(r => r.date.split('T')[0] === d)
    heatmap.push({
      date: d,
      count: dayGames.length,
      won: dayGames.filter(g => g.won).length,
    })
  }

  // Recent games
  const recent = [...results].reverse().slice(0, 10)

  const getColor = (won: number) => {
    if (won === 0) return 'rgba(255,255,255,0.04)'
    if (won === 1) return 'rgba(255,110,180,0.18)'
    if (won === 2) return 'rgba(255,110,180,0.4)'
    if (won <= 4) return 'rgba(255,110,180,0.65)'
    return 'rgba(255,110,180,1)'
  }

  const diffColor = (d: string) => ({
    easy: '#64ffa0', medium: '#6ab0ff', hard: '#ffb464',
    expert: '#ff6eb4', daily: '#b06aff'
  } as Record<string, string>)[d] || '#888'

  if (loading) return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', color:'var(--text)',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:14, color:'var(--text-dim)' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', color:'var(--text)',
      fontFamily:'DM Sans, sans-serif' }}>

      {/* Header */}
      <header style={{
        position:'sticky', top:0, zIndex:50, height:60,
        padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'var(--bg-glass)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid var(--border)',
      }}>
        <button onClick={()=>router.push('/')} style={{
          fontSize:13, color:'var(--text-dim)', background:'none',
          border:'none', cursor:'pointer'
        }}>← Home</button>
        <div style={{ fontFamily:'Playfair Display, serif', fontSize:17, color:'var(--text)' }}>{t('stats_title')}</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end', minWidth:60 }}>
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <main style={{ maxWidth:1000, margin:'0 auto', padding:'40px 32px' }}>

        {/* Sign-in prompt only if NOT logged in */}
        {!user && (
          <div style={{
            padding:'20px 24px', borderRadius:16, marginBottom:32,
            background:'rgba(255,110,180,0.06)',
            border:'1px solid rgba(255,110,180,0.2)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div>
              <div style={{ fontSize:14, color:'var(--text)' }}>{t('stats_sign_in_prompt')}</div>
              <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:3 }}>{t('stats_sign_in_sub')}</div>
            </div>
            <button onClick={()=>router.push('/auth')} style={{
              background:'rgba(255,255,255,0.9)', color:'#080808',
              padding:'9px 20px', borderRadius:100, fontSize:13,
              border:'none', cursor:'pointer'
            }}>Sign in →</button>
          </div>
        )}

        {/* User badge if logged in */}
        {user && (
          <div style={{
            display:'flex', alignItems:'center', gap:14, marginBottom:32,
            padding:'16px 20px', borderRadius:16,
            background:'var(--bg-card)',
            border:'1px solid var(--border)',
          }}>
            <div style={{
              width:44, height:44, borderRadius:'50%',
              background:'rgba(255,110,180,0.15)',
              border:'1px solid rgba(255,110,180,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:17, color:'#ff6eb4',
            }}>{user.email?.[0].toUpperCase()}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, color:'var(--text)' }}>{profile?.display_name || user.email}</div>
              <div style={{ fontSize:12, color:'var(--text-dim)' }}>
                {profile?.city || 'Set city in profile'}
              </div>
            </div>
          </div>
        )}

        {/* Empty state — only when no games, sits above heatmap */}
        {totalGames === 0 && (
          <div style={{
            textAlign:'center', padding:'40px 20px', marginBottom:32,
            background:'var(--bg-card)',
            border:'1px solid var(--border)',
            borderRadius:16,
          }}>
            <div style={{ fontFamily:'Playfair Display, serif', fontSize:24, marginBottom:6 }}>
              {t('stats_no_games')}
            </div>
            <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:20 }}>
              {t('stats_no_games_sub')}
            </div>
            <button onClick={()=>router.push('/')} style={{
              background:'rgba(255,255,255,0.9)', color:'#080808',
              padding:'11px 24px', borderRadius:100, fontSize:13,
              border:'none', cursor:'pointer'
            }}>{t('stats_play_first')}</button>
          </div>
        )}

        {/* 4 stat cards — only when games exist */}
        {totalGames > 0 && (
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:32
          }}>
            {[
              { label:t('stats_games_played'), val: totalGames, suffix:'' },
              { label:t('stats_win_rate'), val: winRate, suffix:'%' },
              { label:t('stats_streak'), val: streak, suffix:` ${streak===1?t('stats_day'):t('stats_days')}` },
              { label:t('stats_avg_time'), val: avgTime ? fmt(avgTime) : '—', suffix:'' },
            ].map((s, i) => (
              <div key={i} style={{
                padding:'24px 20px', borderRadius:16,
                background:'var(--bg-card)',
                border:'1px solid var(--border)',
                position:'relative', overflow:'hidden',
              }}>
                <div style={{
                  position:'absolute', top:0, left:0, right:0, height:1,
                  background:'linear-gradient(90deg,transparent,rgba(255,110,180,0.3),transparent)',
                }}/>
                <div style={{ fontSize:11, color:'var(--text-dim)',
                  letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily:'Playfair Display, serif', fontSize:38, color:'var(--text)', lineHeight:1 }}>
                  {s.val}<span style={{ fontSize:18, color:'var(--text-dim)' }}>{s.suffix}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HEATMAP — always visible */}
        <section style={{ marginBottom:40 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
            <h3 style={{ fontFamily:'Playfair Display, serif', fontSize:22, fontWeight:400 }}>{t('stats_activity')}</h3>
            <div style={{ fontSize:11, color:'var(--text-faint)' }}>
              {t('stats_last_weeks')} · {results.length} {results.length === 1 ? t('stats_game') : t('stats_games')}
            </div>
          </div>

          <div style={{
            padding:20, borderRadius:16,
            background:'var(--bg-card)',
            border:'1px solid var(--border)',
          }}>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(12, 1fr)',
              gap:4
            }}>
              {Array.from({length: 12}).map((_, week) => (
                <div key={week} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {Array.from({length: 7}).map((_, day) => {
                    const idx = week*7 + day
                    const cell = heatmap[idx]
                    if (!cell) return <div key={day} style={{ width:'100%', aspectRatio:'1' }}/>
                    return (
                      <div key={day} title={`${cell.date}: ${cell.won} ${cell.won === 1 ? 'win' : 'wins'}`}
                        style={{
                          width:'100%', aspectRatio:'1',
                          background: getColor(cell.won),
                          borderRadius:3,
                          cursor:'pointer',
                          transition:'transform .15s',
                        }}
                        onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.25)')}
                        onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
            <div style={{
              display:'flex', justifyContent:'space-between',
              alignItems:'center', marginTop:14,
            }}>
              <div style={{ fontSize:11, color:'var(--text-dim)' }}>
                {results.filter(r => r.won).length === 0
                  ? 'Play your first puzzle to light up this calendar.'
                  : null}
              </div>
              <div style={{
                display:'flex', alignItems:'center',
                gap:8, fontSize:11, color:'var(--text-dim)',
              }}>
                <span>{t('stats_less')}</span>
                {['rgba(255,255,255,0.04)','rgba(255,110,180,0.18)','rgba(255,110,180,0.4)','rgba(255,110,180,0.65)','rgba(255,110,180,1)'].map((c, i) => (
                  <div key={i} style={{ width:12, height:12, borderRadius:3, background:c }}/>
                ))}
                <span>{t('stats_more')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* BEST TIMES BY DIFFICULTY — only when games exist */}
        {totalGames > 0 && (
          <section style={{ marginBottom:40 }}>
            <h3 style={{ fontFamily:'Playfair Display, serif', fontSize:22, fontWeight:400, marginBottom:16 }}>{t('stats_best_times')}</h3>
            <div style={{
              padding:'8px 20px', borderRadius:16,
              background:'var(--bg-card)',
              border:'1px solid var(--border)',
            }}>
              {bestByDiff.map(b => (
                <div key={b.difficulty} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'14px 0',
                  borderBottom:'1px solid var(--border)'
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:8, height:8, borderRadius:'50%',
                      background: diffColor(b.difficulty),
                      boxShadow: `0 0 8px ${diffColor(b.difficulty)}66`
                    }}/>
                    <span style={{ fontSize:14, color:'var(--text)',
                      textTransform:'capitalize' }}>{b.difficulty}</span>
                  </div>
                  <span style={{ fontFamily:'Playfair Display, serif', fontSize:18,
                    color: b.time ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                    {b.time ? fmt(b.time) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RECENT GAMES — only when games exist */}
        {totalGames > 0 && (
          <section>
            <h3 style={{ fontFamily:'Playfair Display, serif', fontSize:22, fontWeight:400, marginBottom:16 }}>{t('stats_recent')}</h3>
            <div style={{
              borderRadius:16,
              background:'var(--bg-card)',
              border:'1px solid var(--border)',
              overflow:'hidden',
            }}>
              {recent.map((g, i) => (
                <div key={i} style={{
                  display:'grid',
                  gridTemplateColumns:'90px 1fr auto auto auto',
                  gap:16, alignItems:'center',
                  padding:'14px 20px',
                  borderBottom: i < recent.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ fontSize:11, color:'var(--text-faint)' }}>
                    {new Date(g.date).toLocaleDateString('en-US',{month:'short', day:'numeric'})}
                  </span>
                  <span style={{
                    fontSize:11, padding:'3px 10px', borderRadius:100,
                    background: diffColor(g.difficulty)+'22',
                    color: diffColor(g.difficulty),
                    textTransform:'capitalize', justifySelf:'start'
                  }}>{g.difficulty}</span>
                  <span style={{ fontFamily:'Playfair Display, serif', fontSize:15 }}>{fmt(g.time)}</span>
                  <span style={{ fontSize:12, color:'rgba(255,200,80,0.7)', letterSpacing:'2px' }}>
                    {g.won ? '★'.repeat(g.stars||3) : '—'}
                  </span>
                  <span style={{
                    fontSize:11, color: g.won ? 'rgba(100,255,160,0.7)' : 'rgba(255,100,100,0.6)'
                  }}>{g.won ? t('stats_won') : t('stats_lost')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
