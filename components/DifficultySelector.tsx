'use client';

import { motion } from 'framer-motion';
import { type Difficulty } from '@/lib/sudoku-engine';

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', desc: '~5 min' },
  { value: 'medium', label: 'Medium', desc: '~15 min' },
  { value: 'hard', label: 'Hard', desc: '~30 min' },
  { value: 'expert', label: 'Expert', desc: '~60 min' },
];

interface Props {
  current: Difficulty;
  onChange: (d: Difficulty) => void;
}

export function DifficultySelector({ current, onChange }: Props) {
  return (
    <div className="flex gap-1 p-1 bg-zinc-800/60 rounded-lg">
      {DIFFICULTIES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className="relative px-3 py-1.5 text-sm rounded-md transition-colors"
        >
          {current === value && (
            <motion.div
              layoutId="difficulty-pill"
              className="absolute inset-0 bg-zinc-700 rounded-md"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className={`relative z-10 ${current === value ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
