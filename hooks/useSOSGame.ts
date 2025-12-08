import { useState } from 'react';
import { CellValue, Coordinate, GamePhase, GridSize, Player, SlashedLine } from '../types/sos';

const PLAYER_COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF'];

export const useSOSGame = () => {
  // ... (Keep existing state setup) ...
  const [gridSize, setGridSize] = useState<GridSize>(7);
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [grid, setGrid] = useState<CellValue[][]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [slashedLines, setSlashedLines] = useState<SlashedLine[]>([]);
  
  const [pendingCell, setPendingCell] = useState<Coordinate | null>(null);
  const [dragPath, setDragPath] = useState<Coordinate[]>([]);
  const [hasPlacedThisTurn, setHasPlacedThisTurn] = useState(false);

  // ... (Keep startGame, handleCellTap, confirmPlacement) ...
  const startGame = () => {
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    setGrid(newGrid);
    const newPlayers = Array.from({ length: playerCount }, (_, i) => ({
      id: i, name: `P${i + 1}`, color: PLAYER_COLORS[i], score: 0,
    }));
    setPlayers(newPlayers);
    setSlashedLines([]);
    setCurrentPlayerIndex(0);
    setHasPlacedThisTurn(false);
    setPendingCell(null);
    setDragPath([]);
    setPhase('PLACEMENT');
  };

  const handleCellTap = (row: number, col: number) => {
    if (phase === 'PLACEMENT') {
      if (grid[row][col] !== null) {
        setPendingCell(null);
        return;
      }
      if (pendingCell?.row === row && pendingCell?.col === col) {
        setPendingCell(null);
      } else {
        setPendingCell({ row, col });
      }
    }
  };

  const confirmPlacement = (char: 'S' | 'O') => {
    if (!pendingCell) return;
    const { row, col } = pendingCell;
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = char;
    setGrid(newGrid);
    setPendingCell(null);
    setHasPlacedThisTurn(true);
    setPhase('CLAIMING');
  };

  const handleDragEnter = (row: number, col: number) => {
    if (phase !== 'CLAIMING') return;

    setDragPath((prev) => {
      // 1. Start of drag
      if (prev.length === 0) {
        return [{ row, col }];
      }

      const start = prev[0];
      const last = prev[prev.length - 1];

      // 2. Ignore hovering the same cell
      if (last.row === row && last.col === col) {
        return prev;
      }

      // 3. Backtracking (User slides back)
      // If we go back to the 2nd-to-last cell, remove the last one.
      if (prev.length > 1) {
        const secondLast = prev[prev.length - 2];
        if (secondLast.row === row && secondLast.col === col) {
          return prev.slice(0, -1);
        }
      }

      // 4. Establishing Direction (1st -> 2nd cell)
      if (prev.length === 1) {
        // Check adjacency (including diagonal)
        if (Math.abs(row - start.row) <= 1 && Math.abs(col - start.col) <= 1) {
          return [...prev, { row, col }];
        }
        return prev;
      }

      // 5. Completing the Line (2nd -> 3rd cell) OR Pivoting
      if (prev.length === 2) {
        const mid = prev[1];
        
        // Calculate the vector established by Start -> Mid
        const vRow = mid.row - start.row;
        const vCol = mid.col - start.col;

        // Calculate the STRICT expected 3rd cell
        const expectedRow = mid.row + vRow;
        const expectedCol = mid.col + vCol;

        // Case A: Perfect Line (The user hit the exact target)
        if (row === expectedRow && col === expectedCol) {
          return [...prev, { row, col }];
        }

        // Case B: The "Pivot" (Fixing the Diagonal Issue)
        // The user is at Start -> Mid, but drags to 'New'.
        // If 'New' is NOT the line extension, but IS adjacent to 'Start',
        // we assume 'Mid' was a mistake/slip, and we switch direction.
        if (Math.abs(row - start.row) <= 1 && Math.abs(col - start.col) <= 1) {
          // Replace the middle cell with this new one
          return [start, { row, col }];
        }

        // Case C: Invalid L-Shape (Not a line, and not adjacent to start)
        return prev;
      }

      // 6. Path Full (3 cells)
      // We don't add more. User must backtrack if they want to change.
      return prev;
    });
  };

  const handleDragEnd = () => {
    if (phase !== 'CLAIMING') return;
    
    // Only validate if we successfully selected 3 aligned cells
    if (dragPath.length === 3) {
      validateSlash(dragPath);
    }
    setDragPath([]);
  };

  const validateSlash = (path: Coordinate[]) => {
    // We don't need to check geometry here anymore! 
    // handleDragEnter guaranteed it is a straight line.
    
    // We just sort to ensure we read S-O-S correctly (Start -> End)
    const sorted = [...path].sort((a, b) => (a.row - b.row) || (a.col - b.col));
    const [c1, c2, c3] = sorted;

    // 1. Check Content (Must be S-O-S)
    if (grid[c1.row][c1.col] !== 'S' || grid[c2.row][c2.col] !== 'O' || grid[c3.row][c3.col] !== 'S') {
      return; 
    }

    // 2. Check Duplicates
    const lineId = `${c1.row},${c1.col}-${c3.row},${c3.col}`;
    if (slashedLines.some(line => line.id === lineId)) {
      return; 
    }

    // 3. Success
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex].score += 1;
    setPlayers(updatedPlayers);

    setSlashedLines(prev => [...prev, {
      id: lineId,
      start: c1,
      end: c3,
      color: players[currentPlayerIndex].color
    }]);

    const isFull = grid.every(row => row.every(cell => cell !== null));
    if (isFull) {
      setPhase('GAME_OVER');
    } else {
      // Reward: Place again
      setHasPlacedThisTurn(false);
      setPhase('PLACEMENT');
    }
  };

  const endTurn = () => {
    if (!hasPlacedThisTurn) {
      alert("Place a letter first!");
      return;
    }
    
    const isFull = grid.every(row => row.every(cell => cell !== null));
    if (isFull) {
      setPhase('GAME_OVER');
      return;
    }

    setPendingCell(null);
    setDragPath([]);
    setHasPlacedThisTurn(false);
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
    dismissPopup: () => setPendingCell(null)
  };
};