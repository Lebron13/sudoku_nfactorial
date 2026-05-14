export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Puzzle {
  puzzle: number[][];
  solution: number[][];
  seed: string;
}

export interface ValidationResult {
  valid: boolean;
  conflicts: [number, number][];
}

// Cells to remove per difficulty
const HOLES: Record<Difficulty, number> = {
  easy: 36,
  medium: 46,
  hard: 52,
  expert: 58,
};

// Seeded pseudo-random number generator (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedToNumber(seed: string): number {
  let h = 0x12345678;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  return h >>> 0;
}

function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fillGrid(grid: number[][], rng: () => number): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
        for (const num of nums) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid, rng)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Count solutions — stops at 2 to check uniqueness
function countSolutions(grid: number[][], limit = 2): number {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        let count = 0;
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num;
            count += countSolutions(grid, limit - count);
            grid[row][col] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1; // All cells filled — solution found
}

function hasUniqueSolution(puzzle: number[][]): boolean {
  const copy = cloneGrid(puzzle);
  return countSolutions(copy) === 1;
}

function digHoles(solution: number[][], holes: number, rng: () => number): number[][] {
  const puzzle = cloneGrid(solution);
  const positions = shuffleArray(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number]),
    rng
  );

  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= holes) break;
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;
    if (hasUniqueSolution(puzzle)) {
      removed++;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return puzzle;
}

export function generatePuzzle(difficulty: Difficulty, seedOverride?: string): Puzzle {
  const seed = seedOverride ?? Math.random().toString(36).slice(2);
  const rng = mulberry32(seedToNumber(seed));

  const solution: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(solution, rng);

  const puzzle = digHoles(solution, HOLES[difficulty], rng);

  return { puzzle, solution, seed };
}

export function validateBoard(board: number[][]): ValidationResult {
  const conflicts: [number, number][] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = board[row][col];
      if (val === 0) continue;

      // Check row
      for (let c = 0; c < 9; c++) {
        if (c !== col && board[row][c] === val) {
          conflicts.push([row, col]);
        }
      }
      // Check column
      for (let r = 0; r < 9; r++) {
        if (r !== row && board[r][col] === val) {
          conflicts.push([row, col]);
        }
      }
      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          if ((r !== row || c !== col) && board[r][c] === val) {
            conflicts.push([row, col]);
          }
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = conflicts.filter(([r, c]) => {
    const key = `${r},${c}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { valid: unique.length === 0, conflicts: unique };
}

export function isComplete(board: number[][], solution: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== solution[row][col]) return false;
    }
  }
  return true;
}

export function getDailyPuzzle(date: string): Puzzle {
  // Deterministic seed from date — same date always returns same puzzle
  const seed = `daily-${date}`;
  return generatePuzzle('medium', seed);
}
