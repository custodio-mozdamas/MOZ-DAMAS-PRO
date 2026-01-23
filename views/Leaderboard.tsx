
import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types';
import { leaderboardService } from '../services/supabase';

const Leaderboard: React.FC<{onBack: () => void}> = ({ onBack }) => {
  const [players, setPlayers] = useState<(PlayerProfile & { rank: number, country: string })[]>([]);

  useEffect(() => {
    leaderboardService.getTopPlayers().then(setPlayers);
  }, []);

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="flex flex-col pb-28 min-h-screen bg-background-dark">
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-gray-800 flex items-center p-4">
        <button onClick={onBack} className="material-symbols-outlined size-10 flex items-center justify-center">arrow_back</button>
        <h2 className="flex-1 text-center text-lg font-bold">Leaderboard</h2>
        <div className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined">share</span>
        </div>
      </header>

      <div className="flex flex-col w-full max-w-lg mx-auto">
        <div className="px-4 py-6">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400">search</span>
            <input className="w-full pl-11 pr-4 py-3.5 bg-surface-dark border-none ring-1 ring-slate-700 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary transition-all" placeholder="Pesquisar jogador..." />
          </div>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-6 px-4 mb-8 h-48">
          {top3.length >= 2 && (
            <div className="flex flex-col items-center flex-1">
              <div className="relative mb-2">
                <div className="size-20 rounded-full border-2 border-slate-500 overflow-hidden">
                  <img src={top3[1].avatar_url} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface-dark-alt text-xs font-bold px-2 py-0.5 rounded-full border border-slate-600 flex items-center gap-1">
                  #{top3[1].rank}
                </div>
              </div>
              <p className="text-sm font-bold truncate max-w-[80px]">{top3[1].username}</p>
              <p className="text-xs text-primary font-bold">{top3[1].elo}</p>
            </div>
          )}

          {top3.length >= 1 && (
            <div className="flex flex-col items-center flex-1 pb-4">
              <div className="relative mb-4">
                <span className="material-symbols-outlined absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 text-5xl filled">crown</span>
                <div className="size-28 rounded-full border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)] overflow-hidden">
                  <img src={top3[0].avatar_url} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950 text-xs font-bold px-3 py-1 rounded-full">
                  #1
                </div>
              </div>
              <p className="text-base font-bold truncate max-w-[100px]">{top3[0].username}</p>
              <p className="text-sm text-yellow-400 font-bold">{top3[0].elo}</p>
            </div>
          )}

          {top3.length >= 3 && (
            <div className="flex flex-col items-center flex-1">
              <div className="relative mb-2">
                <div className="size-20 rounded-full border-2 border-orange-700/50 overflow-hidden">
                  <img src={top3[2].avatar_url} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface-dark-alt text-xs font-bold px-2 py-0.5 rounded-full border border-orange-800/30 flex items-center gap-1">
                  #{top3[2].rank}
                </div>
              </div>
              <p className="text-sm font-bold truncate max-w-[80px]">{top3[2].username}</p>
              <p className="text-xs text-primary font-bold">{top3[2].elo}</p>
            </div>
          )}
        </div>

        {/* Rest of players */}
        <div className="flex flex-col px-2 space-y-1 pb-4">
          <div className="flex items-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-gray-800">
            <div className="w-8 text-center">Rank</div>
            <div className="flex-1 pl-4">Jogador</div>
            <div className="w-24 text-right">ELO</div>
          </div>
          {rest.map(p => (
            <div key={p.id} className="group flex items-center p-3 rounded-xl bg-surface-dark hover:border-slate-700 transition-all cursor-pointer">
              <div className="w-8 text-center text-sm font-bold text-slate-500">{p.rank}</div>
              <div className="flex items-center flex-1 gap-3 pl-2 overflow-hidden">
                <img src={p.avatar_url} className="size-10 rounded-full object-cover" />
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold">{p.username}</span>
                  <span className="text-[10px] text-primary">Master II</span>
                </div>
              </div>
              <div className="flex flex-col items-end w-24">
                <span className="text-sm font-bold text-primary">{p.elo}</span>
                <span className="text-[10px] text-slate-500">72% Win Rate</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
