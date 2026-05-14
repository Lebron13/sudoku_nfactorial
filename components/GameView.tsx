'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSudoku, MAX_MISTAKES, MAX_HINTS } from '@/hooks/useSudoku';
import { type Difficulty, type Puzzle, generatePuzzle, getDailyPuzzle } from '@/lib/sudoku-engine';
import { saveResult } from '@/lib/stats';
import { submitScore } from '@/lib/leaderboard';
import { SudokuGrid } from './SudokuGrid';
import { NumberPad } from './NumberPad';
import { WinModal } from './WinModal';
import { GameOverModal } from './GameOverModal';
import { AICoach } from './AICoach';
import { speakNumber } from './SeniorMode';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function toDifficulty(d: string): Difficulty {
  if (['easy', 'medium', 'hard', 'expert'].includes(d)) return d as Difficulty;
  return 'medium';
}

const DIFF_NAV = ['easy', 'medium', 'hard', 'expert'] as const;

interface Props {
  difficulty: string;
}

export function GameView({ difficulty: difficultyParam }: Props) {
  const isDaily = difficultyParam === 'daily';
  const initialDifficulty = isDaily ? 'medium' : toDifficulty(difficultyParam);
  const router = useRouter();

  const { state, newGame, selectCell, enterValue, toggleNote, erase, undo, useHint, pause, resume } = useSudoku();

  const [notesMode, setNotesMode] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>(initialDifficulty);
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const savedRef = useRef(false);
  const originalPuzzleRef = useRef<Puzzle | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => {
    setShowErrors(localStorage.getItem('zen_show_errors') !== 'false');
  }, []);

  useEffect(() => {
    localStorage.setItem('zen_show_errors', String(showErrors));
  }, [showErrors]);

  useEffect(() => {
    if (isDaily) {
      const today = new Date().toISOString().split('T')[0];
      const puzzle = getDailyPuzzle(today);
      originalPuzzleRef.current = puzzle;
      newGame('medium', puzzle);
    } else {
      const puzzle = generatePuzzle(initialDifficulty);
      originalPuzzleRef.current = puzzle;
      newGame(initialDifficulty, puzzle);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!state.difficulty || savedRef.current) return;
    if (state.isComplete || state.isGameOver) {
      savedRef.current = true;
      saveResult({
        difficulty: isDaily ? 'daily' : state.difficulty,
        time: state.elapsedSeconds,
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed,
        won: state.isComplete,
      });
      if (state.isComplete) {
        const stars =
          state.mistakes === 0 && state.hintsUsed === 0 ? 3 :
          state.mistakes <= 1 && state.hintsUsed <= 1 ? 2 : 1;
        submitScore({
          difficulty: isDaily ? 'daily' : state.difficulty,
          time: state.elapsedSeconds,
          mistakes: state.mistakes,
          stars,
          isDaily,
        });
      }
    }
  }, [state.isComplete, state.isGameOver, state.difficulty, state.elapsedSeconds, state.mistakes, state.hintsUsed, isDaily]);

  useEffect(() => {
    const handler = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pause]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (state.isGameOver) return;
      if (e.key >= '1' && e.key <= '9') {
        const n = parseInt(e.key);
        if (notesMode) { toggleNote(n); } else { enterValue(n); speakNumber(n); }
        return;
      }
      if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') { erase(); return; }
      if (e.key === 'z' && !e.shiftKey) { undo(); return; }
      if (e.key === 'n') { setNotesMode((m) => !m); return; }
      if (e.key === 'h') { useHint(); return; }
      if (e.key === ' ') { e.preventDefault(); state.isRunning ? pause() : resume(); return; }
      if (!state.selected) return;
      const [r, c] = state.selected;
      const dirs: Record<string, [number, number]> = {
        ArrowUp: [Math.max(0, r - 1), c],
        ArrowDown: [Math.min(8, r + 1), c],
        ArrowLeft: [r, Math.max(0, c - 1)],
        ArrowRight: [r, Math.min(8, c + 1)],
      };
      if (dirs[e.key]) { e.preventDefault(); selectCell(...dirs[e.key]); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [notesMode, state.selected, state.isRunning, state.isGameOver,
      enterValue, toggleNote, erase, undo, useHint, selectCell, pause, resume]);

  const handleNewGame = useCallback((d: Difficulty) => {
    const puzzle = generatePuzzle(d);
    originalPuzzleRef.current = puzzle;
    savedRef.current = false;
    setCurrentDifficulty(d);
    setNotesMode(false);
    newGame(d, puzzle);
  }, [newGame]);

  const handleRetry = useCallback(() => {
    savedRef.current = false;
    setNotesMode(false);
    if (originalPuzzleRef.current) {
      newGame(currentDifficulty, originalPuzzleRef.current);
    } else {
      newGame(currentDifficulty);
    }
  }, [newGame, currentDifficulty]);

  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent)

  const handleCellSelect = (r: number, c: number) => {
    selectCell(r, c)
    if (isMobile && hiddenInputRef.current) hiddenInputRef.current.focus()
  }

  const remainingCounts: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) {
    let count = 0;
    for (const row of state.board) {
      for (const cell of row) { if (cell.value === n) count++; }
    }
    remainingCounts[n] = 9 - count;
  }

  const paused = !state.isRunning && !state.isComplete && !state.isGameOver;
  const hintsLeft = MAX_HINTS - state.hintsUsed;

  if (!state.board.length) {
    return (
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 504 }}>
          <div className="animate-pulse" style={{ width: '100%', aspectRatio: '1', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }} />
          <div className="animate-pulse" style={{ height: 56, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

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
          if (v) {
            const n = parseInt(v)
            if (notesMode) { toggleNote(n) } else { enterValue(n); speakNumber(n) }
          }
          e.target.value = ''
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Backspace' || e.key === 'Delete') && state.selected) erase()
        }}
        style={{ position: 'fixed', bottom: -100, left: '50%', width: 1, height: 1, opacity: 0, pointerEvents: 'none', fontSize: 16 }}
        readOnly={false}
      />

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header style={{
        height: 64,
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      } as React.CSSProperties}>

        <span
          onClick={() => router.push('/')}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-dm)', fontWeight: 300, transition: 'color .2s', minWidth: 80 }}
        >
          ← Home
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 18, color: '#fff', lineHeight: 1 }}>ZenSudoku</span>
          {isDaily ? (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Daily Challenge</span>
          ) : (
            <div style={{ display: 'flex', gap: 0 }}>
              {DIFF_NAV.map(d => (
                <button
                  key={d}
                  onClick={() => router.push(`/game/${d}`)}
                  onMouseEnter={e => { if (currentDifficulty !== d) e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  onMouseLeave={e => { if (currentDifficulty !== d) e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                  style={{
                    fontSize: 12,
                    padding: '4px 14px',
                    borderRadius: 100,
                    cursor: 'pointer',
                    transition: 'all .2s',
                    fontFamily: 'var(--font-dm)',
                    fontWeight: 300,
                    background: currentDifficulty === d ? 'rgba(255,110,180,0.15)' : 'transparent',
                    color: currentDifficulty === d ? '#ff6eb4' : 'rgba(255,255,255,0.35)',
                    border: currentDifficulty === d ? '1px solid rgba(255,110,180,0.3)' : '1px solid transparent',
                  }}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 80, justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, color: '#fff', letterSpacing: '0.04em' }}>
              {formatTime(state.elapsedSeconds)}
            </span>
            <button
              onClick={paused ? resume : pause}
              aria-label={paused ? 'Resume' : 'Pause'}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', transition: 'border-color .2s, color .2s', fontSize: 11, flexShrink: 0 }}
            >
              {paused ? '▶' : '⏸'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!showErrors && (
              <span style={{ fontSize: 10, color: 'rgba(255,110,180,0.5)', letterSpacing: '0.06em', fontFamily: 'var(--font-dm)', fontWeight: 300 }}>
                Hard mode
              </span>
            )}
            <div style={{ display: 'flex', gap: 5 }}>
              {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={i === state.mistakes - 1 && showErrors ? { scale: [1, 1.6, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: i < state.mistakes && showErrors ? 'rgba(255,110,180,0.8)' : 'rgba(255,255,255,0.12)' }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">

          {/* Grid + pause overlay */}
          <div style={{ position: 'relative' }}>
            <SudokuGrid
              board={state.board}
              selected={paused ? null : state.selected}
              onSelect={handleCellSelect}
              masked={paused}
              showErrors={showErrors || state.isGameOver}
            />
            <AnimatePresence>
              {paused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={resume}
                  style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: 12, cursor: 'pointer', gap: 8 } as React.CSSProperties}
                >
                  <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 32, color: 'rgba(255,255,255,0.6)' }}>Paused</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-dm)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>Tap to resume</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-5 w-full md:w-[200px] md:flex-none">

            {/* Controls */}
            <div className="flex flex-row md:flex-col gap-3">
              <ControlBtn
                icon="💡"
                label="Hint"
                sub={hintsLeft === 0 ? 'none left' : `${hintsLeft} remaining`}
                disabled={state.isComplete || state.isGameOver}
                active={false}
                onClick={() => {
                  if (hintsLeft === 0) { showToast('No hints remaining'); return; }
                  useHint();
                }}
                hovered={hoveredControl === 'hint'}
                onHover={() => setHoveredControl('hint')}
                onLeave={() => setHoveredControl(null)}
              />
              <ControlBtn
                icon="✏️"
                label="Notes"
                sub={notesMode ? 'On' : 'Off'}
                active={notesMode}
                onClick={() => setNotesMode(m => !m)}
                hovered={hoveredControl === 'notes'}
                onHover={() => setHoveredControl('notes')}
                onLeave={() => setHoveredControl(null)}
              />
              <ControlBtn
                icon="↩"
                label="Undo"
                sub="last move"
                disabled={state.history.length === 0 || state.isGameOver}
                active={false}
                onClick={undo}
                hovered={hoveredControl === 'undo'}
                onHover={() => setHoveredControl('undo')}
                onLeave={() => setHoveredControl(null)}
              />
            </div>

            {/* Error highlight toggle */}
            <ErrorToggle showErrors={showErrors} onToggle={() => setShowErrors(v => !v)} />

            {/* Number pad */}
            <NumberPad
              onNumber={(n) => {
                if (!state.selected) { showToast('Select a cell first'); return; }
                if (notesMode) { toggleNote(n); } else { enterValue(n); speakNumber(n); }
              }}
              onErase={erase}
              notesMode={notesMode}
              remainingCounts={remainingCounts}
              disabled={paused || state.isComplete || state.isGameOver}
              hasSelection={state.selected !== null}
            />

            <button
              onClick={handleRetry}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 300, padding: '4px 0', transition: 'color .2s' }}
            >
              Restart puzzle
            </button>
          </div>
        </div>
      </main>

      {/* AI Coach */}
      {state.board.length > 0 && !state.isGameOver && (
        <AICoach
          board={state.board}
          solution={state.solution}
          difficulty={state.difficulty}
          selected={state.selected}
        />
      )}

      <WinModal
        isOpen={state.isComplete}
        difficulty={isDaily ? 'daily' : state.difficulty}
        elapsedSeconds={state.elapsedSeconds}
        mistakes={state.mistakes}
        hintsUsed={state.hintsUsed}
        onNewGame={handleNewGame}
        onClose={() => {}}
      />
      <GameOverModal
        isOpen={state.isGameOver}
        difficulty={isDaily ? 'daily' : state.difficulty}
        onRetry={handleRetry}
        onNewGame={handleNewGame}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 12, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -4, x: '-50%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              bottom: 100,
              left: '50%',
              background: 'rgba(20,20,20,0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 100,
              padding: '10px 20px',
              fontSize: 13,
              color: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 300,
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-dm)',
              fontWeight: 300,
              pointerEvents: 'none',
            } as React.CSSProperties}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ControlBtnProps {
  icon: string;
  label: string;
  sub: string;
  disabled?: boolean;
  active: boolean;
  onClick: () => void;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function ErrorToggle({ showErrors, onToggle }: { showErrors: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>👁</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-dm)', fontWeight: 300, lineHeight: 1.3 }}>Show errors</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm)', marginTop: 1 }}>Highlight mistakes</div>
        </div>
      </div>
      <div style={{ width: 44, height: 24, borderRadius: 100, background: showErrors ? 'rgba(255,110,180,0.7)' : 'rgba(255,255,255,0.12)', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: showErrors ? 23 : 3, transition: 'left .25s cubic-bezier(.16,1,.3,1)' }} />
      </div>
    </div>
  );
}

function ControlBtn({ icon, label, sub, disabled = false, active, onClick, hovered, onHover, onLeave }: ControlBtnProps) {
  return (
    <button
      onClick={() => !disabled && onClick()}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        flex: 1,
        padding: '14px 16px',
        borderRadius: 12,
        background: active
          ? 'rgba(255,110,180,0.12)'
          : hovered && !disabled
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.04)',
        border: active
          ? '1px solid rgba(255,110,180,0.3)'
          : hovered && !disabled
            ? '1px solid rgba(255,255,255,0.2)'
            : '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background .2s, border-color .2s',
        opacity: disabled ? 0.35 : 1,
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, color: active ? '#ff6eb4' : 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-dm)', fontWeight: 300, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 11, color: active ? 'rgba(255,110,180,0.6)' : 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm)', marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  );
}
