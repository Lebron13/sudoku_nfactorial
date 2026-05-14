'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { type Difficulty } from '@/lib/sudoku-engine';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function getStars(mistakes: number, hintsUsed: number): number {
  if (mistakes === 0 && hintsUsed === 0) return 3;
  if (mistakes <= 1 && hintsUsed <= 1) return 2;
  return 1;
}

interface Props {
  isOpen: boolean;
  difficulty: Difficulty | 'daily';
  elapsedSeconds: number;
  mistakes: number;
  hintsUsed: number;
  onNewGame: (d: Difficulty) => void;
  onClose: () => void;
}

export function WinModal({ isOpen, difficulty, elapsedSeconds, mistakes, hintsUsed, onNewGame, onClose }: Props) {
  const router = useRouter();
  const firedRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const stars = getStars(mistakes, hintsUsed);

  useEffect(() => {
    if (isOpen && !firedRef.current) {
      firedRef.current = true;
      const end = Date.now() + 2000;
      const colors = ['#ff6eb4', '#b06aff', '#6ab0ff', '#6affd4'];
      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors });
        confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
    if (!isOpen) firedRef.current = false;
  }, [isOpen]);

  function handleShare() {
    const mistakeText = mistakes === 1 ? '1 mistake' : `${mistakes} mistakes`;
    const diffLabel = difficulty === 'daily' ? 'Daily' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    const text = `I solved ${diffLabel} ZenSudoku in ${formatTime(elapsedSeconds)} with ${mistakeText}! ✦ zensudoku.com`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const irisStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    background: 'linear-gradient(90deg, transparent, #ff6eb4 20%, #b06aff 40%, #6ab0ff 60%, #6affd4 80%, transparent)',
    backgroundSize: '200% 100%',
    animation: 'iris 4s linear infinite',
    opacity: 0.7,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 48, width: '100%', maxWidth: 400, textAlign: 'center', position: 'relative', overflow: 'hidden' }}
          >
            <div style={irisStyle} />

            {/* Icon */}
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 52, color: '#fff', marginBottom: 10, lineHeight: 1 }}>✦</div>

            {/* Title */}
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 32, fontWeight: 400, color: '#fff', marginBottom: 4 }}>
              Puzzle solved.
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm)', fontWeight: 300, textTransform: 'capitalize', letterSpacing: '0.06em', marginBottom: 16 }}>
              {difficulty === 'daily' ? 'Daily challenge' : `${difficulty} difficulty`}
            </p>

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 380 }}
                  style={{ fontSize: 28, color: i <= stars ? 'rgba(255,200,80,0.9)' : 'rgba(255,255,255,0.12)' }}
                >
                  ★
                </motion.span>
              ))}
            </div>

            {/* Time */}
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: 44, color: '#fff', lineHeight: 1, marginBottom: 6 }}>
              {formatTime(elapsedSeconds)}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm)', fontWeight: 300, marginBottom: 32 }}>
              {mistakes === 0 ? 'No mistakes' : mistakes === 1 ? '1 mistake' : `${mistakes} mistakes`}
              {hintsUsed > 0 ? ` · ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}` : ''}
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              style={{ width: '100%', padding: '11px 24px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 300, transition: 'border-color .2s, color .2s', marginBottom: 10 }}
            >
              {copied ? 'Copied to clipboard' : 'Share result'}
            </button>

            {/* Play again — same difficulty */}
            <button
              onClick={() => onNewGame(difficulty === 'daily' ? 'medium' : difficulty as Difficulty)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.85)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.92)')}
              style={{ width: '100%', padding: '13px 28px', borderRadius: 100, background: 'rgba(255,255,255,0.92)', color: '#080808', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 400, transition: 'background .2s', marginBottom: 24 }}
            >
              Play again
            </button>

            {/* Other difficulties */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 20 }}>
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => onNewGame(d)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  style={{ padding: '8px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: d === difficulty ? 'rgba(255,110,180,0.8)' : 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 300, transition: 'all .2s', textTransform: 'capitalize' }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Back home */}
            <button
              onClick={() => router.push('/')}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 300, transition: 'color .2s' }}
            >
              Back to home
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
