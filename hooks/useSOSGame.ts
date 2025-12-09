import { useState } from 'react';
import { CellValue, Coordinate, GamePhase, GridSize, Player, SlashedLine } from '../types/sos';

const PLAYER_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF'];

export const useSOSGame = () => {
  // --- Setup & Grid State ---
  const [gridSize, setGridSize] = useState<GridSize>(7);
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [grid, setGrid] = useState<CellValue[][]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [slashedLines, setSlashedLines] = useState<SlashedLine[]>([]);
  
  // --- Interaction State ---
  const [pendingCell, setPendingCell] = useState<Coordinate | null>(null);
  const [dragPath, setDragPath] = useState<Coordinate[]>([]);
  
  // Tracks if the player has placed a letter to start the turn
  const [hasPlacedInitial, setHasPlacedInitial] = useState(false);
  // Tracks if the player earned a bonus move by slashing
  const [canPlaceBonus, setCanPlaceBonus] = useState(false);

  const startGame = () => {
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    setGrid(newGrid);
    const newPlayers = Array.from({ length: playerCount }, (_, i) => ({
      id: i, name: `P${i + 1}`, color: PLAYER_COLORS[i], score: 0,
    }));
    setPlayers(newPlayers);
    setSlashedLines([]);
    setCurrentPlayerIndex(0);
    
    setHasPlacedInitial(false);
    setCanPlaceBonus(false);
    setPendingCell(null);
    setDragPath([]);
    setPhase('PLACEMENT');
  };

  // 1. Handle Tapping a Cell (Placement Logic)
  const handleCellTap = (row: number, col: number) => {
    // Allow placement if:
    // A. It's the start of the turn (PLACEMENT phase)
    // B. We are in CLAIMING phase, but user earned a bonus move (canPlaceBonus)
    const isPlacementAllowed = phase === 'PLACEMENT' || (phase === 'CLAIMING' && canPlaceBonus);

    if (isPlacementAllowed) {
      if (grid[row][col] !== null) {
        setPendingCell(null); // Dismiss if tapping occupied cell
        return;
      }
      // Toggle popup
      if (pendingCell?.row === row && pendingCell?.col === col) {
        setPendingCell(null);
      } else {
        setPendingCell({ row, col });
      }
    }
  };

  // 2. Confirm Selection from Popup
  const confirmPlacement = (char: 'S' | 'O') => {
    if (!pendingCell) return;
    const { row, col } = pendingCell;
    
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = char;
    setGrid(newGrid);
    
    setPendingCell(null);
    
    // Logic for turn progression
    if (phase === 'PLACEMENT') {
      setHasPlacedInitial(true);
      setPhase('CLAIMING'); // Move to slashing phase
    } else if (canPlaceBonus) {
      // They used their bonus move!
      setCanPlaceBonus(false); 
      // We stay in CLAIMING phase so they can slash again if this new letter created a line
    }
  };

  // 3. Handle Dragging (The "Fruit Ninja" Logic)
  const handleDragEnter = (row: number, col: number) => {
    if (phase !== 'CLAIMING') return;

    // We use a temporary variable to calculate the next state
    // so we can validate immediately without waiting for React render cycle
    let nextPath: Coordinate[] = [];

    setDragPath((prev) => {
      // --- Pivot & Vector Logic (Same as before) ---
      if (prev.length === 0) {
        nextPath = [{ row, col }];
        return nextPath;
      }

      const start = prev[0];
      const last = prev[prev.length - 1];

      // Ignore same cell
      if (last.row === row && last.col === col) return prev;

      // Backtracking
      if (prev.length > 1) {
        const secondLast = prev[prev.length - 2];
        if (secondLast.row === row && secondLast.col === col) {
          nextPath = prev.slice(0, -1);
          return nextPath;
        }
      }

      // 2nd Cell (Direction)
      if (prev.length === 1) {
        if (Math.abs(row - start.row) <= 1 && Math.abs(col - start.col) <= 1) {
          nextPath = [...prev, { row, col }];
          return nextPath;
        }
        return prev;
      }

      // 3rd Cell (Completion or Pivot)
      if (prev.length === 2) {
        const mid = prev[1];
        const vRow = mid.row - start.row;
        const vCol = mid.col - start.col;
        const expectedRow = mid.row + vRow;
        const expectedCol = mid.col + vCol;

        // Perfect Line
        if (row === expectedRow && col === expectedCol) {
          nextPath = [...prev, { row, col }];
          
          // --- INSTANT VALIDATION TRIGGER ---
          // We don't wait for drag end. We check NOW.
          // We return the full path for a split second visual, 
          // but we trigger the logic immediately.
          validateSlash(nextPath); 
          return []; // Reset path immediately after slash
        }

        // Pivot (Fix Diagonal)
        if (Math.abs(row - start.row) <= 1 && Math.abs(col - start.col) <= 1) {
          nextPath = [start, { row, col }];
          return nextPath;
        }
      }

      return prev;
    });
  };

  const handleDragEnd = () => {
    // Since we validate instantly in handleDragEnter, 
    // this is mostly just cleanup for incomplete drags.
    setDragPath([]);
  };

  const validateSlash = (path: Coordinate[]) => {
    const sorted = [...path].sort((a, b) => (a.row - b.row) || (a.col - b.col));
    const [c1, c2, c3] = sorted;

    // 1. Check Content
    if (grid[c1.row][c1.col] !== 'S' || grid[c2.row][c2.col] !== 'O' || grid[c3.row][c3.col] !== 'S') return;

    // 2. Check Duplicates
    const lineId = `${c1.row},${c1.col}-${c3.row},${c3.col}`;
    if (slashedLines.some(line => line.id === lineId)) return;

    // --- SUCCESS ---
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex].score += 1;
    setPlayers(updatedPlayers);

    setSlashedLines(prev => [...prev, {
      id: lineId,
      start: c1,
      end: c3,
      color: players[currentPlayerIndex].color
    }]);

    // REWARD: Unlock ONE bonus placement
    // We set this to true. Even if they slash 5 times, it stays true (1 move).
    // It only resets to false when they actually place the letter.
    setCanPlaceBonus(true);

    // Check Game Over
    const isFull = grid.every(row => row.every(cell => cell !== null));
    if (isFull) setPhase('GAME_OVER');
  };

  const endTurn = () => {
    if (!hasPlacedInitial) {
      alert("Place a letter first!");
      return;
    }
    
    // If they have a bonus move available but choose to end turn, that's their choice.
    // Or we could force them? "You have a free move!"
    // Let's just end the turn to keep it simple.

    const isFull = grid.every(row => row.every(cell => cell !== null));
    if (isFull) {
      setPhase('GAME_OVER');
      return;
    }

    setPendingCell(null);
    setDragPath([]);
    setHasPlacedInitial(false);
    setCanPlaceBonus(false);
    setPhase('PLACEMENT');
    setCurrentPlayerIndex((prev) => (prev + 1) % playerCount);
  };

  return {
    gridSize, setGridSize,
    playerCount, setPlayerCount,
    phase, grid, players,
    currentPlayer: players[currentPlayerIndex],
    slashedLines, 
    pendingCell, confirmPlacement,
    dragPath, handleDragEnter, handleDragEnd,
    startGame, handleCellTap, endTurn,
    resetGame: () => setPhase('SETUP'),
    dismissPopup: () => setPendingCell(null),
    // Export this so UI can show a hint
    canPlaceBonus 
  };
};