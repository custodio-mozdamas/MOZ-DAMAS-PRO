
import React, { useState } from 'react';

interface Tournament {
  id: string;
  title: string;
  status: 'live' | 'upcoming' | 'finished';
  prize: string;
  players: string;
  maxPlayers: number;
  startTime: string;
  image: string;
  tag: string;
}

const Tournaments: React.FC<{onBack: () => void}> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live');
  const [joinedIds, setJoinedIds] = useState<string[]>([]);

  const allTournaments: Tournament[] = [
    {
      id: '1',
      title: 'Moçambique Open Blitz',
      status: 'live',
      prize: '1.500 MT',
      players: '45',
      maxPlayers: 64,
      startTime: 'Começa em 2h 15m',
      image: 'https://picsum.photos/seed/trophy1/150/150',
      tag: 'Inscrições Abertas'
    },
    {
      id: '2',
      title: 'Copa Novatos Moz',
      status: 'upcoming',
      prize: '500 MT',
      players: '12',
      maxPlayers: 32,
      startTime: 'Amanhã 20:00',
      image: 'https://picsum.photos/seed/trophy2/150/150',
      tag: 'Entrada Grátis'
    },
    {
      id: '3',
      title: 'Masters Maputo 2024',
      status: 'finished',
      prize: '5.000 MT',
      players: '128',
      maxPlayers: 128,
      startTime: 'Finalizado',
      image: 'https://picsum.photos/seed/trophy3/150/150',
      tag: 'Elite'
    },
    {
      id: '4',
      title: 'Blitz das Sextas',
      status: 'upcoming',
      prize: '250 MT',
      players: '8',
      maxPlayers: 16,
      startTime: 'Sexta 18:00',
      image: 'https://picsum.photos/seed/trophy4/150/150',
      tag: 'Semanal'
    }
  ];

  const filteredTournaments = allTournaments.filter(t => t.status === activeTab);

  const handleJoin = (id: string) => {
    if (joinedIds.includes(id)) return;
    setJoinedIds([...joinedIds, id]);
    alert("Inscrição realizada com sucesso! Você receberá uma notificação quando o torneio começar.");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-24">
      <header className="sticky top-0 z-50 flex items-center bg-background-dark/95 backdrop-blur-md p-4 border-b border-gray-800">
        <button onClick={onBack} className="material-symbols-outlined size-10 flex items-center justify-center hover:bg-white/5 rounded-full">arrow_back</button>
        <h2 className="flex-1 text-center text-lg font-bold">Torneios Oficiais</h2>
        <div className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">filter_list</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex px-4 py-3 sticky top-[73px] z-40 bg-background-dark/95 backdrop-blur-md">
        <div className="flex h-11 flex-1 items-center justify-center rounded-xl bg-surface-dark p-1 border border-white/5">
          {(['live', 'upcoming', 'finished'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 h-full rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'
              }`}
            >
              {tab === 'live' ? 'Ao Vivo' : tab === 'upcoming' ? 'Próximos' : 'Finalizados'}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-4 space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-black italic tracking-tighter uppercase">
            {activeTab === 'live' ? 'Em Andamento' : activeTab === 'upcoming' ? 'Lista de Espera' : 'Arquivo de Glória'}
          </h3>
          <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
            {filteredTournaments.length} TORNEIOS
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {filteredTournaments.map((t) => (
            <div key={t.id} className="flex flex-col gap-4 rounded-2xl bg-surface-dark p-5 border border-white/5 shadow-xl hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-[2_2_0px] flex-col gap-2">
                  <span className={`w-fit text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                    t.status === 'live' ? 'bg-green-900/30 text-green-400 border border-green-400/20' : 
                    t.status === 'upcoming' ? 'bg-blue-900/30 text-blue-300 border border-blue-300/20' : 
                    'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}>
                    {t.tag}
                  </span>
                  <p className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{t.title}</p>
                  <p className="text-text-secondary text-sm font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">schedule</span> 
                    {t.startTime}
                  </p>
                </div>
                <div 
                  className="w-24 h-24 bg-cover rounded-xl bg-center border border-white/5 shadow-inner shrink-0" 
                  style={{backgroundImage: `url(${t.image})`}}
                ></div>
              </div>
              
              <div className="h-px bg-white/5 w-full"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-text-secondary font-black uppercase tracking-tighter">Prémio Total</span>
                    <span className="text-base font-black text-yellow-500">{t.prize}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-text-secondary font-black uppercase tracking-tighter">Inscritos</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black text-white">{t.players}</span>
                      <span className="text-xs text-text-secondary">/ {t.maxPlayers}</span>
                    </div>
                  </div>
                </div>

                {t.status !== 'finished' && (
                  <button 
                    onClick={() => handleJoin(t.id)}
                    disabled={joinedIds.includes(t.id)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                      joinedIds.includes(t.id) 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                      : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark'
                    }`}
                  >
                    {joinedIds.includes(t.id) ? 'Inscrito ✓' : 'Participar'}
                  </button>
                )}
                {t.status === 'finished' && (
                  <button className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-white/5 text-text-secondary border border-white/5">
                    Resultados
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredTournaments.length === 0 && (
            <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
              <span className="material-symbols-outlined text-5xl text-white/10 mb-2">event_busy</span>
              <p className="text-text-secondary italic text-sm">Nenhum torneio nesta categoria no momento.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tournaments;
