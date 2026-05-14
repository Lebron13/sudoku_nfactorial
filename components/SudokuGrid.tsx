'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { type CellState } from '@/hooks/useSudoku';

interface Props {
  board: CellState[][];
  selected: [number, number] | null;
  onSelect: (row: number, col: number) => void;
  masked?: boolean;
  showErrors?: boolean;
}

export function SudokuGrid({ board, selected, onSelect, masked = false, showErrors = true }: Props) {
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);

  if (!board.length) return null;

  const [selRow, selCol] = selected ?? [-1, -1];

  function getCellBg(row: number, col: number, cell: CellState): string {
    if (masked) return 'transparent';
    const isSelected = row === selRow && col === selCol;
    const isHovered = hoveredCell !== null && hoveredCell[0] === row && hoveredCell[1] === col;
    const sameLine = !isSelected && selected !== null && (
      row === selRow || col === selCol ||
      (Math.floor(row / 3) === Math.floor(selRow / 3) && Math.floor(col / 3) === Math.floor(selCol / 3))
    );
    const sameValue = !isSelected && selected !== null &&
      cell.value !== 0 && cell.value === board[selRow]?.[selCol]?.value;

    if (cell.isConflict && showErrors) return 'rgba(255,80,80,0.1)';
    if (isSelected) return 'rgba(255,110,180,0.12)';
    if (sameValue) return 'rgba(255,110,180,0.07)';
    if (sameLine) return 'rgba(255,255,255,0.03)';
    if (isHovered) return 'rgba(255,255,255,0.04)';
    return 'transparent';
  }

  function getCellColor(cell: CellState): string {
    if (masked) return 'transparent';
    if (cell.isConflict && showErrors) return 'rgba(255,100,100,0.9)';
    if (cell.isHint) return 'rgba(100,255,160,0.9)';
    if (!cell.isGiven) return 'rgba(106,176,255,0.9)';
    return '#fff';
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, var(--cell-size, 56px))',
        border: '2px solid rgba(255,255,255,0.25)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
      role="grid"
      aria-label="Sudoku board"
    >
      {board.map((rowCells, row) =>
        rowCells.map((cell, col) => {
          const isSelected = row === selRow && col === selCol;
          const borderRight = (col + 1) % 3 === 0 && col !== 8
            ? '2px solid rgba(255,255,255,0.18)'
            : '1px solid rgba(255,255,255,0.07)';
          const borderBottom = (row + 1) % 3 === 0 && row !== 8
            ? '2px solid rgba(255,255,255,0.18)'
            : '1px solid rgba(255,255,255,0.07)';

          return (
            <motion.div
              key={`${row}-${col}`}
              role="gridcell"
              aria-label={`Row ${row + 1}, Column ${col + 1}${cell.value ? `, value ${cell.value}` : ', empty'}`}
              className="number-cell"
              style={{
                width: 'var(--cell-size, 56px)',
                height: 'var(--cell-size, 56px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: getCellBg(row, col, cell),
                color: getCellColor(cell),
                fontFamily: 'var(--font-playfair)',
                fontSize: 'var(--cell-font, 20px)',
                transition: 'background 0.12s',
                borderRight,
                borderBottom,
                cursor: 'pointer',
                position: 'relative',
                userSelect: 'none',
                outline: isSelected ? '2px solid rgba(255,110,180,0.5)' : 'none',
                outlineOffset: -2,
              } as React.CSSProperties}
              onPointerDown={() => onSelect(row, col)}
              onMouseEnter={() => setHoveredCell([row, col])}
              onMouseLeave={() => setHoveredCell(null)}
              whileTap={{ scale: 0.88 }}
            >
              {masked ? null : cell.value !== 0 ? (
                <motion.span
                  key={`v-${row}-${col}-${cell.value}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25, duration: 0.15 }}
                >
                  {cell.value}
                </motion.span>
              ) : cell.notes.size > 0 ? (
                <NoteGrid notes={cell.notes} />
              ) : null}
            </motion.div>
          );
        })
      )}
    </div>
  );
}

function NoteGrid({ notes }: { notes: Set<number> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, padding: 3, width: '100%', height: '100%' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <span
          key={n}
          style={{ fontSize: 9, color: notes.has(n) ? 'rgba(106,176,255,0.85)' : 'transparent', textAlign: 'center', lineHeight: 1, fontFamily: 'var(--font-dm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}
