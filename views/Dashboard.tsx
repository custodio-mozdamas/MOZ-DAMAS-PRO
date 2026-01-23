
import React, { useState, useEffect } from 'react';
import { PlayerProfile, Room } from '../types';
import { gameService } from '../services/supabase';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  user: PlayerProfile;
  onPlay: (gameId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onPlay }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [roomConfig, setRoomConfig] = useState({
    name: '',
    theme: 'classic',
    time: '5',
    side: 'white'
  });

  const fetchRooms = async () => {
    const rooms = await gameService.getRooms();
    setPublicRooms(rooms as Room[]);
  };

  useEffect(() => {
    // Limpeza inicial silenciosa das próprias salas pendentes
    gameService.purgeAllRooms().finally(() => fetchRooms());

    // Sincronização em tempo real do Lobby
    const channel = supabase.channel('moz-lobby-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    // Refresh forçado a cada 30 segundos para garantir a aplicação do filtro de tempo
    const interval = setInterval(fetchRooms, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!roomConfig.name.trim()) {
      alert("Por favor, dê um nome à sala.");
      return;
    }
    if (isCreating) return;

    try {
      setIsCreating(true);
      const newRoom = await gameService.createRoom(roomConfig, user.id);
      if (newRoom) {
        setShowCreateModal(false);
        onPlay(newRoom.id);
      }
    } catch (err: any) {
      alert("Erro ao criar sala. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePurge = async () => {
    setIsPurging(true);
    await gameService.purgeAllRooms();
    await fetchRooms();
    setIsPurging(false);
  };

  const handleJoinRoom = async (gameId: string) => {
    try {
      const joined = await gameService.joinRoom(gameId, user.id);
      if (joined) onPlay(gameId);
    } catch (err) {
      alert("Não foi possível entrar na sala.");
    }
  };

  return (
    <div className="flex flex-col pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-[#293038]">
        <div className="flex items-center p-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex shrink-0 items-center">
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary/20" 
                style={{ backgroundImage: `url(${user.avatar_url})` }}
              ></div>
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-background-dark"></div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-white text-base font-bold leading-tight truncate max-w-[150px]">{user.username}</h2>
              <span className="text-xs text-[#92a9c9] font-medium">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-end bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-yellow-500 text-[18px] mr-1 filled">trophy</span>
            <p className="text-primary text-sm font-bold">{user.elo}</p>
          </div>
        </div>
      </div>

      <main className="flex flex-col gap-6 px-4 py-5">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white tracking-light text-[20px] font-bold leading-tight">Damas Pro</h2>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">Regra Brasileira</span>
          </div>
          <div className="flex flex-col items-stretch justify-start rounded-xl shadow-lg bg-surface-dark overflow-hidden border border-[#2a3b55] relative group cursor-pointer" onClick={() => setShowCreateModal(true)}>
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
            <div className="flex flex-col w-full p-5 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <span className="material-symbols-outlined text-3xl">bolt</span>
                </div>
                <div className="px-2 py-1 rounded bg-[#2a3b55] text-[10px] font-bold text-[#92a9c9] uppercase tracking-widest">
                  MOZ ELITE
                </div>
              </div>
              <p className="text-white text-2xl font-bold leading-tight mb-1 tracking-tighter italic">Partida Rápida</p>
              <p className="text-[#92a9c9] text-sm font-normal mb-5">Crie uma sala e desafie um mestre</p>
              <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary hover:bg-primary-dark transition-colors text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                Criar Sala
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-[20px] font-bold leading-tight">Lobby Aberto</h3>
            <div className="flex items-center gap-4">
               <button 
                 onClick={handlePurge} 
                 disabled={isPurging}
                 className="material-symbols-outlined text-primary hover:text-white transition-all text-[24px] disabled:opacity-30 p-2"
                 title="Atualizar e Limpar"
               >
                 refresh
               </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {publicRooms.map(room => (
              <div key={room.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-dark border border-[#2a3b55] shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">meeting_room</span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white text-sm font-bold truncate">{room.room_name || `Mestre #${room.id.slice(0,4)}`}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-text-secondary font-black uppercase">{room.initial_time} min</span>
                      <span className="size-1 rounded-full bg-primary/30"></span>
                      <span className="text-[10px] text-text-secondary font-black uppercase truncate">{room.theme}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleJoinRoom(room.id)}
                  className="flex items-center justify-center h-9 px-5 rounded-lg bg-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-white/5 active:scale-95"
                >
                  {room.status === 'active' ? 'Assistir' : 'Jogar'}
                </button>
              </div>
            ))}
            {publicRooms.length === 0 && (
              <div className="text-center py-16 bg-white/5 rounded-2xl border border-dashed border-white/10 text-text-secondary italic text-xs">
                Lobby pronto para novas partidas!
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modal Criar Sala */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface-dark w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-black italic tracking-tighter">CONFIGURAR SALA</h3>
              <button onClick={() => setShowCreateModal(false)} className="material-symbols-outlined text-white/50 hover:text-white">close</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">Nome da Partida</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-primary transition-colors font-bold"
                  placeholder="Ex: Duelo de Gigantes"
                  value={roomConfig.name}
                  onChange={(e) => setRoomConfig({...roomConfig, name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">Ambiente</label>
                <div className="grid grid-cols-3 gap-2">
                  {['classic', 'wood', 'neon'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setRoomConfig({...roomConfig, theme: t as any})}
                      className={`py-3 rounded-xl border text-[10px] uppercase font-black tracking-tighter transition-all ${roomConfig.theme === t ? 'border-primary bg-primary text-white' : 'border-white/5 bg-white/5 text-text-secondary'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">Tempo (Min)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['1', '3', '5', '10'].map(m => (
                      <button 
                        key={m}
                        onClick={() => setRoomConfig({...roomConfig, time: m})}
                        className={`py-2 rounded-lg border text-xs font-black transition-all ${roomConfig.time === m ? 'border-primary bg-primary text-white' : 'border-white/5 bg-white/5 text-text-secondary'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">Lado</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setRoomConfig({...roomConfig, side: 'white'})}
                      className={`flex-1 py-3 rounded-xl border flex items-center justify-center transition-all ${roomConfig.side === 'white' ? 'border-primary bg-primary' : 'border-white/5 bg-white/5'}`}
                    >
                      <div className="size-5 rounded-full bg-[#f8f0e3] border border-black/10"></div>
                    </button>
                    <button 
                      onClick={() => setRoomConfig({...roomConfig, side: 'red'})}
                      className={`flex-1 py-3 rounded-xl border flex items-center justify-center transition-all ${roomConfig.side === 'red' ? 'border-primary bg-primary' : 'border-white/5 bg-white/5'}`}
                    >
                      <div className="size-5 rounded-full bg-red-600 border border-white/10"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5">
              <button 
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                {isCreating ? 'PROCESSANDO...' : 'CRIAR E ENTRAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
