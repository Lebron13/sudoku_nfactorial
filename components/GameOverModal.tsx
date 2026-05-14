'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { type Difficulty } from '@/lib/sudoku-engine';

interface Props {
  isOpen: boolean;
  difficulty: Difficulty | 'daily';
  onRetry: () => void;
  onNewGame: (d: Difficulty) => void;
}

export function GameOverModal({ isOpen, difficulty, onRetry, onNewGame }: Props) {
  const router = useRouter();

  const errorLine: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,80,80,0.6) 30%, rgba(255,120,60,0.5) 70%, transparent)',
    backgroundSize: '200% 100%',
    animation: 'iris 4s linear infinite',
    opacity: 0.8,
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
            <div style={errorLine} />

            {/* Icon */}
            <div style={{ fontSize: 48, color: 'rgba(255,80,80,0.8)', marginBottom: 12, lineHeight: 1 }}>✕</div>

            {/* Title */}
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 32, fontWeight: 400, color: '#fff', marginBottom: 10 }}>
              3 mistakes.
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm)', fontWeight: 300, lineHeight: 1.6, marginBottom: 36 }}>
              The puzzle got the better of you this time.{' '}
              <span style={{ textTransform: 'capitalize' }}>
                {difficulty === 'daily' ? 'Daily challenge' : `${difficulty} mode`}.
              </span>
            </p>

            {/* Try again — same puzzle */}
            <button
              onClick={onRetry}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.85)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.92)')}
              style={{ width: '100%', padding: '13px 28px', borderRadius: 100, background: 'rgba(255,255,255,0.92)', color: '#080808', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 400, transition: 'background .2s', marginBottom: 8 }}
            >
              Try again
            </button>

            {/* New puzzle — fresh puzzle same difficulty */}
            <button
              onClick={() => onNewGame(difficulty === 'daily' ? 'medium' : difficulty as Difficulty)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              style={{ width: '100%', padding: '11px 28px', borderRadius: 100, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-dm)', fontWeight: 300, transition: 'border-color .2s, color .2s', marginBottom: 20 }}
            >
              New puzzle
            </button>

            {/* Other difficulties */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 24 }}>
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => onNewGame(d)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = d === difficulty ? 'rgba(255,110,180,0.8)' : 'rgba(255,255,255,0.4)'; }}
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
