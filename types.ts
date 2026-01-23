
export type PlayerColor = 'white' | 'red';

export interface Piece {
  id: string;
  color: PlayerColor;
  isKing: boolean;
  position: { r: number; c: number };
}

export type BoardState = (Piece | null)[][];

export interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  avatar_url: string;
}

export interface Game {
  id: string;
  room_id: string;
  board_state: BoardState;
  current_turn: PlayerColor;
  white_time: number;
  red_time: number;
  has_started: boolean;
  winner_id: string | null;
  draw_offered_by: string | null;
  must_continue_piece_id: string | null;
  updated_at: string;
}

export interface Room {
  id: string;
  room_name: string;
  status: 'waiting' | 'active' | 'finished';
  player_white_id: string | null;
  player_red_id: string | null;
  theme: 'classic' | 'wood' | 'neon';
  initial_time: number;
  created_at: string;
}

export interface Move {
  from: { r: number; c: number };
  to: { r: number; c: number };
  captures?: { r: number; c: number }[];
}

export enum View {
  LOGIN,
  REGISTER,
  HOME,
  GAME,
  RANKING,
  TOURNEYS,
  PROFILE,
  SETTINGS
}
