import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

interface BoardCell {
  value: number;
  isGiven: boolean;
  isConflict: boolean;
}

function boardToString(board: BoardCell[][]): string {
  return board
    .map((row, r) =>
      row
        .map((cell, c) => {
          const v = cell.value === 0 ? '.' : String(cell.value);
          const conflict = cell.isConflict ? '!' : '';
          return `${v}${conflict}`;
        })
        .join(' ')
    )
    .join('\n');
}

function findBestHintCell(board: BoardCell[][], difficulty: string): [number, number] | null {
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value === 0) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) return null;
  const idx = Math.floor(Math.random() * Math.min(emptyCells.length, 3));
  return emptyCells[idx];
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ hint: 'API key not configured.', level: 'nudge' }, { status: 503 });
  }

  const { board, difficulty, selected } = await req.json();

  const boardStr = boardToString(board);
  const hintCell = findBestHintCell(board, difficulty);
  const hintContext = hintCell
    ? `The user might want to look at row ${hintCell[0] + 1}, column ${hintCell[1] + 1}.`
    : '';
  const selectedContext = selected
    ? `The user has selected row ${selected[0] + 1}, column ${selected[1] + 1}.`
    : '';

  const prompt = `You are a Sudoku coach helping a player. The board uses dots for empty cells and numbers for filled cells. Cells marked with ! have conflicts.

Board (row by row):
${boardStr}

Difficulty: ${difficulty}
${selectedContext}
${hintContext}

Give a single, helpful hint. Be encouraging but not patronizing.
- For easy/medium: you can be more direct about strategies (naked singles, hidden singles)
- For hard/expert: be more Socratic — ask questions that guide reasoning
- Never reveal the direct answer value
- Keep it under 3 sentences
- Don't repeat what's obvious from the grid`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  return NextResponse.json({ hint: text, level: 'nudge' });
}
