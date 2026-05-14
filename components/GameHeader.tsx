'use client';

import Link from 'next/link';
import { type Difficulty } from '@/lib/sudoku-engine';

interface Props {
  difficulty: Difficulty | 'daily';
}

const BADGE: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
  medium: { label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20' },
  hard:   { label: 'Hard',   color: 'text-orange-400 bg-orange-500/10 ring-orange-500/20' },
  expert: { label: 'Expert', color: 'text-red-400 bg-red-500/10 ring-red-500/20' },
  daily:  { label: 'Daily',  color: 'text-blue-400 bg-blue-500/10 ring-blue-500/20' },
};

export function GameHeader({ difficulty }: Props) {
  const badge = BADGE[difficulty] ?? BADGE.easy;

  return (
    <header className="flex items-center justify-between w-full max-w-[540px] py-4 px-1">
      <Link
        href="/"
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Home
      </Link>

      <span className="text-base font-semibold tracking-tight text-zinc-100">ZenSudoku</span>

      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${badge.color}`}
      >
        {badge.label}
      </span>
    </header>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
