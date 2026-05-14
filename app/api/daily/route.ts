import { NextRequest, NextResponse } from 'next/server';
import { getDailyPuzzle } from '@/lib/sudoku-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  const puzzle = getDailyPuzzle(date);

  // Don't expose solution to client
  return NextResponse.json(
    { puzzle: puzzle.puzzle, seed: puzzle.seed, date },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    }
  );
}
