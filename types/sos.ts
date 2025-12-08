export type Player = {
  id: number;
  name: string;
  color: string;
  score: number;
};

export type CellValue = 'S' | 'O' | null;

export type Coordinate = {
  row: number;
  col: number;
};

export type SlashedLine = {
  id: string;
  start: Coordinate;
  end: Coordinate;
  color: string;
};

export type GamePhase = 'SETUP' | 'PLACEMENT' | 'CLAIMING' | 'GAME_OVER';
export type GridSize = 7 | 8 | 9;