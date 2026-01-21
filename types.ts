
export enum ViewState {
  AUTH = 'AUTH',
  LOBBY = 'LOBBY',
  GAME = 'GAME',
  RANKING = 'RANKING',
  PROFILE = 'PROFILE'
}

export interface Player {
  id: string;
  name: string;
  elo: number;
  level: number;
  avatar: string;
  isGrandmaster?: boolean;
}

export interface GameRoom {
  id: string;
  creator: string;
  mode: 'Blitz' | 'Bullet' | 'Rapid';
  time: string;
  type: 'Ranked' | 'Casual';
  color: string;
}

export interface Tournament {
  id: string;
  title: string;
  startTime: string;
  prize: string;
  players: string;
  status: 'Aberto' | 'Premium' | 'Série B';
}
