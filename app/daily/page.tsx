'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { getDailyPuzzle } from '@/lib/sudoku-engine';
import { saveResult } from '@/lib/stats';
import { speakNumber } from '@/components/SeniorMode';
import { useLang } from '@/lib/i18n';
import LangToggle from '@/components/LangToggle';

// ─── Mosaic data ───────────────────────────────────────────────────────────────

const MOSAICS = [
  {
    name: 'Sunset Mountain',
    colors: [
      ['#1a0a2e','#1a0a2e','#16213e','#16213e','#16213e','#0f3460','#0f3460','#0f3460','#0f3460'],
      ['#2d1b4e','#2d1b4e','#0f3460','#0f3460','#1a4d6e','#1a4d6e','#1a4d6e','#0f3460','#0f3460'],
      ['#e94560','#e94560','#f47868','#f47868','#1a4d6e','#1a4d6e','#1a4d6e','#1a4d6e','#1a4d6e'],
      ['#f47868','#c7613a','#c7613a','#b8861f','#b8861f','#1a4d6e','#1a4d6e','#1a4d6e','#1a4d6e'],
      ['#b8861f','#b8861f','#c79c00','#c79c00','#c79c00','#5d7e8e','#5d7e8e','#1a4d6e','#1a4d6e'],
      ['#3d4a5c','#3d4a5c','#5d6e7e','#5d7e8e','#7d8e9e','#5d7e8e','#3d5e6e','#3d4a5c','#2d3e4e'],
      ['#2d3e4e','#2d3e4e','#3d4a5c','#3d4a5c','#4d5a6c','#3d4a5c','#2d3e4e','#1d2e3e','#1d2e3e'],
      ['#1d2e3e','#1d2e3e','#2d3e4e','#2d3e4e','#2d3e4e','#1d2e3e','#1d2e3e','#0d1e2e','#0d1e2e'],
      ['#0d1e2e','#0d1e2e','#1d2e3e','#1d2e3e','#1d2e3e','#0d1e2e','#0d1e2e','#0d1e2e','#0d1e2e'],
    ]
  },
  {
    name: 'Koi Pond',
    colors: [
      ['#0a2540','#0a2540','#0d3050','#0d3050','#0d3050','#0d3050','#0a2540','#0a2540','#0a2540'],
      ['#0d3050','#1a4a6e','#1a4a6e','#2d6e8e','#2d6e8e','#1a4a6e','#0d3050','#0a2540','#0a2540'],
      ['#1a4a6e','#ff6b35','#ff6b35','#a8956a','#2d6e8e','#1a4a6e','#1a4a6e','#0d3050','#0a2540'],
      ['#2d6e8e','#ff8c42','#a8956a','#ff6b35','#2d6e8e','#2d6e8e','#1a4a6e','#1a4a6e','#0d3050'],
      ['#3d8eae','#ff6b35','#ff8c42','#ff6b35','#2d6e8e','#5dae9e','#5dae9e','#2d6e8e','#1a4a6e'],
      ['#2d6e8e','#2d6e8e','#3d8eae','#5dae9e','#5dae9e','#a8956a','#ff8c42','#3d8eae','#2d6e8e'],
      ['#1a4a6e','#2d6e8e','#5dae9e','#7dceae','#5dae9e','#ff6b35','#ff6b35','#2d6e8e','#1a4a6e'],
      ['#0d3050','#1a4a6e','#2d6e8e','#5dae9e','#3d8eae','#2d6e8e','#1a4a6e','#1a4a6e','#0d3050'],
      ['#0a2540','#0d3050','#1a4a6e','#2d6e8e','#1a4a6e','#1a4a6e','#0d3050','#0a2540','#0a2540'],
    ]
  },
  {
    name: 'Cherry Blossom',
    colors: [
      ['#2c1810','#3c2418','#3c2418','#8f6b7c','#a88293','#8f6b7c','#3c2418','#2c1810','#2c1810'],
      ['#3c2418','#8f6b7c','#ff8fa3','#a88293','#b88fa3','#a88293','#ff8fa3','#3c2418','#2c1810'],
      ['#3c2418','#ff8fa3','#a88293','#b88fa3','#c79caf','#b88fa3','#a88293','#8f6b7c','#3c2418'],
      ['#4c3428','#3c2418','#8f6b7c','#a88293','#b88fa3','#a88293','#8f6b7c','#ff8fa3','#3c2418'],
      ['#5c4438','#4c3428','#3c2418','#8f6b7c','#a88293','#8f6b7c','#3c2418','#4c3428','#5c4438'],
      ['#8db580','#7da570','#5c4438','#4c3428','#3c2418','#4c3428','#5c4438','#7da570','#8db580'],
      ['#9dc590','#8db580','#7da570','#6d9560','#5d8550','#6d9560','#7da570','#8db580','#9dc590'],
      ['#7da570','#8db580','#9dc590','#adcea0','#bddfb0','#adcea0','#9dc590','#8db580','#7da570'],
      ['#6d9560','#7da570','#8db580','#9dc590','#adcea0','#9dc590','#8db580','#7da570','#6d9560'],
    ]
  },
];

const today = new Date();
const dayNumber = Math.floor(Date.now() / 86400000);
const mosaic = MOSAICS[dayNumber % 3];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function emptyBoard(): number[][] {
  return Array(9).fill(null).map(() => Array(9).fill(0));
}

function emptyBoolBoard(): boolean[][] {
  return Array(9).fill(null).map(() => Array(9).fill(false));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DailyPage() {
  const router = useRouter();
  const { t } = useLang();

  const [puzzle, setPuzzle] = useState<number[][]>(emptyBoard());
  const [solution, setSolution] = useState<number[][]>(emptyBoard());
  const [board, setBoard] = useState<number[][]>(emptyBoard());
  const [given, setGiven] = useState<boolean[][]>(emptyBoolBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [mistakes, setMistakes] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [solved, setSolved] = useState<boolean[][]>(emptyBoolBoard());
  const [complete, setComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showErrors, setShowErrors] = useState(true);
  const [queriesLeft, setQueriesLeft] = useState(5);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachMessages, setCoachMessages] = useState<{ role: string; text: string }[]>([]);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewHovered, setPreviewHovered] = useState(false);
  const [countdown, setCountdown] = useState({ h: '00', m: '00', s: '00' });

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  function showToastFn(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const dateStr = today.toISOString().split('T')[0];
    const { puzzle: p, solution: sol } = getDailyPuzzle(dateStr);
    const g = p.map(row => row.map(v => v !== 0));
    const b = p.map(row => [...row]);
    const s = p.map(row => row.map(v => v !== 0));
    setPuzzle(p);
    setSolution(sol);
    setBoard(b);
    setGiven(g);
    setSolved(s);
    setQueriesLeft(5);
  }, []);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (complete || paused) return;
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [complete, paused]);

  // ── Countdown ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tom = new Date(now);
      tom.setHours(24, 0, 0, 0);
      const d = tom.getTime() - now.getTime();
      setCountdown({
        h: String(Math.floor(d / 3600000)).padStart(2, '0'),
        m: String(Math.floor((d % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((d % 60000) / 1000)).padStart(2, '0'),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // ── Visibility pause ────────────────────────────────────────────────────────
  useEffect(() => {
    const h = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);

  // ── Place number ────────────────────────────────────────────────────────────
  function placeNumber(num: number) {
    if (!selected) { showToastFn('Select a cell first'); return; }
    const [r, c] = selected;
    if (given[r][c]) return;

    if (notesMode) {
      const key = `${r}-${c}`;
      const cur = notes[key] || [];
      const updated = cur.includes(num) ? cur.filter(n => n !== num) : [...cur, num];
      setNotes(prev => ({ ...prev, [key]: updated }));
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;

    if (num === solution[r][c]) {
      speakNumber(num);
      const newSolved = solved.map(row => [...row]);
      newSolved[r][c] = true;
      setSolved(newSolved);
      setBoard(newBoard);

      const newNotes = { ...notes };
      delete newNotes[`${r}-${c}`];
      for (let i = 0; i < 9; i++) {
        [`${r}-${i}`, `${i}-${c}`].forEach(k => {
          if (newNotes[k]) newNotes[k] = newNotes[k].filter(n => n !== num);
        });
      }
      const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) {
        const k = `${br + dr}-${bc + dc}`;
        if (newNotes[k]) newNotes[k] = newNotes[k].filter(n => n !== num);
      }
      setNotes(newNotes);

      const totalSolved = newSolved.flat().filter(Boolean).length;
      if (totalSolved === 81) {
        if (!savedRef.current) {
          savedRef.current = true;
          saveResult({ difficulty: 'daily', time: timer, mistakes, hintsUsed: 3 - hintsLeft, won: true });
        }
        setComplete(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    } else {
      if (showErrors) setBoard(newBoard);
      setMistakes(m => m + 1);
      showToastFn('Wrong number');
      if (mistakes + 1 >= 3) showToastFn('3 mistakes — keep going!');
    }
  }

  // ── Hint ────────────────────────────────────────────────────────────────────
  function applyHint() {
    if (hintsLeft === 0) { showToastFn('No hints remaining'); return; }
    const empty: [number, number][] = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (!solved[r][c]) empty.push([r, c]);
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = solution[r][c];
    setBoard(newBoard);
    const newSolved = solved.map(row => [...row]);
    newSolved[r][c] = true;
    setSolved(newSolved);
    setHintsLeft(h => h - 1);
    const totalSolved = newSolved.flat().filter(Boolean).length;
    if (totalSolved === 81) {
      if (!savedRef.current) {
        savedRef.current = true;
        saveResult({ difficulty: 'daily', time: timer, mistakes, hintsUsed: 3 - hintsLeft, won: true });
      }
      setComplete(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }

  // ── Erase ───────────────────────────────────────────────────────────────────
  function eraseCell() {
    if (!selected) return;
    const [r, c] = selected;
    if (given[r][c]) return;
    const nb = board.map(row => [...row]); nb[r][c] = 0; setBoard(nb);
    const ns = solved.map(row => [...row]); ns[r][c] = false; setSolved(ns);
    const nn = { ...notes }; delete nn[`${r}-${c}`]; setNotes(nn);
  }

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (complete || paused) return;
      if (e.key >= '1' && e.key <= '9') { placeNumber(parseInt(e.key)); return; }
      if (e.key === 'n') { setNotesMode(p => !p); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') { eraseCell(); return; }
      if (selected) {
        const [r, c] = selected;
        if (e.key === 'ArrowUp') setSelected([Math.max(0, r - 1), c]);
        if (e.key === 'ArrowDown') setSelected([Math.min(8, r + 1), c]);
        if (e.key === 'ArrowLeft') setSelected([r, Math.max(0, c - 1)]);
        if (e.key === 'ArrowRight') setSelected([r, Math.min(8, c + 1)]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, board, notesMode, notes, given, solution, solved, complete, paused, mistakes]);

  // ── AI Coach ────────────────────────────────────────────────────────────────
  async function sendCoachMessage() {
    const q = coachInput.trim();
    if (!q || queriesLeft === 0 || coachLoading) return;
    const newMessages = [...coachMessages, { role: 'user', text: q }];
    setCoachMessages(newMessages);
    setCoachInput('');
    setCoachLoading(true);
    setQueriesLeft(p => p - 1);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: board,
          solution,
          selectedCell: selected,
          userQuestion: q,
        }),
      });
      if (!res.ok || !res.body) throw new Error('Failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      setCoachMessages(prev => [...prev, { role: 'assistant', text: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setCoachMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'assistant', text };
          return msgs;
        });
      }
    } catch {
      setCoachMessages(prev => [...prev, { role: 'assistant', text: 'Coach unavailable. Check your API key.' }]);
    } finally {
      setCoachLoading(false);
    }
  }

  // ── Mobile keyboard ─────────────────────────────────────────────────────────
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent)

  const handleCellClick = (r: number, c: number) => {
    setSelected([r, c])
    if (isMobile && hiddenInputRef.current) hiddenInputRef.current.focus()
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const solvedCount = solved.flat().filter(Boolean).length;
  const previewBlur = Math.max(0, 7 - (solvedCount / 81) * 7);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#fff', fontFamily: 'var(--font-dm, DM Sans, sans-serif)', display: 'flex', flexDirection: 'column' }}>

      <input
        ref={hiddenInputRef}
        type="text"
        inputMode="numeric"
        pattern="[1-9]*"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={1}
        value=""
        onChange={(e) => {
          const v = e.target.value.replace(/[^1-9]/g, '')
          if (v && selected) placeNumber(parseInt(v))
          e.target.value = ''
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Backspace' || e.key === 'Delete') && selected) eraseCell()
        }}
        style={{ position: 'fixed', bottom: -100, left: '50%', width: 1, height: 1, opacity: 0, pointerEvents: 'none', fontSize: 16 }}
        readOnly={false}
      />

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: 60,
        padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <button
          onClick={() => router.push('/')}
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, transition: 'color .2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          ← Home
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 17, color: '#fff' }}>
            {t('daily_title')}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Day #{dayNumber % 1000} · {mosaic.name}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', minWidth: 80 }}>
          <LangToggle />
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-playfair, Playfair Display, serif)' }}>
            {countdown.h}:{countdown.m}:{countdown.s}
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px', gap: 40, flexWrap: 'wrap' }}>

        {/* Left: grid + controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          {/* Progress bar */}
          <div style={{ width: 504, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
              <div style={{
                height: 2, borderRadius: 1, transition: 'width .4s ease',
                width: `${(solvedCount / 81) * 100}%`,
                background: 'linear-gradient(90deg, #ff6eb4, #b06aff, #6ab0ff)',
                minWidth: solvedCount > 0 ? 4 : 0,
              }} />
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', minWidth: 48, textAlign: 'right' }}>
              {solvedCount} / 81
            </span>
          </div>

          {/* Sudoku grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(9, var(--cell-size))',
            border: '2px solid rgba(255,255,255,0.2)', borderRadius: 12, overflow: 'hidden',
          }}>
            {board.map((row, r) => row.map((val, c) => {
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isGiven = given[r]?.[c];
              const isWrong = !isGiven && val !== 0 && val !== solution[r]?.[c] && showErrors;
              const cellNotes = notes[`${r}-${c}`] || [];
              const selVal = selected ? board[selected[0]][selected[1]] : 0;
              const sameNum = selVal !== 0 && val === selVal && !isSelected;
              const highlight = selected && !isSelected && (
                selected[0] === r || selected[1] === c ||
                (Math.floor(selected[0] / 3) === Math.floor(r / 3) && Math.floor(selected[1] / 3) === Math.floor(c / 3))
              );

              const borderRight = (c + 1) % 3 === 0 && c !== 8 ? '2px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)';
              const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? '2px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)';

              const isSolved = solved[r]?.[c] === true || given[r]?.[c] === true;

              let cellBg = '#0a0a0a';
              if (isSolved && mosaic && mosaic.colors[r] && mosaic.colors[r][c]) {
                cellBg = mosaic.colors[r][c];
              }

              let bg = cellBg;
              if (!isSolved) {
                if (isWrong && showErrors) bg = 'rgba(255,60,60,0.15)';
                else if (isSelected) bg = 'rgba(255,110,180,0.15)';
                else if (sameNum) bg = 'rgba(255,110,180,0.08)';
                else if (highlight) bg = 'rgba(255,255,255,0.03)';
              } else if (isSelected) {
                bg = cellBg; // keep mosaic color, just show outline
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className="number-cell"
                  onClick={() => handleCellClick(r, c)}
                  style={{
                    width: 'var(--cell-size)', height: 'var(--cell-size)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: bg, borderRight, borderBottom,
                    cursor: 'pointer', position: 'relative', transition: 'background-color 0.4s ease',
                    outline: isSelected ? '2px solid rgba(255,110,180,0.5)' : 'none',
                    outlineOffset: -2,
                  }}
                >
                  {val !== 0 ? (
                    <span style={{
                      fontSize: 'var(--cell-font)', fontFamily: 'var(--font-playfair, Playfair Display, serif)',
                      color: isWrong ? 'rgba(255,100,100,0.9)' : isGiven ? '#fff' : 'rgba(255,255,255,0.7)',
                      fontWeight: isGiven ? 500 : 400,
                      textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.5)',
                    }}>
                      {val}
                    </span>
                  ) : cellNotes.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, padding: 3, width: '100%', height: '100%' }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <span key={n} style={{
                          fontSize: 9, textAlign: 'center', lineHeight: '1.4',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: cellNotes.includes(n) ? 'rgba(106,176,255,0.85)' : 'transparent',
                          fontFamily: 'var(--font-dm, DM Sans, sans-serif)',
                        }}>{n}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }))}
          </div>

          {/* Number pad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, var(--pad-size))', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                className="number-pad-btn"
                onClick={() => placeNumber(n)}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                style={{
                  width: 'var(--pad-size)', height: 'var(--pad-size)', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)',
                  fontSize: 'var(--pad-font)', fontFamily: 'var(--font-playfair, Playfair Display, serif)',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >{n}</button>
            ))}
            <button
              className="number-pad-btn"
              onClick={eraseCell}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,110,180,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,110,180,0.06)'; }}
              style={{
                width: 'var(--pad-size)', height: 'var(--pad-size)', borderRadius: 12,
                border: '1px solid rgba(255,110,180,0.2)',
                background: 'rgba(255,110,180,0.06)', color: 'rgba(255,110,180,0.7)',
                fontSize: 'var(--pad-font)', cursor: 'pointer', transition: 'all .15s',
              }}
            >⌫</button>
          </div>

          {/* Mistake dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i < mistakes ? 'rgba(255,110,180,0.8)' : 'rgba(255,255,255,0.12)',
                transition: 'background .3s',
              }} />
            ))}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>mistakes</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 200, paddingTop: 36 }}>

          {/* Mosaic preview */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.3)',
              letterSpacing: '.14em', textTransform: 'uppercase',
              marginBottom: 8, textAlign: 'center',
            }}>
              {t('daily_target')}
            </div>

            <div
              onMouseEnter={() => setPreviewHovered(true)}
              onMouseLeave={() => setPreviewHovered(false)}
              style={{
                width: 120, height: 120, borderRadius: 12,
                overflow: 'hidden', margin: '0 auto',
                border: '1px solid rgba(255,255,255,0.12)',
                position: 'relative', cursor: 'pointer',
              }}
            >
              {/* THE ACTUAL MOSAIC PIXELS — always rendered */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(9, 1fr)',
                width: '100%', height: '100%',
              }}>
                {mosaic.colors.map((row, r) =>
                  row.map((color, c) => (
                    <div
                      key={`prev-${r}-${c}`}
                      style={{ background: color }}
                    />
                  ))
                )}
              </div>

              {/* Blur overlay — reduces as puzzle is solved */}
              {!complete && (
                <div style={{
                  position: 'absolute', inset: 0,
                  backdropFilter: `blur(${previewHovered ? Math.max(1, previewBlur) : previewBlur + 2}px)`,
                  WebkitBackdropFilter: `blur(${previewHovered ? Math.max(1, previewBlur) : previewBlur + 2}px)`,
                  background: `rgba(8,8,8,${previewHovered ? 0.15 : 0.45})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                } as React.CSSProperties}>
                  {!previewHovered && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                      👁 {t('daily_peek')}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.25)',
              textAlign: 'center', marginTop: 6,
            }}>
              {solvedCount}/81 {t('daily_revealed')} · {mosaic.name}
            </div>
          </div>

          {/* Hint */}
          <button
            onClick={applyHint}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'background .2s',
            }}
          >
            <span style={{ fontSize: 18 }}>💡</span>
            <div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 300 }}>Hint</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{hintsLeft === 0 ? 'none left' : `${hintsLeft} remaining`}</div>
            </div>
          </button>

          {/* Notes */}
          <button
            onClick={() => setNotesMode(p => !p)}
            onMouseEnter={e => { e.currentTarget.style.background = notesMode ? 'rgba(255,110,180,0.15)' : 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = notesMode ? 'rgba(255,110,180,0.1)' : 'rgba(255,255,255,0.04)'; }}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: notesMode ? 'rgba(255,110,180,0.1)' : 'rgba(255,255,255,0.04)',
              border: notesMode ? '1px solid rgba(255,110,180,0.3)' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all .2s',
            }}
          >
            <span style={{ fontSize: 18 }}>✏️</span>
            <div>
              <div style={{ fontSize: 13, color: notesMode ? '#ff6eb4' : 'rgba(255,255,255,0.8)', fontWeight: 300 }}>Notes</div>
              <div style={{ fontSize: 10, color: notesMode ? 'rgba(255,110,180,0.6)' : 'rgba(255,255,255,0.3)' }}>{notesMode ? 'On' : 'Off'}</div>
            </div>
          </button>

          {/* Show errors toggle */}
          <div
            onClick={() => setShowErrors(p => !p)}
            style={{
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>👁</span>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 300 }}>Show errors</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{showErrors ? 'On' : 'Off'}</div>
              </div>
            </div>
            <div style={{
              width: 38, height: 22, borderRadius: 100, position: 'relative', flexShrink: 0,
              background: showErrors ? 'rgba(255,110,180,0.7)' : 'rgba(255,255,255,0.12)',
              transition: 'background .25s',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, transition: 'left .25s cubic-bezier(.16,1,.3,1)',
                left: showErrors ? 19 : 3,
              }} />
            </div>
          </div>

          {/* Timer */}
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 28, color: '#fff' }}>
              {formatTime(timer)}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              elapsed
            </div>
          </div>

        </div>
      </main>

      {/* ── AI Coach button ───────────────────────────────────────────────── */}
      <button
        onClick={() => setCoachOpen(p => !p)}
        style={{
          position: 'fixed', bottom: 28, right: 28,
          padding: '13px 22px', borderRadius: 100,
          background: 'rgba(10,10,10,0.92)', border: '1px solid rgba(255,110,180,0.35)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(255,110,180,0.15)',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          transition: 'all .25s', zIndex: 90,
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'rgba(255,110,180,0.9)',
          boxShadow: '0 0 8px rgba(255,110,180,0.5)',
          animation: 'pulse 2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.92)' }}>
            {coachOpen ? 'Close Coach' : 'Ask AI Coach'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
            {queriesLeft}/5 per game
          </div>
        </div>
      </button>

      {/* ── AI Coach panel ────────────────────────────────────────────────── */}
      {coachOpen && (
        <div style={{
          position: 'fixed', bottom: 100, right: 28, zIndex: 91,
          width: 'min(360px, calc(100vw - 56px))',
          background: 'rgba(12,12,12,0.97)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(24px)',
          display: 'flex', flexDirection: 'column', maxHeight: 420,
        } as React.CSSProperties}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 400 }}>AI Coach</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              {queriesLeft > 0 ? `${queriesLeft} free ${queriesLeft === 1 ? 'query' : 'queries'} per game` : 'Upgrade for unlimited →'}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {coachMessages.length === 0 && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                Ask anything about the puzzle…
              </div>
            )}
            {coachMessages.map((msg, i) => (
              <div key={i} style={{
                fontSize: 13, lineHeight: 1.6,
                color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)',
                background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : 'transparent',
                padding: msg.role === 'user' ? '8px 12px' : '0',
                borderRadius: msg.role === 'user' ? 10 : 0,
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                {msg.text || (coachLoading && i === coachMessages.length - 1 ? '…' : '')}
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
            <input
              value={coachInput}
              onChange={e => setCoachInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCoachMessage(); } }}
              placeholder={queriesLeft === 0 ? 'No queries left' : 'Ask the coach…'}
              disabled={queriesLeft === 0 || coachLoading}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff',
                outline: 'none', fontFamily: 'inherit',
                opacity: queriesLeft === 0 ? 0.4 : 1,
              }}
            />
            <button
              onClick={sendCoachMessage}
              disabled={!coachInput.trim() || queriesLeft === 0 || coachLoading}
              style={{
                padding: '9px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                background: 'rgba(255,110,180,0.8)', color: '#fff', border: 'none',
                opacity: (!coachInput.trim() || queriesLeft === 0 || coachLoading) ? 0.4 : 1,
                transition: 'opacity .2s',
              }}
            >Send</button>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 100, padding: '10px 20px', fontSize: 13,
          color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', zIndex: 300,
          animation: 'fadeUp .25s ease', whiteSpace: 'nowrap',
        } as React.CSSProperties}>{toast}</div>
      )}

      {/* ── Victory modal ─────────────────────────────────────────────────── */}
      {complete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(12px)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
        } as React.CSSProperties}>
          <div style={{
            background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24, padding: 48, width: '100%', maxWidth: 380,
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, #ff6eb4 20%, #b06aff 40%, #6ab0ff 60%, #6affd4 80%, transparent)',
              backgroundSize: '200% 100%', animation: 'iris 4s linear infinite',
            }} />

            {/* Mini mosaic */}
            <div style={{
              width: 108, height: 108, borderRadius: 12, overflow: 'hidden',
              margin: '0 auto 20px', border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', width: '100%', height: '100%' }}>
                {mosaic.colors.map((row, r) => row.map((color, c) => (
                  <div key={`${r}-${c}`} style={{ background: color }} />
                )))}
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 32, color: '#fff', marginBottom: 6 }}>
              {t('daily_complete')}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
              {mosaic.name} · Day #{dayNumber % 1000}
            </div>
            <div style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 44, color: '#fff' }}>
              {formatTime(timer)}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>
              {mistakes} mistake{mistakes !== 1 ? 's' : ''}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `I completed today's ZenSudoku mosaic "${mosaic.name}" in ${formatTime(timer)} ✦ Day #${dayNumber % 1000} — zensudoku.com`
                  );
                  showToastFn('Copied to clipboard!');
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.75)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
                style={{
                  padding: '12px 24px', borderRadius: 100, fontSize: 13, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.9)', color: '#080808', border: 'none', transition: 'background .2s',
                }}
              >Share result</button>
              <button
                onClick={() => router.push('/')}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                style={{
                  padding: '12px 24px', borderRadius: 100, fontSize: 13, cursor: 'pointer',
                  background: 'transparent', color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)', transition: 'color .2s',
                }}
              >Back to home</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes iris { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
        @keyframes fadeUp { from{opacity:0;transform:translate(-50%,8px)} to{opacity:1;transform:translate(-50%,0)} }
      `}</style>

    </div>
  );
}
