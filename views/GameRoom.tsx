
import React, { useState, useEffect } from 'react';
import { PlayerProfile, Room, Game, Move, PlayerColor } from '../types';
import { getValidMoves, applyMove, checkGameOver, getPieceAt, getAvailableCaptures } from '../services/gameLogic';
import { BOARD_SIZE } from '../constants';
import { supabase } from '../lib/supabase';
import { gameService } from '../services/supabase';

interface GameRoomProps {
  user: PlayerProfile;
  roomId: string;
  onBack: () => void;
}

const GameRoom: React.FC<GameRoomProps> = ({ user, roomId, onBack }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [selectedPos, setSelectedPos] = useState<{ r: number, c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [isResigning, setIsResigning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [spectators, setSpectators] = useState<any[]>([]);
  const [isResetting, setIsResetting] = useState(false);

  const userColor: PlayerColor | 'observer' = 
    room?.player_white_id === user.id ? 'white' : 
    (room?.player_red_id === user.id ? 'red' : 'observer');

  const isMyTurn = userColor !== 'observer' && game?.current_turn === userColor;

  const handleRematch = async () => {
    if (!game || !room || isResetting) return;
    try {
      setIsResetting(true);
      await gameService.resetGame(game.id, room.initial_time);
      // O resetGame define has_started: false e winner_id: null, voltando ao estado de preparação.
    } catch (err) {
      alert("Erro ao solicitar revanche.");
    } finally {
      setIsResetting(false);
    }
  };

  const isHost = room?.player_white_id === user.id || (room?.player_white_id === null && room?.player_red_id === user.id);

  useEffect(() => {
    const performLeave = () => {
      gameService.leaveRoom(roomId, user.id);
    };

    window.addEventListener('beforeunload', performLeave);

    return () => {
      window.removeEventListener('beforeunload', performLeave);
      performLeave();
    };
  }, [roomId, user.id]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      const { data: gameData } = await supabase.from('games').select('*').eq('room_id', roomId).single();
      
      if (!roomData) {
        onBack();
        return;
      }
      
      setRoom(roomData);
      setGame(gameData);
    };

    fetchInitialData();

    const roomSub = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        if (!payload.new || Object.keys(payload.new).length === 0) {
          onBack();
          return;
        }
        setRoom(payload.new as Room);
      })
      .subscribe();

    const gameSub = supabase.channel(`game:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `room_id=eq.${roomId}` }, (payload) => {
        setGame(payload.new as Game);
        // Ao resetar o game, limpamos as seleções locais
        if (payload.new && !payload.new.has_started && !payload.new.winner_id) {
          setSelectedPos(null);
          setValidMoves([]);
        }
      })
      .subscribe();

    const presenceChannel = supabase.channel(`presence:${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const activeUsers = Object.values(newState).flat();
        setSpectators(activeUsers.filter((u: any) => u.id !== room?.player_white_id && u.id !== room?.player_red_id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ id: user.id, username: user.username, avatar: user.avatar_url });
        }
      });

    return () => {
      supabase.removeChannel(roomSub);
      supabase.removeChannel(gameSub);
      supabase.removeChannel(presenceChannel);
    };
  }, [roomId, user.id]);

  useEffect(() => {
    if (!game || game.winner_id || !game.has_started) return;

    const timer = setInterval(() => {
      setGame(prev => {
        if (!prev) return null;
        const next = { ...prev };
        if (prev.current_turn === 'white') next.white_time = Math.max(0, prev.white_time - 1);
        else next.red_time = Math.max(0, prev.red_time - 1);
        
        if (next.white_time === 0 && game.current_turn === 'white') handleGameEnd('red');
        if (next.red_time === 0 && game.current_turn === 'red') handleGameEnd('white');
        
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game?.current_turn, game?.winner_id, game?.has_started]);

  const handleGameEnd = async (winner: PlayerColor | 'draw') => {
    if (!game || !room) return;
    const winnerId = winner === 'draw' ? 'draw' : (winner === 'white' ? room.player_white_id : room.player_red_id);
    if (!winnerId) return;

    await gameService.updateGameState(game.id, { winner_id: winnerId, has_started: false });
    await gameService.processGameEnd(winnerId, room);
  };

  const handleStartGame = async () => {
    if (!game) return;
    await gameService.startGame(game.id);
  };

  const handleOfferDraw = async () => {
    if (!game || game.winner_id || userColor === 'observer') return;
    await gameService.updateGameState(game.id, { draw_offered_by: user.id });
  };

  const handleAcceptDraw = async () => {
    await handleGameEnd('draw');
  };

  const handleResign = async () => {
    const winnerColor = userColor === 'white' ? 'red' : 'white';
    await handleGameEnd(winnerColor);
    setIsResigning(false);
  };

  const handleSquareClick = async (r: number, c: number) => {
    if (!isMyTurn || !game || game.winner_id || !game.has_started) return;

    const move = validMoves.find(m => 
      m.from.r === selectedPos?.r && m.from.c === selectedPos?.c && 
      m.to.r === r && m.to.c === c
    );

    if (move) {
      let newBoard = applyMove(game.board_state, move);
      const piece = newBoard[move.to.r][move.to.c]!;
      let nextTurn = game.current_turn;
      let nextMustContinue: string | null = null;

      if (move.captures) {
        const chain = getAvailableCaptures(newBoard, game.current_turn, piece.id);
        if (chain.length > 0) {
          nextMustContinue = piece.id;
          setSelectedPos({ r: move.to.r, c: move.to.c });
          setValidMoves(chain);
        } else {
          if (!piece.isKing) {
            if ((piece.color === 'white' && move.to.r === 0) || (piece.color === 'red' && move.to.r === BOARD_SIZE - 1)) {
              piece.isKing = true;
            }
          }
          nextTurn = game.current_turn === 'white' ? 'red' : 'white';
        }
      } else {
        if (!piece.isKing) {
          if ((piece.color === 'white' && move.to.r === 0) || (piece.color === 'red' && move.to.r === BOARD_SIZE - 1)) {
            piece.isKing = true;
          }
        }
        nextTurn = game.current_turn === 'white' ? 'red' : 'white';
      }

      const { winner } = checkGameOver(newBoard, nextTurn);

      await gameService.updateGameState(game.id, {
        board_state: newBoard,
        current_turn: nextTurn,
        must_continue_piece_id: nextMustContinue,
        has_started: true,
        winner_id: winner ? (winner === 'white' ? room?.player_white_id : room?.player_red_id) : null,
        white_time: game.white_time,
        red_time: game.red_time
      });

      if (winner) await gameService.processGameEnd(winner === 'white' ? room!.player_white_id! : room!.player_red_id!, room!);

      if (!nextMustContinue) {
        setSelectedPos(null);
        setValidMoves([]);
      }
    } else {
      const piece = getPieceAt(game.board_state, r, c);
      if (piece && piece.color === userColor) {
        if (game.must_continue_piece_id && piece.id !== game.must_continue_piece_id) return;
        const moves = getValidMoves(game.board_state, userColor, game.must_continue_piece_id || undefined);
        const pieceMoves = moves.filter(m => m.from.r === r && m.from.c === c);
        if (pieceMoves.length > 0) {
          setSelectedPos({ r, c });
          setValidMoves(pieceMoves);
        }
      } else {
        if (!game.must_continue_piece_id) {
          setSelectedPos(null);
          setValidMoves([]);
        }
      }
    }
  };

  const handleChallenge = async () => {
    if (userColor !== 'observer') return;
    await gameService.joinRoom(roomId, user.id);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!room || !game) return <div className="min-h-screen bg-background-dark flex items-center justify-center text-primary font-black">ENTRANDO...</div>;

  const getThemeClasses = () => {
    switch (room.theme) {
      case 'wood': return { dark: 'bg-[#5d4037]', light: 'bg-[#d7ccc8]', border: 'border-[#3e2723]' };
      case 'neon': return { dark: 'bg-[#0f172a] shadow-[inset_0_0_20px_#1e40af]', light: 'bg-[#1e293b]', border: 'border-[#1e3a8a]' };
      default: return { dark: 'bg-board-dark', light: 'bg-board-light', border: 'border-surface-dark' };
    }
  };

  const theme = getThemeClasses();
  const bothPlayersPresent = room.player_white_id && room.player_red_id;

  const renderBoard = () => {
    const indices = Array.from({ length: 8 }, (_, i) => i);
    const rows = userColor === 'red' ? [...indices].reverse() : indices;
    const cols = userColor === 'red' ? [...indices].reverse() : indices;

    return rows.map(r => (
      <React.Fragment key={r}>
        {cols.map(c => {
          const piece = game.board_state[r][c];
          const isDark = (r + c) % 2 === 0;
          const isSelected = selectedPos?.r === r && selectedPos?.c === c;
          const isValidMove = validMoves.some(m => m.to.r === r && m.to.c === c);

          return (
            <div 
              key={`${r}-${c}`}
              onClick={() => handleSquareClick(r, c)}
              className={`relative flex items-center justify-center transition-all duration-300
                ${isDark ? theme.dark : theme.light}
                ${isSelected ? 'ring-inset ring-4 ring-primary/60 bg-primary/30' : ''}
                ${isValidMove ? 'after:content-[""] after:absolute after:size-4 after:rounded-full after:bg-primary/50 cursor-pointer' : ''}
              `}
            >
              {piece && (
                <div className={`size-[85%] rounded-full shadow-2xl border-b-4 flex items-center justify-center transform transition-all 
                  ${piece.color === 'white' ? 'bg-[#f8f0e3] border-gray-400 text-gray-800' : 'bg-red-600 border-red-800 text-white'}
                  ${room.theme === 'neon' ? 'shadow-[0_0_15px_currentColor]' : ''}
                  ${piece.isKing ? 'ring-2 ring-yellow-400' : ''}
                  ${piece.color === userColor && isMyTurn && game.has_started ? 'cursor-grab scale-105' : ''}
                `}>
                  {piece.isKing && <span className="material-symbols-outlined text-yellow-500 filled text-xl">crown</span>}
                </div>
              )}
            </div>
          );
        })}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-white overflow-hidden font-display">
      <header className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-dark shadow-lg z-10">
        <button onClick={onBack} className="material-symbols-outlined hover:text-primary transition-colors">arrow_back</button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">{room.room_name}</span>
          <div className="flex gap-4 items-center bg-black/30 px-4 py-1.5 rounded-full border border-white/5">
            <span className={`text-xl font-black tabular-nums ${game.current_turn === 'white' ? 'text-primary' : 'text-white/20'}`}>{formatTime(game.white_time)}</span>
            <span className="text-white/10 font-bold italic text-xs">VS</span>
            <span className={`text-xl font-black tabular-nums ${game.current_turn === 'red' ? 'text-red-500' : 'text-white/20'}`}>{formatTime(game.red_time)}</span>
          </div>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="material-symbols-outlined text-text-secondary hover:text-white">groups</button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {game.draw_offered_by && game.draw_offered_by !== user.id && !game.winner_id && (
          <div className="absolute top-20 z-[110] bg-surface-dark p-6 rounded-2xl border border-primary/40 shadow-2xl animate-in slide-in-from-top-4">
             <p className="text-center font-bold mb-4">OPONENTE OFERECEU EMPATE</p>
             <div className="flex gap-3">
                <button onClick={() => gameService.updateGameState(game.id, { draw_offered_by: null })} className="flex-1 py-2 bg-white/5 rounded-xl font-bold">RECUSAR</button>
                <button onClick={handleAcceptDraw} className="flex-1 py-2 bg-primary rounded-xl font-bold">ACEITAR</button>
             </div>
          </div>
        )}

        {!game.has_started && !game.winner_id && bothPlayersPresent && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            {isHost ? (
              <button 
                onClick={handleStartGame}
                className="px-12 py-5 bg-primary text-white font-black text-xl rounded-2xl shadow-[0_0_50px_rgba(19,109,236,0.5)] hover:scale-110 transition-transform animate-bounce"
              >
                INICIAR PARTIDA
              </button>
            ) : (
              <div className="bg-surface-dark px-8 py-6 rounded-2xl border border-primary/30 shadow-2xl text-center">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-bold uppercase tracking-widest">Aguardando Host...</p>
              </div>
            )}
          </div>
        )}

        {!game.has_started && !game.winner_id && !bothPlayersPresent && userColor !== 'observer' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-surface-dark px-8 py-6 rounded-2xl border border-white/5 shadow-2xl text-center">
              <p className="text-lg font-bold animate-pulse uppercase tracking-widest text-primary">Aguardando Oponente...</p>
              <p className="text-[10px] text-text-secondary mt-2">ID: {room.id.slice(0, 8)}</p>
            </div>
          </div>
        )}

        {userColor === 'observer' && (
          <div className="absolute top-4 bg-primary/20 border border-primary/40 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md z-20">
            <span className="material-symbols-outlined text-[16px] filled animate-pulse">visibility</span>
            MODO ESPECTADOR
            {!bothPlayersPresent && (
              <button onClick={handleChallenge} className="ml-2 bg-primary px-3 py-1 rounded-full hover:scale-105 transition-transform">ASSUMIR LUGAR</button>
            )}
          </div>
        )}

        <div className={`w-full max-w-[420px] aspect-square border-[12px] ${theme.border} rounded-xl overflow-hidden shadow-2xl grid grid-cols-8 grid-rows-8 relative`}>
          {renderBoard()}
        </div>

        {game.winner_id && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-xs p-8 bg-surface-dark rounded-3xl text-center shadow-2xl border border-white/10">
              <span className="material-symbols-outlined text-yellow-500 text-6xl mb-4 filled">{game.winner_id === 'draw' ? 'handshake' : 'emoji_events'}</span>
              <h2 className="text-3xl font-black mb-2 italic tracking-tighter">FIM DE JOGO</h2>
              <p className="text-lg font-bold text-primary mb-6 uppercase tracking-wider">
                {game.winner_id === 'draw' ? 'EMPATE!' : (game.winner_id === user.id ? 'VITÓRIA! (+20)' : 'DERROTA (-15)')}
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleRematch} 
                  disabled={isResetting}
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isResetting ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'NOVA PARTIDA'}
                </button>
                <button onClick={onBack} className="w-full py-4 bg-white/5 text-white/60 font-black rounded-2xl border border-white/5 hover:bg-white/10">SAIR DA SALA</button>
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-surface-dark border-l border-white/10 z-[120] p-6 shadow-2xl animate-in slide-in-from-right-4">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-sm uppercase tracking-widest">Painel da Sala</h3>
                <button onClick={() => setShowSettings(false)} className="material-symbols-outlined">close</button>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-3">
                   <p className="text-[10px] font-black text-text-secondary uppercase">Jogadores</p>
                   {room.player_white_id && (
                     <div className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[120px]">{room.player_white_id === user.id ? 'Você (Brancas)' : 'Oponente (Brancas)'}</span>
                     </div>
                   )}
                   {room.player_red_id && (
                     <div className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[120px]">{room.player_red_id === user.id ? 'Você (Vermelhas)' : 'Oponente (Vermelhas)'}</span>
                     </div>
                   )}
                </div>

                <div className="space-y-3">
                   <p className="text-[10px] font-black text-text-secondary uppercase">Espectadores ({spectators.length})</p>
                   {spectators.map(s => (
                     <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-white/60 truncate max-w-[120px]">{s.username}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </main>

      <footer className="p-6 bg-surface-dark border-t border-white/5 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className={`relative size-14 rounded-2xl border-2 transition-all ${isMyTurn && game.has_started ? 'border-primary ring-8 ring-primary/10' : 'border-white/10 opacity-50'}`}>
            <img src={user.avatar_url} className="w-full h-full rounded-2xl object-cover" />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-black text-white">{user.username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`size-2 rounded-full ${isMyTurn && game.has_started ? 'bg-primary animate-pulse' : 'bg-white/20'}`}></span>
              <p className={`text-[10px] uppercase font-black tracking-widest ${isMyTurn && game.has_started ? 'text-primary' : 'text-text-secondary'}`}>
                {game.has_started ? (isMyTurn ? 'Sua Vez' : 'Esperando') : 'Aguardando'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
           {game.has_started && !game.winner_id && userColor !== 'observer' && (
             <>
                <button onClick={handleOfferDraw} disabled={!!game.draw_offered_by} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30">
                   <span className="material-symbols-outlined text-[20px]">handshake</span>
                   <span className="text-[8px] font-bold uppercase">Empate</span>
                </button>
                <button onClick={() => setIsResigning(true)} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all">
                   <span className="material-symbols-outlined text-[20px]">flag</span>
                   <span className="text-[8px] font-bold uppercase">Desistir</span>
                </button>
             </>
           )}
        </div>

        {isResigning && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/90 backdrop-blur-sm">
             <div className="w-full max-w-xs p-8 bg-surface-dark rounded-3xl text-center border border-red-500/20">
                <h3 className="text-xl font-black mb-4">CONFIRMAR DERROTA?</h3>
                <div className="flex gap-4">
                   <button onClick={() => setIsResigning(false)} className="flex-1 py-3 bg-white/5 font-bold rounded-xl">CANCELAR</button>
                   <button onClick={handleResign} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl">CONFIRMAR</button>
                </div>
             </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default GameRoom;
