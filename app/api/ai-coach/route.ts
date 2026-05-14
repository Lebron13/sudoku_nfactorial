import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a Sudoku coach. Explain solving strategies clearly and concisely. Never just give the answer — teach the technique. Keep responses under 100 words. Use plain text, no markdown.`;

function boardToDisplay(board: number[][]): string {
  const rows: string[] = [];
  for (let r = 0; r < 9; r++) {
    if (r > 0 && r % 3 === 0) rows.push('+-------+-------+-------+');
    const cells = board[r].map((v, c) => {
      const ch = v === 0 ? '.' : String(v);
      return (c > 0 && c % 3 === 0) ? ' | ' + ch : (c === 0 ? ch : ' ' + ch);
    });
    rows.push('| ' + cells.join('') + ' |');
  }
  return rows.join('\n');
}

function getCandidates(board: number[][], row: number, col: number): number[] {
  if (board[row][col] !== 0) return [];
  const used = new Set<number>();
  board[row].forEach((v) => v && used.add(v));
  board.forEach((r) => r[col] && used.add(r[col]));
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      board[r][c] && used.add(board[r][c]);
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !used.has(n));
}

function buildPrompt(
  board: number[][],
  selectedCell?: [number, number] | null,
  userQuestion?: string
): string {
  const boardStr = boardToDisplay(board);
  const parts: string[] = [`Current board:\n${boardStr}`];

  if (selectedCell) {
    const [r, c] = selectedCell;
    const candidates = getCandidates(board, r, c);
    const isEmpty = board[r][c] === 0;
    parts.push(
      `Selected cell: Row ${r + 1}, Column ${c + 1} (box ${Math.floor(r / 3) * 3 + Math.floor(c / 3) + 1}).` +
        (isEmpty
          ? ` Possible values: ${candidates.length ? candidates.join(', ') : 'none — conflict exists'}.`
          : ` Currently filled with ${board[r][c]}.`)
    );
  }

  if (userQuestion) {
    parts.push(`Player's question: ${userQuestion}`);
  } else if (selectedCell && board[selectedCell[0]][selectedCell[1]] === 0) {
    parts.push(
      'Which technique helps narrow down or solve the selected cell? Explain the reasoning without revealing the answer.'
    );
  } else {
    parts.push(
      'Looking at the current board, what is the most promising next area or strategy to focus on?'
    );
  }

  return parts.join('\n\n');
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let board: number[][];
  let selectedCell: [number, number] | null;
  let userQuestion: string | undefined;

  try {
    ({ board, selectedCell, userQuestion } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const prompt = buildPrompt(board, selectedCell, userQuestion);

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
      } catch {
        controller.error(new Error('Stream failed'));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
