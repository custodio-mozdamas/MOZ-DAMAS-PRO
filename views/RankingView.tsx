
import React, { useState } from 'react';
import { Tournament } from '../types';

const RankingView: React.FC = () => {
  const [period, setPeriod] = useState<'Global' | 'Mensal' | 'Semanal'>('Global');

  const tournaments: Tournament[] = [
    { id: '1', title: 'Copa Brasil Elite', startTime: '2h 15m', prize: 'R$ 5.000,00', players: '128/256', status: 'Aberto' },
    { id: '2', title: 'Mundial Blitz', startTime: 'Amanhã, 14:00', prize: 'U$ 1.200,00', players: '50 Moedas', status: 'Premium' },
    { id: '3', title: 'Torneio dos Novatos', startTime: '3h 40m', prize: 'XP Dobrado', players: 'ELO < 1200', status: 'Série B' },
  ];

  const rankings = [
    { rank: 1, name: 'Arthur "O Rei"', title: 'Grande Mestre', elo: 2840, avatar: 'https://picsum.photos/seed/a1/100', country: 'BR' },
    { rank: 2, name: 'CheckmatePro', title: 'Mestre Internacional', elo: 2795, avatar: 'https://picsum.photos/seed/a2/100', country: 'US' },
    { rank: 3, name: 'DamaFatal', title: 'Mestre', elo: 2712, avatar: 'https://picsum.photos/seed/a3/100', country: 'FR' },
  ];

  return (
    <div className="px-4 py-6 space-y-8 animate-in slide-in-from-bottom duration-500">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Ranking de Mestres</h2>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">Top 100</span>
        </div>
        <div className="bg-slate-900/50 p-1 rounded-xl flex border border-slate-800">
          {(['Global', 'Mensal', 'Semanal'] as const).map((p) => (
            <button 
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${period === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rankings.map((player) => (
            <div key={player.rank} className="flex items-center gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-primary/30 transition-colors">
              <span className={`text-xl font-black w-6 ${player.rank === 1 ? 'text-amber-400' : player.rank === 3 ? 'text-orange-400' : 'text-slate-400'}`}>
                {player.rank}
              </span>
              <div className="relative">
                <img alt="Avatar" className="size-10 rounded-full border border-slate-700" src={player.avatar} />
                <div className="absolute -bottom-1 -right-1 size-4 bg-white rounded-sm overflow-hidden border border-slate-900">
                  <img alt="Flag" className="w-full h-full object-cover" src={`https://flagcdn.com/w40/${player.country.toLowerCase()}.png`} />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{player.name}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase">{player.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-primary">{player.elo}</p>
                <p className="text-[10px] text-slate-500 uppercase">ELO</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-xl mt-4">
            <span className="text-sm font-bold text-primary w-6">452</span>
            <div className="relative">
              <img alt="Sua Foto" className="size-10 rounded-full border-2 border-primary" src="https://picsum.photos/seed/user/100" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Você (Sergey_V)</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Aspirante</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-primary">2480</p>
              <p className="text-[10px] text-slate-500 uppercase">ELO</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Próximos Torneios</h2>
          <a className="text-xs font-bold text-primary flex items-center gap-1" href="#">Ver todos <span className="material-symbols-outlined text-sm">chevron_right</span></a>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
          {tournaments.map((t) => (
            <div key={t.id} className="min-w-[280px] bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 snap-start relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  t.status === 'Aberto' ? 'bg-accent-green/20 text-accent-green' : 
                  t.status === 'Premium' ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-500'
                }`}>
                  {t.status}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">{t.title}</h3>
                <p className="text-xs text-slate-500">Inicia em: {t.startTime}</p>
              </div>
              <div className="flex justify-between items-center py-2 border-y border-slate-800/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Prêmio</span>
                  <span className="text-sm font-bold text-white">{t.prize}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Jogadores</span>
                  <span className="text-sm font-bold text-white">{t.players}</span>
                </div>
              </div>
              <button className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                t.status === 'Premium' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-primary hover:bg-blue-600 text-white shadow-primary/20'
              }`}>
                {t.status === 'Aberto' ? (
                  <>
                    <span className="material-symbols-outlined text-sm">login</span>
                    Entrar Agora
                  </>
                ) : 'Inscrição Prévia'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RankingView;
