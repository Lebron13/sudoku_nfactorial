'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type CellState } from '@/hooks/useSudoku';
import { type Difficulty } from '@/lib/sudoku-engine';

const SESSION_LIMIT = 5;

const EXAMPLE_PROMPTS = [
  'What strategy should I use?',
  'Why does this number fit?',
  'Explain naked pairs',
  'What is a hidden single?',
];


interface Props {
  board: CellState[][];
  solution: number[][];
  difficulty: Difficulty;
  selected: [number, number] | null;
}

export function AICoach({ board, solution, difficulty: _difficulty, selected }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [queriesUsed, setQueriesUsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [response]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const hasReachedLimit = queriesUsed >= SESSION_LIMIT;
  const queriesLeft = SESSION_LIMIT - queriesUsed;
  const selectedHasValue = selected ? board[selected[0]]?.[selected[1]]?.value !== 0 : false;

  const askCoach = useCallback(
    async (prompt?: string) => {
      if (hasReachedLimit || isStreaming) return;

      const q = prompt ?? question.trim();
      setLastQuestion(q || (selected ? `Explain cell R${selected[0] + 1}C${selected[1] + 1}` : ''));

      setResponse('');
      setError(null);
      setIsStreaming(true);
      abortRef.current = new AbortController();

      const rawBoard = board.map((row) => row.map((c) => c.value));

      try {
        const res = await fetch('/api/ai-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            board: rawBoard,
            solution,
            selectedCell: selected,
            userQuestion: q || undefined,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);
        if (!res.body) throw new Error('No body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setResponse(text);
        }

        setQueriesUsed((prev) => prev + 1);
        setQuestion('');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError('Coach is unavailable. Check your ANTHROPIC_API_KEY.');
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [board, solution, selected, question, hasReachedLimit, isStreaming]
  );

  function handleClose() {
    if (isStreaming) abortRef.current?.abort();
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askCoach();
    }
  }

  const sendDisabled = hasReachedLimit || isStreaming || (!question.trim() && !selected);
  const hasContent = response || isStreaming || error;

  return (
    <>
      {/* ── Floating trigger ──────────────────────────────────────────── */}
      <motion.button
        data-coach="button"
        onClick={() => setIsOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        aria-label={isOpen ? 'Close AI Coach' : 'Open AI Coach'}
        onMouseEnter={e => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'rgba(255,110,180,0.65)';
            e.currentTarget.style.boxShadow = '0 8px 40px rgba(255,110,180,0.28), inset 0 1px 0 rgba(255,255,255,0.08)';
          }
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'rgba(255,110,180,0.35)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,110,180,0.15), inset 0 1px 0 rgba(255,255,255,0.08)';
          }
        }}
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 101,
          padding: '13px 22px',
          borderRadius: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(10,10,10,0.92)',
          border: isOpen
            ? '1px solid rgba(255,255,255,0.2)'
            : '1px solid rgba(255,110,180,0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isOpen
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(255,110,180,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
          cursor: 'pointer',
          transition: 'border-color .25s, box-shadow .25s',
        } as React.CSSProperties}
      >
        {isOpen ? (
          <>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>✕</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}>Close</span>
          </>
        ) : (
          <>
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,110,180,0.9)', boxShadow: '0 0 8px rgba(255,110,180,0.5)', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.92)', fontFamily: 'var(--font-dm)', fontWeight: 400, lineHeight: 1.25 }}>Ask AI Coach</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm)', letterSpacing: '0.04em', lineHeight: 1.25 }}>
                {queriesLeft}/{SESSION_LIMIT} per game
              </span>
            </div>
          </>
        )}
      </motion.button>

      {/* ── Panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-coach="panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              bottom: 100,
              right: 28,
              width: 'min(380px, calc(100vw - 56px))',
              borderRadius: 20,
              background: 'rgba(10,10,10,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
              overflow: 'hidden',
              zIndex: 100,
            } as React.CSSProperties}
          >
            {/* Iridescent top line */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent, #ff6eb4, #b06aff, #6ab0ff, transparent)',
              backgroundSize: '200% 100%',
              animation: 'iris 4s linear infinite',
            }} />

            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-playfair)', fontSize: 16, color: '#fff', fontWeight: 400 }}>AI Coach</span>
                <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,110,180,0.12)', color: '#ff6eb4', border: '1px solid rgba(255,110,180,0.25)', letterSpacing: '0.06em', fontFamily: 'var(--font-dm)' }}>
                  Claude ✦
                </span>
              </div>
              <button
                onClick={handleClose}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s, color .15s', flexShrink: 0, lineHeight: 1 }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              ref={messagesRef}
              className="coach-scroll"
              style={{ padding: '16px 20px', maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {!hasContent && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-dm)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.6 }}>
                  Ask about strategy, a specific cell, or a technique.
                </p>
              )}

              {lastQuestion && hasContent && (
                <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'rgba(255,110,180,0.08)', border: '1px solid rgba(255,110,180,0.15)', borderRadius: 14, padding: '10px 14px', fontSize: 13, color: 'rgba(255,110,180,0.85)', fontFamily: 'var(--font-dm)', fontWeight: 300, lineHeight: 1.6 }}>
                  {lastQuestion}
                </div>
              )}

              {(response || isStreaming || error) && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', fontSize: 13, color: error ? 'rgba(255,100,100,0.85)' : 'rgba(255,255,255,0.78)', fontFamily: 'var(--font-dm)', fontWeight: 300, lineHeight: 1.7 }}>
                  {isStreaming && !response && <ThinkingDots />}
                  {response && (
                    <span style={{ whiteSpace: 'pre-wrap' }}>
                      {response}
                      {isStreaming && (
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.9 }}
                          style={{ display: 'inline-block', width: 2, height: 13, background: 'rgba(255,110,180,0.9)', marginLeft: 2, verticalAlign: 'middle' }}
                        />
                      )}
                    </span>
                  )}
                  {error && !response && error}
                </div>
              )}
            </div>

            {/* Suggested chips */}
            <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selected && !selectedHasValue && (
                <Chip
                  label={`Explain R${selected[0] + 1}C${selected[1] + 1}`}
                  onClick={() => askCoach()}
                  disabled={hasReachedLimit || isStreaming}
                  accent
                />
              )}
              {EXAMPLE_PROMPTS.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  onClick={() => { setQuestion(p); askCoach(p); }}
                  disabled={hasReachedLimit || isStreaming}
                />
              ))}
            </div>

            {/* Input row */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={hasReachedLimit ? 'Daily limit reached' : 'Ask a question…'}
                disabled={hasReachedLimit || isStreaming}
                style={{
                  flex: 1,
                  background: inputFocused ? 'rgba(255,110,180,0.05)' : 'rgba(255,255,255,0.05)',
                  border: inputFocused ? '1px solid rgba(255,110,180,0.35)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '11px 16px',
                  fontSize: 13,
                  color: '#fff',
                  fontFamily: 'var(--font-dm)',
                  fontWeight: 300,
                  outline: 'none',
                  transition: 'border-color .2s, background .2s',
                  opacity: hasReachedLimit || isStreaming ? 0.45 : 1,
                }}
              />
              <motion.button
                onClick={() => askCoach()}
                whileTap={{ scale: 0.88 }}
                disabled={sendDisabled}
                onMouseEnter={e => { if (!sendDisabled) e.currentTarget.style.background = 'rgba(255,110,180,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,110,180,0.15)'; }}
                aria-label="Send"
                style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,110,180,0.15)', border: '1px solid rgba(255,110,180,0.25)', color: '#ff6eb4', fontSize: 18, cursor: sendDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s', opacity: sendDisabled ? 0.35 : 1, flexShrink: 0 }}
              >
                ↑
              </motion.button>
            </div>

            {/* Footer */}
            <div style={{ padding: '0 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '0.04em',
                  fontFamily: 'var(--font-dm)',
                  color: hasReachedLimit
                    ? 'rgba(255,80,80,0.5)'
                    : queriesLeft === 1
                      ? 'rgba(255,180,80,0.6)'
                      : 'rgba(255,255,255,0.25)',
                  cursor: hasReachedLimit ? 'pointer' : 'default',
                }}
              >
                {hasReachedLimit
                  ? 'Upgrade for unlimited →'
                  : `${queriesLeft} free ${queriesLeft === 1 ? 'query' : 'queries'} per game`}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-dm)', letterSpacing: '0.04em' }}>
                AI-powered by Claude
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Chip({ label, onClick, disabled, accent }: { label: string; onClick: () => void; disabled: boolean; accent?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.background = accent ? 'rgba(106,176,255,0.1)' : 'rgba(255,110,180,0.08)';
          e.currentTarget.style.borderColor = accent ? 'rgba(106,176,255,0.25)' : 'rgba(255,110,180,0.2)';
          e.currentTarget.style.color = accent ? 'rgba(106,176,255,0.85)' : 'rgba(255,110,180,0.8)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
      }}
      style={{
        fontSize: 11,
        padding: '5px 12px',
        borderRadius: 100,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: 'rgba(255,255,255,0.45)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .2s',
        fontFamily: 'var(--font-dm)',
        fontWeight: 300,
        opacity: disabled ? 0.38 : 1,
      }}
    >
      {label}
    </button>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.75, 1, 0.75] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,110,180,0.55)', display: 'inline-block' }}
        />
      ))}
    </div>
  );
}
