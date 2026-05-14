'use client';

import { motion } from 'framer-motion';
import { MAX_MISTAKES, MAX_HINTS } from '@/hooks/useSudoku';

interface Props {
  elapsedSeconds: number;
  mistakes: number;
  hintsUsed: number;
  notesMode: boolean;
  isRunning: boolean;
  isComplete: boolean;
  isGameOver: boolean;
  onHint: () => void;
  onToggleNotes: () => void;
  onUndo: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function GameControls({
  elapsedSeconds,
  mistakes,
  hintsUsed,
  notesMode,
  isRunning,
  isComplete,
  isGameOver,
  onHint,
  onToggleNotes,
  onUndo,
  onPause,
  onResume,
}: Props) {
  const hintsLeft = MAX_HINTS - hintsUsed;
  const paused = !isRunning && !isComplete && !isGameOver;

  return (
    <div className="flex items-center justify-between w-full max-w-[396px]">
      {/* Left: timer + mistakes */}
      <div className="flex items-center gap-4">
        <button
          onClick={paused ? onResume : onPause}
          className="flex items-center gap-1.5 text-sm font-mono tabular-nums text-zinc-300 hover:text-zinc-100 transition-colors"
          aria-label={paused ? 'Resume' : 'Pause'}
        >
          <span>{formatTime(elapsedSeconds)}</span>
          {paused ? (
            <PlayIcon className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <PauseIcon className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </button>

        <div className="flex items-center gap-1" aria-label={`${mistakes} of ${MAX_MISTAKES} mistakes`}>
          {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
            <motion.div
              key={i}
              animate={i === mistakes - 1 ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < mistakes ? 'bg-red-500' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        <ControlBtn
          onClick={onHint}
          disabled={hintsLeft === 0 || isComplete || isGameOver}
          label={`Hint (${hintsLeft})`}
          title={`Use hint — ${hintsLeft} left`}
        >
          <LightbulbIcon className="w-4 h-4" />
        </ControlBtn>

        <ControlBtn
          onClick={onToggleNotes}
          active={notesMode}
          label="Notes"
          title={notesMode ? 'Notes on' : 'Notes off'}
        >
          <PencilIcon className="w-4 h-4" />
        </ControlBtn>

        <ControlBtn onClick={onUndo} label="Undo" title="Undo" disabled={isGameOver}>
          <UndoIcon className="w-4 h-4" />
        </ControlBtn>
      </div>
    </div>
  );
}

function ControlBtn({
  children,
  onClick,
  disabled,
  active,
  label,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
  title?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={disabled ? {} : { scale: 0.88 }}
      disabled={disabled}
      title={title}
      className={`
        flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] leading-none
        transition-colors duration-100
        ${disabled
          ? 'opacity-30 cursor-not-allowed text-zinc-500'
          : active
            ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }
      `}
    >
      {children}
      <span>{label}</span>
    </motion.button>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>;
}
function PlayIcon({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z" /></svg>;
}
function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}
function UndoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
}
