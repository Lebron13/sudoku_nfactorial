'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  type Difficulty,
  type Puzzle,
  generatePuzzle,
  isComplete,
  validateBoard,
} from '@/lib/sudoku-engine';

export type CellState = {
  value: number;
  isGiven: boolean;
  isHint: boolean;
  notes: Set<number>;
  isConflict: boolean;
};

type GameState = {
  board: CellState[][];
  solution: number[][];
  seed: string;
  difficulty: Difficulty;
  selected: [number, number] | null;
  mistakes: number;
  isComplete: boolean;
  isGameOver: boolean;
  hintsUsed: number;
  elapsedSeconds: number;
  isRunning: boolean;
  history: CellState[][][];
};

type Action =
  | { type: 'NEW_GAME'; puzzle: Puzzle; difficulty: Difficulty }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'ENTER_VALUE'; value: number }
  | { type: 'TOGGLE_NOTE'; value: number }
  | { type: 'ERASE' }
  | { type: 'UNDO' }
  | { type: 'USE_HINT' }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

export const MAX_MISTAKES = 3;
export const MAX_HINTS = 3;

function buildBoard(puzzle: Puzzle): CellState[][] {
  return puzzle.puzzle.map((row) =>
    row.map((val) => ({
      value: val,
      isGiven: val !== 0,
      isHint: false,
      notes: new Set<number>(),
      isConflict: false,
    }))
  );
}

function applyConflicts(board: CellState[][]): CellState[][] {
  const raw = board.map((row) => row.map((c) => c.value));
  const { conflicts } = validateBoard(raw);
  const conflictSet = new Set(conflicts.map(([r, c]) => `${r},${c}`));
  return board.map((row, r) =>
    row.map((cell, c) => ({ ...cell, isConflict: conflictSet.has(`${r},${c}`) }))
  );
}

function cloneBoard(board: CellState[][]): CellState[][] {
  return board.map((row) => row.map((c) => ({ ...c, notes: new Set(c.notes) })));
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME': {
      return {
        ...state,
        board: buildBoard(action.puzzle),
        solution: action.puzzle.solution,
        seed: action.puzzle.seed,
        difficulty: action.difficulty,
        selected: null,
        mistakes: 0,
        isComplete: false,
        isGameOver: false,
        hintsUsed: 0,
        elapsedSeconds: 0,
        isRunning: true,
        history: [],
      };
    }

    case 'SELECT_CELL':
      return { ...state, selected: [action.row, action.col] };

    case 'ENTER_VALUE': {
      if (!state.selected || state.isComplete || state.isGameOver) return state;
      const [row, col] = state.selected;
      const cell = state.board[row][col];
      if (cell.isGiven || cell.isHint) return state;

      const prev = cloneBoard(state.board);
      const next = cloneBoard(state.board);
      next[row][col] = { ...next[row][col], value: action.value, notes: new Set() };

      // Clear placed number from notes of all cells in same row, col, and 3×3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (r === row && c === col) continue;
          if (r === row || c === col || (r >= boxRow && r < boxRow + 3 && c >= boxCol && c < boxCol + 3)) {
            next[r][c].notes.delete(action.value);
          }
        }
      }

      const withConflicts = applyConflicts(next);
      const raw = withConflicts.map((r) => r.map((c) => c.value));
      const complete = isComplete(raw, state.solution);

      const wasWrong = action.value !== 0 && state.solution[row][col] !== action.value;
      const newMistakes = wasWrong ? state.mistakes + 1 : state.mistakes;
      const gameOver = newMistakes >= MAX_MISTAKES;

      return {
        ...state,
        board: withConflicts,
        mistakes: newMistakes,
        isComplete: complete,
        isGameOver: gameOver,
        isRunning: complete || gameOver ? false : state.isRunning,
        history: [...state.history, prev],
      };
    }

    case 'TOGGLE_NOTE': {
      if (!state.selected || state.isComplete || state.isGameOver) return state;
      const [row, col] = state.selected;
      const cell = state.board[row][col];
      if (cell.isGiven || cell.isHint || cell.value !== 0) return state;

      const prev = cloneBoard(state.board);
      const next = cloneBoard(state.board);
      const notes = new Set(next[row][col].notes);
      if (notes.has(action.value)) notes.delete(action.value);
      else notes.add(action.value);
      next[row][col] = { ...next[row][col], notes };

      return { ...state, board: next, history: [...state.history, prev] };
    }

    case 'ERASE': {
      if (!state.selected || state.isComplete || state.isGameOver) return state;
      const [row, col] = state.selected;
      const cell = state.board[row][col];
      if (cell.isGiven || cell.isHint) return state;

      const prev = cloneBoard(state.board);
      const next = cloneBoard(state.board);
      next[row][col] = { ...next[row][col], value: 0, notes: new Set() };

      return {
        ...state,
        board: applyConflicts(next),
        history: [...state.history, prev],
      };
    }

    case 'UNDO': {
      if (state.history.length === 0 || state.isGameOver) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        board: applyConflicts(prev),
        history: state.history.slice(0, -1),
        isComplete: false,
        isRunning: true,
      };
    }

    case 'USE_HINT': {
      if (state.hintsUsed >= MAX_HINTS || state.isComplete || state.isGameOver) return state;

      // Find empty cells, prefer selected
      const emptyCells: [number, number][] = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (state.board[r][c].value === 0) emptyCells.push([r, c]);
        }
      }
      if (emptyCells.length === 0) return state;

      const [selR, selC] = state.selected ?? [-1, -1];
      const target =
        selR >= 0 && state.board[selR][selC].value === 0
          ? ([selR, selC] as [number, number])
          : emptyCells[0];

      const [row, col] = target;
      const hintValue = state.solution[row][col];
      const prev = cloneBoard(state.board);
      const next = cloneBoard(state.board);
      next[row][col] = { ...next[row][col], value: hintValue, isHint: true, notes: new Set() };

      // Clear hint value from notes of all cells in same row, col, and 3×3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (r === row && c === col) continue;
          if (r === row || c === col || (r >= boxRow && r < boxRow + 3 && c >= boxCol && c < boxCol + 3)) {
            next[r][c].notes.delete(hintValue);
          }
        }
      }

      const withConflicts = applyConflicts(next);
      const raw = withConflicts.map((r) => r.map((c) => c.value));
      const complete = isComplete(raw, state.solution);

      return {
        ...state,
        board: withConflicts,
        hintsUsed: state.hintsUsed + 1,
        isComplete: complete,
        isRunning: complete ? false : state.isRunning,
        history: [...state.history, prev],
      };
    }

    case 'TICK':
      return state.isRunning ? { ...state, elapsedSeconds: state.elapsedSeconds + 1 } : state;

    case 'PAUSE':
      return state.isGameOver || state.isComplete ? state : { ...state, isRunning: false };

    case 'RESUME':
      return state.isGameOver || state.isComplete ? state : { ...state, isRunning: true };

    default:
      return state;
  }
}

const initialState: GameState = {
  board: [],
  solution: [],
  seed: '',
  difficulty: 'easy',
  selected: null,
  mistakes: 0,
  isComplete: false,
  isGameOver: false,
  hintsUsed: 0,
  elapsedSeconds: 0,
  isRunning: false,
  history: [],
};

export function useSudoku() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const newGame = useCallback((difficulty: Difficulty, puzzle?: Puzzle) => {
    const p = puzzle ?? generatePuzzle(difficulty);
    dispatch({ type: 'NEW_GAME', puzzle: p, difficulty });
  }, []);

  const selectCell = useCallback((row: number, col: number) =>
    dispatch({ type: 'SELECT_CELL', row, col }), []);

  const enterValue = useCallback((value: number) =>
    dispatch({ type: 'ENTER_VALUE', value }), []);

  const toggleNote = useCallback((value: number) =>
    dispatch({ type: 'TOGGLE_NOTE', value }), []);

  const erase = useCallback(() => dispatch({ type: 'ERASE' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const useHint = useCallback(() => dispatch({ type: 'USE_HINT' }), []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), []);

  return { state, newGame, selectCell, enterValue, toggleNote, erase, undo, useHint, pause, resume };
}
