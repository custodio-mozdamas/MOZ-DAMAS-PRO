
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameRoom } from '../types';

interface GameViewProps {
  onBack: () => void;
  room: GameRoom | null;
  userName: string;
  userAvatar: string;
}

type PieceColor = 'white' | 'red';

interface Piece {
  color: PieceColor;
  isKing: boolean;
}

type BoardState = (Piece | null)[][];

interface Position {
  r: number;
  c: number;
}

interface Move {
  from: Position;
  to: Position;
  captures: Position[];
  isJump: boolean;
}

type GameResult = 'white_win' | 'red_win' | 'draw' | 'surrender' | 'timeout' | null;

const GameView: React.FC<GameViewProps> = ({ onBack, room, userName, userAvatar }) => {
  // Convert room time to seconds
  const parseInitialTime = () => {
    if (!room) return 180; // Default 3 min
    const parts = room.time.split(' + ');
    const baseMinutes = parseInt(parts[0]);
    return baseMinutes * 60;
  };

  const [board, setBoard] = useState<BoardState>(() => {
    const initialBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 0) initialBoard[r][c] = { color: 'red', isKing: false };
      }
    }
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 0) initialBoard[r][c] = { color: 'white', isKing: false };
      }
    }
    return initialBoard;
  });

  const [turn, setTurn] = useState<PieceColor>('white');
  const [selected, setSelected] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [multiJumpInProgress, setMultiJumpInProgress] = useState<Position | null>(null);
  const [message, setMessage] = useState<string>('Sua vez! Mova as brancas.');
  const [gameResult, setGameResult] = useState<GameResult>(null);

  // Timer states
  const [whiteTime, setWhiteTime] = useState(parseInitialTime());
  const [redTime, setRedTime] = useState(parseInitialTime());
  // Fix: Use ReturnType<typeof setInterval> instead of NodeJS.Timeout for browser compatibility
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Timer logic
  useEffect(() => {
    if (gameResult) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      if (turn === 'white') {
        setWhiteTime(prev => {
          if (prev <= 1) {
            setGameResult('timeout');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setRedTime(prev => {
          if (prev <= 1) {
            setGameResult('timeout');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [turn, gameResult]);

  const getMovesForPiece = useCallback((currentBoard: BoardState, r: number, c: number, onlyJumps = false, depth = 0): Move[] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];
    const moves: Move[] = [];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

    if (piece.isKing) {
      directions.forEach(([dr, dc]) => {
        let nr = r + dr;
        let nc = c + dc;
        let jumpFound = false;
        let jumpTarget: Position | null = null;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = currentBoard[nr][nc];
          if (!target) {
            if (jumpFound && jumpTarget) {
              const move: Move = { from: { r, c }, to: { r: nr, c: nc }, captures: [jumpTarget], isJump: true };
              const tempBoard = currentBoard.map(row => [...row]);
              tempBoard[nr][nc] = piece;
              tempBoard[r][c] = null;
              tempBoard[jumpTarget.r][jumpTarget.c] = null;
              const nextJumps = getMovesForPiece(tempBoard, nr, nc, true, depth + 1);
              if (nextJumps.length > 0) {
                nextJumps.forEach(nj => moves.push({ ...nj, from: { r, c }, captures: [jumpTarget!, ...nj.captures] }));
              } else moves.push(move);
            } else if (!onlyJumps) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, captures: [], isJump: false });
            }
          } else {
            if (jumpFound) break;
            if (target.color !== piece.color) {
              jumpFound = true;
              jumpTarget = { r: nr, c: nc };
            } else break;
          }
          nr += dr; nc += dc;
        }
      });
    } else {
      directions.forEach(([dr, dc]) => {
        const nr = r + dr; const nc = c + dc; const jr = r + dr * 2; const jc = c + dc * 2;
        if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8) {
          const mid = currentBoard[nr][nc]; const end = currentBoard[jr][jc];
          if (mid && mid.color !== piece.color && !end) {
            const move: Move = { from: { r, c }, to: { r: jr, c: jc }, captures: [{ r: nr, c: nc }], isJump: true };
            const tempBoard = currentBoard.map(row => [...row]);
            tempBoard[jr][jc] = piece; tempBoard[r][c] = null; tempBoard[nr][nc] = null;
            const nextJumps = getMovesForPiece(tempBoard, jr, jc, true, depth + 1);
            if (nextJumps.length > 0) {
              nextJumps.forEach(nj => moves.push({ ...nj, from: { r, c }, captures: [{ r: nr, c: nc }, ...nj.captures] }));
            } else moves.push(move);
          }
        }
        if (!onlyJumps) {
          const isForward = piece.color === 'white' ? dr < 0 : dr > 0;
          if (isForward && nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !currentBoard[nr][nc]) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, captures: [], isJump: false });
          }
        }
      });
    }
    return moves;
  }, []);

  const calculateAllValidMoves = useCallback((currentBoard: BoardState, activeColor: PieceColor, forcedPiecePos: Position | null): Move[] => {
    let allMoves: Move[] = [];
    if (forcedPiecePos) {
      allMoves = getMovesForPiece(currentBoard, forcedPiecePos.r, forcedPiecePos.c, true);
    } else {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = currentBoard[r][c];
          if (piece && piece.color === activeColor) allMoves.push(...getMovesForPiece(currentBoard, r, c));
        }
      }
    }
    const jumps = allMoves.filter(m => m.isJump);
    if (jumps.length > 0) {
      const maxCaptures = Math.max(...jumps.map(j => j.captures.length));
      return jumps.filter(j => j.captures.length === maxCaptures);
    }
    return allMoves;
  }, [getMovesForPiece]);

  useEffect(() => {
    const moves = calculateAllValidMoves(board, turn, multiJumpInProgress);
    setValidMoves(moves);
    if (moves.length === 0 && !gameResult) {
      // Check if current turn player has any pieces left
      let piecesLeft = 0;
      board.forEach(row => row.forEach(p => { if (p && p.color === turn) piecesLeft++; }));
      if (piecesLeft === 0) {
        setGameResult(turn === 'white' ? 'red_win' : 'white_win');
      } else {
        // Still pieces but no valid moves (stalemate/blocked)
        setGameResult(turn === 'white' ? 'red_win' : 'white_win');
      }
    }
  }, [board, turn, multiJumpInProgress, calculateAllValidMoves]);

  const handleCellClick = (r: number, c: number) => {
    if (gameResult) return;
    const piece = board[r][c];
    if (multiJumpInProgress) {
      const move = validMoves.find(m => m.from.r === selected?.r && m.from.c === selected?.c && m.to.r === r && m.to.c === c);
      if (move) executeMove(move);
      return;
    }
    if (piece && piece.color === turn) setSelected({ r, c });
    else if (selected) {
      const move = validMoves.find(m => m.from.r === selected.r && m.from.c === selected.c && m.to.r === r && m.to.c === c);
      if (move) executeMove(move);
      else setSelected(null);
    }
  };

  const executeMove = (move: Move) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[move.from.r][move.from.c]!;
    newBoard[move.to.r][move.to.c] = piece;
    newBoard[move.from.r][move.from.c] = null;
    if (!piece.isKing) {
      if ((piece.color === 'white' && move.to.r === 0) || (piece.color === 'red' && move.to.r === 7)) {
        newBoard[move.to.r][move.to.c] = { ...piece, isKing: true };
      }
    }
    move.captures.forEach(cap => { newBoard[cap.r][cap.c] = null; });
    
    // Add time increment if exists in room config (e.g., 3 + 2)
    if (room && room.time.includes('+')) {
      const inc = parseInt(room.time.split(' + ')[1]);
      if (turn === 'white') setWhiteTime(t => t + inc);
      else setRedTime(t => t + inc);
    }

    setBoard(newBoard);
    setSelected(null);
    setTurn(turn === 'white' ? 'red' : 'white');
    setMessage(`Vez das ${turn === 'white' ? 'vermelhas' : 'brancas'}.`);
  };

  const offerDraw = () => {
    if (confirm("Deseja oferecer empate ao oponente?")) {
      const accepted = Math.random() > 0.7;
      if (accepted) setGameResult('draw');
      else alert("O oponente recusou o empate!");
    }
  };

  const surrender = () => {
    if (confirm("Deseja mesmo desistir da partida? Isso contará como uma derrota.")) {
      setGameResult('surrender');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark p-4 animate-in zoom-in-95 duration-300 relative">
      <header className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-1">
          <span className="material-symbols-outlined">chevron_left</span>
          <span className="text-xs font-bold uppercase tracking-wider">Lobby</span>
        </button>
        <div className="text-center">
           <h1 className="text-lg font-bold text-primary">DAMAS PRO</h1>
           <p className="text-[10px] text-slate-500 uppercase">{room?.mode || 'Partida'} {room?.type || ''}</p>
        </div>
        <div className="flex gap-4">
          <button className="material-symbols-outlined text-slate-400">settings</button>
        </div>
      </header>

      {/* Opponent Info */}
      <div className={`bg-card-dark rounded-2xl p-4 border transition-all duration-300 ${turn === 'red' ? 'border-red-500/50 scale-[1.02] shadow-lg shadow-red-500/10' : 'border-slate-800 opacity-80'} flex justify-between items-center mb-4`}>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full border-2 border-red-500/50 overflow-hidden">
            <img src="https://picsum.photos/seed/opp/100" className="w-full h-full object-cover" alt="Opponent" />
          </div>
          <div>
            <p className="text-sm font-bold">Mestre Vermelho</p>
            <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-600"></span> Vermelhas
            </p>
          </div>
        </div>
        <div className={`bg-black/40 border ${turn === 'red' ? 'border-red-500 text-red-500' : 'border-slate-800 text-slate-400'} rounded-lg px-4 py-2 font-mono text-xl font-bold`}>
          {formatTime(redTime)}
        </div>
      </div>

      <div className="text-center mb-2 h-4">
        <p className="text-xs font-bold text-accent-green uppercase tracking-widest">{gameResult ? 'Fim da Partida' : message}</p>
      </div>

      {/* Checkers Board */}
      <div className="aspect-square w-full grid grid-cols-8 grid-rows-8 border-4 border-card-dark shadow-2xl rounded-sm overflow-hidden bg-card-dark mb-4 ring-1 ring-slate-800 relative">
        {board.map((row, r) => 
          row.map((piece, c) => {
            const isDark = (r + c) % 2 === 0;
            const isSelected = selected && selected.r === r && selected.c === c;
            const isMoveTarget = validMoves.some(m => m.from.r === selected?.r && m.from.c === selected?.c && m.to.r === r && m.to.c === c);
            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`relative flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
              >
                {c === 7 && <span className={`absolute top-0.5 right-0.5 text-[8px] font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{8 - r}</span>}
                {r === 7 && <span className={`absolute bottom-0.5 left-0.5 text-[8px] font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{String.fromCharCode(97 + c)}</span>}
                {isMoveTarget && (
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                    <div className="size-3 rounded-full bg-primary/60"></div>
                  </div>
                )}
                {piece && (
                  <div className={`
                    size-5/6 rounded-full shadow-lg transition-all duration-200
                    ${piece.color === 'white' ? 'bg-white text-slate-400' : 'bg-red-600 text-red-300'} 
                    ${isSelected ? 'ring-4 ring-primary scale-110 z-10 shadow-primary/40' : 'hover:scale-105'}
                    flex items-center justify-center border-b-4 border-black/20
                  `}>
                    <div className={`size-3/4 rounded-full border-2 border-white/10 flex items-center justify-center ${piece.color === 'white' ? 'bg-slate-100' : 'bg-red-700'}`}>
                      {piece.isKing && <span className="material-symbols-outlined text-[16px] font-black drop-shadow-md text-white">star</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Self Info */}
      <div className={`bg-card-dark rounded-2xl p-4 border transition-all duration-300 ${turn === 'white' ? 'border-primary/50 scale-[1.02] shadow-lg shadow-primary/10' : 'border-slate-800 opacity-80'} flex justify-between items-center mb-6`}>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full border-2 border-primary overflow-hidden">
            <img src={userAvatar} className="w-full h-full object-cover" alt="Me" />
          </div>
          <div>
            <p className="text-sm font-bold">{userName}</p>
            <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <span className="size-2 rounded-full bg-white shadow-sm shadow-white/50"></span> Brancas
            </p>
          </div>
        </div>
        <div className={`bg-primary/20 border ${turn === 'white' ? 'border-primary text-primary' : 'border-slate-800 text-slate-400'} rounded-lg px-4 py-2 font-mono text-xl font-bold`}>
          {formatTime(whiteTime)}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button 
          onClick={offerDraw}
          disabled={!!gameResult}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 p-4 rounded-2xl text-xs font-bold transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">handshake</span>
          Oferecer Empate
        </button>
        <button 
          onClick={surrender}
          disabled={!!gameResult}
          className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 disabled:opacity-50 p-4 rounded-2xl text-xs font-bold transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">flag</span>
          Desistir
        </button>
      </div>

      {/* Result Overlay */}
      {gameResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/90 backdrop-blur-md p-6 animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-card-dark border border-slate-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
              <div className={`size-20 ${gameResult.includes('white') ? 'bg-accent-green/20 text-accent-green' : 'bg-red-500/20 text-red-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <span className="material-symbols-outlined text-5xl">{gameResult === 'draw' ? 'handshake' : 'emoji_events'}</span>
              </div>
              <h2 className="text-3xl font-black mb-2 uppercase italic tracking-tighter">
                {gameResult === 'white_win' ? 'Vitória Branca!' : gameResult === 'red_win' ? 'Vitória Vermelha!' : gameResult === 'draw' ? 'Empate Técnico' : gameResult === 'timeout' ? 'Tempo Esgotado' : 'Derrota'}
              </h2>
              <p className="text-slate-400 mb-8 font-medium">
                {gameResult === 'white_win' || gameResult === 'red_win' ? 'Fim de jogo por captura total ou bloqueio.' : gameResult === 'draw' ? 'Partida empatada por acordo.' : gameResult === 'timeout' ? 'A partida foi encerrada pelo relógio.' : 'Partida encerrada.'}
              </p>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-8 flex justify-between items-center">
                 <div className="text-left">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Novo ELO</p>
                    <p className="text-xl font-black text-primary">{gameResult === 'white_win' ? '2492 (+12)' : gameResult === 'red_win' ? '2465 (-15)' : '2480'}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">XP Ganhos</p>
                    <p className="text-xl font-black text-accent-green">+{gameResult === 'white_win' ? '250' : '50'}</p>
                 </div>
              </div>

              <button 
                onClick={onBack}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
              >
                VOLTAR AO LOBBY
              </button>
           </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-navy-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
           Sincronizado
        </div>
        <div>Ping: 12ms</div>
      </div>
    </div>
  );
};

export default GameView;
