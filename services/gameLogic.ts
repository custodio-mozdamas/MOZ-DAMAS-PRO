
import { BoardState, Piece, PlayerColor, Move } from '../types';
import { BOARD_SIZE } from '../constants';

export const isDarkSquare = (r: number, c: number) => (r + c) % 2 === 0;

export const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDarkSquare(r, c)) {
        board[r][c] = { id: `red-${r}-${c}`, color: 'red', isKing: false, position: { r, c } };
      }
    }
  }

  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDarkSquare(r, c)) {
        board[r][c] = { id: `white-${r}-${c}`, color: 'white', isKing: false, position: { r, c } };
      }
    }
  }

  return board;
};

export const isValidPos = (r: number, c: number) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

export const getPieceAt = (board: BoardState, r: number, c: number): Piece | null => {
  if (!isValidPos(r, c)) return null;
  return board[r][c];
};

/**
 * Calcula recursivamente o número máximo de capturas possíveis a partir de um estado.
 * Respeita a regra de que peças capturadas não podem ser puladas duas vezes.
 */
const countMaxCapturesInPath = (board: BoardState, piece: Piece): number => {
  const possibleCaptures = getCapturesForPiece(board, piece);
  if (possibleCaptures.length === 0) return 0;

  let maxFuture = 0;
  for (const move of possibleCaptures) {
    const tempBoard = applyMove(board, move);
    const movedPiece = tempBoard[move.to.r][move.to.c]!;
    const count = countMaxCapturesInPath(tempBoard, movedPiece);
    if (count + 1 > maxFuture) {
      maxFuture = count + 1;
    }
  }
  return maxFuture;
};

/**
 * Retorna todos os movimentos de captura disponíveis que satisfazem a Lei da Maioria.
 */
export const getAvailableCaptures = (board: BoardState, player: PlayerColor, specificPieceId?: string): (Move & { totalCaptures: number })[] => {
  let allPossibleCaptures: (Move & { totalCaptures: number })[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === player) {
        if (specificPieceId && piece.id !== specificPieceId) continue;
        
        const immediateCaptures = getCapturesForPiece(board, piece);
        for (const move of immediateCaptures) {
          const tempBoard = applyMove(board, move);
          const movedPiece = tempBoard[move.to.r][move.to.c]!;
          // 1 (esta captura) + o máximo de capturas futuras possíveis desta rota
          const total = 1 + countMaxCapturesInPath(tempBoard, movedPiece);
          allPossibleCaptures.push({ ...move, totalCaptures: total });
        }
      }
    }
  }

  if (allPossibleCaptures.length === 0) return [];

  // Lei da Maioria: O jogador é obrigado a capturar o maior número de peças possível.
  const maxCaptures = Math.max(...allPossibleCaptures.map(m => m.totalCaptures));
  return allPossibleCaptures.filter(m => m.totalCaptures === maxCaptures);
};

export const getCapturesForPiece = (board: BoardState, piece: Piece): Move[] => {
  const { r, c } = piece.position;
  const captures: Move[] = [];
  const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  if (!piece.isKing) {
    // Peça comum captura em todas as direções (frente e trás)
    dirs.forEach(([dr, dc]) => {
      const midR = r + dr;
      const midC = c + dc;
      const endR = r + 2 * dr;
      const endC = c + 2 * dc;

      if (isValidPos(endR, endC)) {
        const midPiece = getPieceAt(board, midR, midC);
        const endPiece = getPieceAt(board, endR, endC);
        // Pode capturar se houver inimigo no meio e destino vazio
        if (midPiece && midPiece.color !== piece.color && endPiece === null) {
          captures.push({ from: { r, c }, to: { r: endR, c: endC }, captures: [{ r: midR, c: midC }] });
        }
      }
    });
  } else {
    // Dama voadora (captura à distância)
    dirs.forEach(([dr, dc]) => {
      let foundOpponent = false;
      let opponentPos = { r: -1, c: -1 };
      
      for (let dist = 1; dist < BOARD_SIZE; dist++) {
        const tr = r + dr * dist;
        const tc = c + dc * dist;
        if (!isValidPos(tr, tc)) break;

        const p = getPieceAt(board, tr, tc);
        if (!foundOpponent) {
          if (p === null) continue;
          if (p.color === piece.color) break; // Bloqueado por peça própria
          foundOpponent = true;
          opponentPos = { r: tr, c: tc };
        } else {
          // Após encontrar um oponente, a Dama pode pousar em qualquer casa vazia subsequente
          if (p !== null) break; // Bloqueado por outra peça (não pode capturar duas seguidas)
          captures.push({ from: { r, c }, to: { r: tr, c: tc }, captures: [opponentPos] });
        }
      }
    });
  }

  return captures;
};

export const getValidMoves = (board: BoardState, player: PlayerColor, specificPieceId?: string): Move[] => {
  // 1. Sempre prioriza capturas (Lei da Maioria já inclusa aqui)
  const captures = getAvailableCaptures(board, player, specificPieceId);
  if (captures.length > 0) return captures;

  // Se estiver no meio de uma sequência de capturas, não há outros movimentos válidos
  if (specificPieceId) return [];

  // 2. Movimentos regulares se não houver capturas disponíveis
  const moves: Move[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === player) {
        moves.push(...getRegularMovesForPiece(board, piece));
      }
    }
  }
  return moves;
};

const getRegularMovesForPiece = (board: BoardState, piece: Piece): Move[] => {
  const { r, c } = piece.position;
  const moves: Move[] = [];
  
  if (!piece.isKing) {
    // Peça comum só move para frente
    const dirs = piece.color === 'red' ? [[1, 1], [1, -1]] : [[-1, 1], [-1, -1]];
    dirs.forEach(([dr, dc]) => {
      const tr = r + dr;
      const tc = c + dc;
      if (isValidPos(tr, tc) && getPieceAt(board, tr, tc) === null) {
        moves.push({ from: { r, c }, to: { r: tr, c: tc } });
      }
    });
  } else {
    // Dama move em todas as direções a qualquer distância
    const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    dirs.forEach(([dr, dc]) => {
      for (let dist = 1; dist < BOARD_SIZE; dist++) {
        const tr = r + dr * dist;
        const tc = c + dc * dist;
        if (isValidPos(tr, tc) && getPieceAt(board, tr, tc) === null) {
          moves.push({ from: { r, c }, to: { r: tr, c: tc } });
        } else break;
      }
    });
  }

  return moves;
};

export const applyMove = (board: BoardState, move: Move): BoardState => {
  const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
  const piece = newBoard[move.from.r][move.from.c];
  if (!piece) return board;

  newBoard[move.from.r][move.from.c] = null;
  newBoard[move.to.r][move.to.c] = { ...piece, position: move.to };

  if (move.captures) {
    move.captures.forEach(pos => {
      newBoard[pos.r][pos.c] = null;
    });
  }

  return newBoard;
};

export const checkGameOver = (board: BoardState, turn: PlayerColor): { winner: PlayerColor | 'draw' | null } => {
  const moves = getValidMoves(board, turn);
  if (moves.length === 0) {
    // Se não há movimentos, quem deveria jogar perdeu
    return { winner: turn === 'white' ? 'red' : 'white' };
  }
  
  let whiteCount = 0;
  let redCount = 0;
  board.forEach(row => row.forEach(p => {
    if (p?.color === 'white') whiteCount++;
    if (p?.color === 'red') redCount++;
  }));

  if (whiteCount === 0) return { winner: 'red' };
  if (redCount === 0) return { winner: 'white' };

  return { winner: null };
};
