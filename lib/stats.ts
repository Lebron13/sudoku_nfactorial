export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'daily';

export interface GameResult {
  id: string;
  date: string; // YYYY-MM-DD
  difficulty: GameDifficulty;
  time: number; // seconds
  mistakes: number;
  hintsUsed: number;
  won: boolean;
}

const KEY = 'zensudoku-stats-v1';

export function getResults(): GameResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveResult(r: Omit<GameResult, 'id' | 'date'>): void {
  if (typeof window === 'undefined') return;
  const existing = getResults();
  const today = new Date().toISOString().split('T')[0];
  existing.push({ ...r, id: String(Date.now()), date: today });
  localStorage.setItem(KEY, JSON.stringify(existing.slice(-500)));
}
