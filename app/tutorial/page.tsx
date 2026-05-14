'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { ZenMascot } from '@/components/ZenMascot'
import ThemeToggle from '@/components/ThemeToggle'
import { useLang } from '@/lib/i18n'
import LangToggle from '@/components/LangToggle'

// ── NumPad helper ────────────────────────────────────────────────────────────

function NumPad({ onPick, highlight }: { onPick: (n: number) => void, highlight?: number[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 6, maxWidth: 340, margin: '0 auto' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
        const isOn = highlight?.includes(n)
        return (
          <button key={n} onClick={() => onPick(n)} style={{
            aspectRatio: '1',
            background: isOn ? 'rgba(255,110,180,0.18)' : 'rgba(255,255,255,0.04)',
            border: isOn ? '1px solid rgba(255,110,180,0.4)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, fontFamily: 'Playfair Display, serif', fontSize: 15,
            color: isOn ? '#ff6eb4' : 'rgba(255,255,255,0.8)',
            cursor: 'pointer', transition: 'all .15s',
          }}>{n}</button>
        )
      })}
    </div>
  )
}

// ── Lesson definitions ───────────────────────────────────────────────────────

type Cell = { value: number, notes: number[] }

type Lesson = {
  name: string
  teach: string
  task: string
  hint: string
  type: 'row' | 'find-cell' | 'notes'
  showAs: 'numbers' | 'find' | 'notes' | 'naked-pair'
  row?: number[]
  answer?: number
  answerCellIdx?: number
  columnHints?: string[]
  requiredNotes?: number[]
  cells?: Cell[]
}

const LESSONS: Lesson[] = [
  {
    name: 'The basics',
    teach: "Hi! I'm Zen. In Sudoku, every row must have numbers 1–9 with no repeats. Same goes for every column and every 3×3 box. Easy!",
    task: 'Find the missing number',
    hint: 'This row has 8 numbers. Which one is missing?',
    type: 'row',
    row: [5, 3, 8, 1, 0, 6, 9, 2, 4],
    answer: 7,
    showAs: 'numbers',
  },
  {
    name: 'Naked single',
    teach: "Sometimes only ONE number can fit in a cell. Check what's in the row, column, and 3×3 box around it — whatever's missing is your answer.",
    task: 'Which number fits here?',
    hint: 'Look at the highlighted row. Eight cells are filled — the empty one needs the missing number.',
    type: 'row',
    row: [4, 1, 9, 0, 7, 2, 6, 8, 3],
    answer: 5,
    showAs: 'numbers',
  },
  {
    name: 'Hidden single',
    teach: "Sometimes a number can go in only ONE place in a row, column, or box — even if other numbers could fit there too. Spot the only valid spot!",
    task: 'Where does the 7 go?',
    hint: 'In this row, only ONE empty cell can hold a 7. Click it.',
    type: 'find-cell',
    row: [0, 3, 0, 1, 0, 6, 0, 2, 0],
    answerCellIdx: 0,
    columnHints: ['•••', '7 in col', '•••', '7 in col', '•••', '7 in col', '7 in col', '•••', '7 in col'],
    showAs: 'find',
  },
  {
    name: 'Pencil marks',
    teach: "Not sure yet? Use Notes mode! Tap the pencil icon, then add small candidate numbers to a cell so you remember the possibilities.",
    task: 'Add notes 3, 5, and 7',
    hint: 'This cell could be 3, 5, or 7. Tap notes mode, then those three numbers.',
    type: 'notes',
    requiredNotes: [3, 5, 7],
    showAs: 'notes',
  },
  {
    name: 'Naked pair',
    teach: "Spot two cells in the same row that can ONLY hold the same two numbers? That's a naked pair! Those numbers can't appear elsewhere in that row.",
    task: 'Pick the cell to clear',
    hint: 'Two cells already have only {3,5} as candidates. The 3 must be eliminated from another cell. Which one?',
    type: 'find-cell',
    answerCellIdx: 4,
    cells: [
      { value: 0, notes: [3, 5] },
      { value: 8, notes: [] },
      { value: 0, notes: [3, 5] },
      { value: 1, notes: [] },
      { value: 0, notes: [2, 3, 4] },
      { value: 9, notes: [] },
      { value: 7, notes: [] },
      { value: 0, notes: [2, 4] },
      { value: 6, notes: [] },
    ],
    showAs: 'naked-pair',
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TutorialPage() {
  const router = useRouter()
  const { t } = useLang()
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'teach' | 'task' | 'correct' | 'wrong'>('teach')
  const [answer, setAnswer] = useState<number | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  const [currentNotes, setCurrentNotes] = useState<number[]>([])
  const [completed, setCompleted] = useState(false)

  const lesson = LESSONS[step]

  const handleNumberClick = (n: number) => {
    if (phase !== 'task') return
    if (lesson.type === 'notes') {
      if (!notesMode) return
      setCurrentNotes(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])
      return
    }
    setAnswer(n)
    if (n === lesson.answer) {
      setPhase('correct')
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } })
    } else {
      setPhase('wrong')
      setTimeout(() => { setPhase('task'); setAnswer(null) }, 1200)
    }
  }

  const handleCellClick = (idx: number) => {
    if (phase !== 'task') return
    if (lesson.type !== 'find-cell') return
    if (idx === lesson.answerCellIdx) {
      setPhase('correct')
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } })
    } else {
      setPhase('wrong')
      setTimeout(() => setPhase('task'), 1200)
    }
  }

  const handleCheckNotes = () => {
    const required = lesson.requiredNotes ?? []
    const matches = required.every(n => currentNotes.includes(n)) && currentNotes.length === required.length
    if (matches) {
      setPhase('correct')
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } })
    } else {
      setPhase('wrong')
      setTimeout(() => setPhase('task'), 1200)
    }
  }

  const nextLesson = () => {
    if (step === LESSONS.length - 1) {
      setCompleted(true)
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } })
      localStorage.setItem('zen_tutorial_done', 'true')
      return
    }
    setStep(s => s + 1)
    setPhase('teach')
    setAnswer(null)
    setCurrentNotes([])
    setNotesMode(false)
  }

  const mascotMood = phase === 'correct' ? 'celebrate' : phase === 'wrong' ? 'sad' : phase === 'teach' ? 'happy' : 'thinking'

  const cellsForFindLesson: Cell[] = lesson.cells
    ?? (lesson.row?.map((v: number) => ({ value: v, notes: [] })) ?? [])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: 60,
        padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-glass)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={() => router.push('/')} style={{
          fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
        }}>← Home</button>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: 'var(--text)' }}>Tutorial</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{t('tut_lesson')} {step + 1} {t('tut_of')} {LESSONS.length}</span>
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ maxWidth: 760, margin: '24px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {LESSONS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < step
                ? 'linear-gradient(90deg,#ff6eb4,#b06aff)'
                : i === step ? 'rgba(255,110,180,0.6)' : 'rgba(255,255,255,0.07)',
              transition: 'background .3s',
            }} />
          ))}
        </div>
      </div>

      <main style={{
        maxWidth: 760, margin: '40px auto', padding: '0 24px',
        display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 32, alignItems: 'start',
      }}>

        {/* Mascot card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg,transparent,#ff6eb4,#b06aff,#6ab0ff,transparent)',
            backgroundSize: '200% 100%', animation: 'iris 4s linear infinite',
          }} />
          <div style={{ animation: 'zenFloat 3.5s ease-in-out infinite', marginBottom: 20 }}>
            <ZenMascot mood={mascotMood} />
          </div>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
            borderRadius: 14, padding: '14px 16px', fontSize: 13,
            color: 'var(--text)', lineHeight: 1.55, fontWeight: 300,
            textAlign: 'left', animation: 'popIn .4s ease',
          }}>
            {phase === 'correct' ? '🎉 Perfect! You got it!'
              : phase === 'wrong' ? 'Oops — try again!'
              : phase === 'teach' ? lesson.teach
              : lesson.hint}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '.18em', textTransform: 'uppercase', marginTop: 16 }}>
            {t('tut_lesson')} {step + 1} {t('tut_of')} {LESSONS.length}
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, color: 'rgba(255,110,180,0.85)', letterSpacing: '.04em', marginTop: 4 }}>
            {lesson.name}
          </div>
        </div>

        {/* Task card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 18, padding: 24,
        }}>
          {phase === 'teach' ? (
            <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 10 }}>{lesson.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, maxWidth: 340, lineHeight: 1.6 }}>
                Read what Zen says, then tap below when you&apos;re ready.
              </div>
              <button onClick={() => setPhase('task')} style={{
                padding: '13px 32px', borderRadius: 100,
                background: 'rgba(255,255,255,0.9)', color: '#080808',
                border: 'none', fontSize: 14, cursor: 'pointer',
              }}>{t('tut_ready')}</button>
            </div>
          ) : phase === 'correct' ? (
            <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, marginBottom: 8 }}>✨</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 10 }}>{t('tut_nailed')}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>
                {step === LESSONS.length - 1 ? 'Last lesson done!' : 'Ready for the next one?'}
              </div>
              <button onClick={nextLesson} style={{
                padding: '13px 32px', borderRadius: 100,
                background: 'rgba(255,255,255,0.9)', color: '#080808',
                border: 'none', fontSize: 14, cursor: 'pointer',
              }}>{step === LESSONS.length - 1 ? t('tut_finish') : t('tut_next')}</button>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 6 }}>{lesson.task}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 20, fontWeight: 300 }}>{lesson.hint}</div>

              {/* Row puzzle — lessons 1 & 2 */}
              {lesson.type === 'row' && lesson.showAs === 'numbers' && lesson.row && (
                <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(9,1fr)',
                    gap: 2, background: 'rgba(255,255,255,0.08)', padding: 2, borderRadius: 8,
                    maxWidth: 340, margin: '0 auto 20px',
                  }}>
                    {lesson.row.map((v, i) => (
                      <div key={i} style={{
                        aspectRatio: '1',
                        background: v === 0 ? 'rgba(255,110,180,0.18)' : '#0a0a0a',
                        border: v === 0 ? '1px solid rgba(255,110,180,0.45)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Playfair Display, serif', fontSize: 14,
                        color: v === 0 ? '#fff' : 'rgba(255,255,255,0.8)', borderRadius: 2,
                      }}>
                        {v === 0 ? (answer !== null ? answer : '?') : v}
                      </div>
                    ))}
                  </div>
                  <NumPad onPick={handleNumberClick} />
                </>
              )}

              {/* Find-cell — lessons 3 & 5 */}
              {lesson.type === 'find-cell' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 4, maxWidth: 340, margin: '0 auto 20px' }}>
                  {cellsForFindLesson.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => c.value === 0 && handleCellClick(i)}
                      style={{
                        aspectRatio: '1',
                        background: c.value === 0 ? 'rgba(255,110,180,0.1)' : '#1a1a1a',
                        border: c.value === 0 ? '1px solid rgba(255,110,180,0.3)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 6, cursor: c.value === 0 ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Playfair Display, serif', fontSize: 14, color: '#fff',
                        transition: 'all .15s',
                      }}
                    >
                      {c.value !== 0 ? c.value : c.notes.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', fontSize: 7, padding: 2, gap: 1 }}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <span key={n} style={{ color: c.notes.includes(n) ? 'rgba(106,176,255,0.85)' : 'transparent' }}>{n}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {/* Notes lesson — lesson 4 */}
              {lesson.type === 'notes' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 8,
                      background: notesMode ? 'rgba(106,176,255,0.05)' : 'rgba(255,110,180,0.1)',
                      border: '1px solid rgba(255,110,180,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {currentNotes.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, padding: 4, fontSize: 11 }}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <span key={n} style={{ textAlign: 'center', color: currentNotes.includes(n) ? 'rgba(106,176,255,0.9)' : 'transparent' }}>{n}</span>
                          ))}
                        </div>
                      ) : <span style={{ color: 'var(--text-faint)' }}>?</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <button onClick={() => setNotesMode(p => !p)} style={{
                      padding: '10px 20px', borderRadius: 100, fontSize: 12,
                      background: notesMode ? 'rgba(255,110,180,0.15)' : 'rgba(255,255,255,0.05)',
                      border: notesMode ? '1px solid rgba(255,110,180,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      color: notesMode ? '#ff6eb4' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                    }}>
                      ✏️ Notes mode: {notesMode ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <NumPad onPick={handleNumberClick} highlight={currentNotes} />

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <button onClick={handleCheckNotes} style={{
                      padding: '11px 24px', borderRadius: 100,
                      background: 'rgba(255,255,255,0.9)', color: '#080808',
                      border: 'none', fontSize: 13, cursor: 'pointer',
                    }}>{t('tut_check')}</button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Completion modal */}
      {completed && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
            borderRadius: 24, padding: '48px 40px', maxWidth: 440, textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg,transparent,#ff6eb4,#b06aff,#6ab0ff,transparent)',
              backgroundSize: '200% 100%', animation: 'iris 4s linear infinite',
            }} />
            <div style={{ marginBottom: 20, animation: 'zenFloat 2s ease-in-out infinite' }}>
              <ZenMascot mood="celebrate" size={120} />
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, marginBottom: 8 }}>{t('tut_done_title')}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
              {t('tut_done_sub')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => router.push('/game/easy')} style={{
                padding: '13px 28px', borderRadius: 100,
                background: 'rgba(255,255,255,0.9)', color: '#080808',
                border: 'none', fontSize: 14, cursor: 'pointer',
              }}>{t('tut_start_easy')}</button>
              <button onClick={() => router.push('/daily')} style={{
                padding: '13px 28px', borderRadius: 100,
                background: 'transparent', color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.15)', fontSize: 14, cursor: 'pointer',
              }}>{t('tut_try_daily')}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes iris{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes zenFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes zenBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(0.05)}97%{transform:scaleY(1)}}
        @keyframes zenWave{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
        @keyframes popIn{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @media (max-width: 768px){
          main{grid-template-columns:1fr !important;}
        }
      `}</style>
    </div>
  )
}
