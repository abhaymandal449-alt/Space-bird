
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Pipe extends GameObject {
  passed: boolean;
  gapTop: number;
}
