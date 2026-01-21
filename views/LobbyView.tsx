
import React, { useState, useEffect } from 'react';
import { GameRoom } from '../types';
import { supabase } from '../lib/supabase';

interface LobbyViewProps {
  onJoinGame: (room: GameRoom) => void;
  createTrigger?: number;
  userName: string;
  userAvatar: string;
}

const LobbyView: React.FC<LobbyViewProps> = ({ onJoinGame, createTrigger, userName, userAvatar }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'Ranked' | 'Casual'>('Ranked');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const [newRoomMode, setNewRoomMode] = useState<'Blitz' | 'Bullet' | 'Rapid'>('Blitz');
  const [newRoomType, setNewRoomType] = useState<'Ranked' | 'Casual'>('Ranked');

  useEffect(() => {
    fetchRooms();

    // Sincronização Realtime
    const channel = supabase
      .channel('lobby-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setRooms(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      setIsModalOpen(true);
    }
  }, [createTrigger]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    const newRoom = {
      creator_id: user?.id,
      creator: userName,
      mode: newRoomMode,
      time: newRoomMode === 'Blitz' ? '3 + 2' : newRoomMode === 'Bullet' ? '1 + 0' : '10 + 5',
      type: newRoomType,
      color: newRoomType === 'Ranked' ? 'primary' : 'accent-green'
    };

    const { error } = await supabase.from('rooms').insert(newRoom);
    if (error) alert(error.message);
    else setIsModalOpen(false);
  };

  const filteredRooms = rooms.filter(room => 
    room.type === filter && 
    room.creator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 relative">
      <div className="bg-card-dark border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img alt="Perfil" className="w-10 h-10 rounded-full border-2 border-primary object-cover" src={userAvatar} />
            <div className="absolute -bottom-1 -right-1 bg-accent-green w-3 h-3 rounded-full border-2 border-card-dark"></div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">JOGADOR</p>
            <p className="text-sm font-bold truncate max-w-[100px]">{userName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-800 flex flex-col items-center min-w-[60px]">
            <span className="text-[10px] text-slate-500 font-bold uppercase">ELO</span>
            <span className="text-sm font-black text-primary">1200</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
          <input 
            className="w-full bg-slate-900 border-slate-800 rounded-xl pl-10 pr-4 h-11 text-sm focus:ring-primary focus:border-primary text-white outline-none" 
            placeholder="Buscar sala ou jogador..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('Ranked')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg ${
              filter === 'Ranked' ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Rankeada
          </button>
          <button 
            onClick={() => setFilter('Casual')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'Casual' ? 'bg-accent-green text-white shadow-lg shadow-accent-green/20' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Casual
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Salas Online</h3>
          <span className="text-[10px] font-bold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span> {filteredRooms.length} Salas
          </span>
        </div>
        
        {loading ? (
          <div className="text-center py-10 text-slate-500">Sincronizando...</div>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map((room) => (
              <div 
                key={room.id}
                className="bg-card-dark border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 ${room.color === 'primary' ? 'text-primary' : room.color === 'accent-green' ? 'text-accent-green' : 'text-orange-500'}`}>
                    <span className="material-symbols-outlined text-2xl">
                      {room.mode === 'Blitz' ? 'timer' : room.mode === 'Bullet' ? 'bolt' : 'schedule'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{room.time}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded ${
                        room.mode === 'Blitz' ? 'bg-primary/20 text-primary' : 
                        room.mode === 'Bullet' ? 'bg-accent-green/20 text-accent-green' : 
                        'bg-orange-500/20 text-orange-500'
                      }`}>
                        {room.mode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Criador: <span className="text-slate-300 font-medium">{room.creator}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 mb-1">{room.type.toUpperCase()}</p>
                  <button 
                    onClick={() => onJoinGame(room)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 text-white ${room.type === 'Ranked' ? 'bg-primary hover:bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                  >
                    Jogar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card-dark border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Criar Nova Sala</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Modo de Jogo</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Bullet', 'Blitz', 'Rapid'] as const).map(m => (
                    <button 
                      key={m}
                      type="button"
                      onClick={() => setNewRoomMode(m)}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${newRoomMode === m ? 'bg-primary/20 border-primary text-primary' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Partida</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Ranked', 'Casual'] as const).map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => setNewRoomType(t)}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${newRoomType === t ? 'bg-primary/20 border-primary text-primary' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    >
                      {t === 'Ranked' ? 'Rankeada' : 'Casual'}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-accent-green text-white font-black rounded-2xl shadow-lg shadow-accent-green/20 hover:bg-emerald-600 transition-all active:scale-[0.98]"
              >
                PUBLICAR NO LOBBY
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyView;
