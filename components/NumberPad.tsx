'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onNumber: (n: number) => void;
  onErase: () => void;
  notesMode: boolean;
  remainingCounts: Record<number, number>;
  disabled?: boolean;
  hasSelection: boolean;
}

export function NumberPad({ onNumber, onErase, notesMode, remainingCounts, disabled, hasSelection }: Props) {
  const [flashNum, setFlashNum] = useState<number | null>(null);

  function handleNumber(n: number) {
    if (!hasSelection) {
      setFlashNum(n);
      setTimeout(() => setFlashNum(null), 320);
    }
    onNumber(n);
  }

  return (
    <div className={`grid grid-cols-5 md:grid-cols-3 gap-2 w-full ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
        const remaining = remainingCounts[n] ?? 9;
        const exhausted = remaining === 0;
        const flashing = flashNum === n;

        return (
          <motion.button
            key={n}
            onPointerDown={() => !exhausted && handleNumber(n)}
            animate={flashing ? { opacity: [1, 0.25, 1, 0.25, 1] } : {}}
            transition={flashing ? { duration: 0.32, ease: 'easeInOut' } : {}}
            whileTap={exhausted ? {} : { scale: 0.95 }}
            className="number-pad-btn flex flex-col items-center justify-center rounded-xl transition-all duration-150"
            style={{
              width: 'var(--pad-size, 56px)',
              height: 'var(--pad-size, 56px)',
              fontFamily: 'var(--font-playfair)',
              fontSize: 'var(--pad-font, 22px)',
              background: exhausted
                ? 'rgba(255,255,255,0.02)'
                : notesMode
                  ? 'rgba(106,176,255,0.08)'
                  : 'rgba(255,255,255,0.05)',
              border: exhausted
                ? '1px solid rgba(255,255,255,0.05)'
                : notesMode
                  ? '1px solid rgba(106,176,255,0.2)'
                  : '1px solid rgba(255,255,255,0.1)',
              color: exhausted
                ? 'rgba(255,255,255,0.15)'
                : notesMode
                  ? 'rgba(106,176,255,0.85)'
                  : 'rgba(255,255,255,0.85)',
              cursor: exhausted ? 'not-allowed' : 'pointer',
              opacity: exhausted ? 0.4 : 1,
            }}
          >
            {n}
            {!exhausted && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-dm)', lineHeight: 1, marginTop: 1 }}>
                {remaining}
              </span>
            )}
          </motion.button>
        );
      })}

      <motion.button
        onPointerDown={onErase}
        whileTap={{ scale: 0.95 }}
        className="number-pad-btn col-span-1 md:col-span-3 flex items-center justify-center rounded-xl transition-all duration-150"
        style={{
          width: 'var(--pad-size, 56px)',
          height: 'var(--pad-size, 56px)',
          background: 'rgba(255,110,180,0.05)',
          border: '1px solid rgba(255,110,180,0.18)',
          color: 'rgba(255,110,180,0.7)',
          fontSize: 'var(--pad-font, 22px)',
          cursor: 'pointer',
        }}
        aria-label="Erase"
      >
        ⌫
      </motion.button>
    </div>
  );
}
