
import React from 'react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onCreateRoom: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView, onCreateRoom }) => {
  const navItems = [
    { id: ViewState.LOBBY, label: 'Jogar', icon: 'sports_esports' },
    { id: ViewState.RANKING, label: 'Ranking', icon: 'emoji_events' },
    { id: ViewState.PROFILE, label: 'Perfil', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card-dark/95 backdrop-blur-xl border-t border-slate-800 px-8 py-4 flex items-center justify-between z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            currentView === item.id ? 'text-primary scale-110' : 'text-slate-500 hover:text-white'
          }`}
        >
          <span className={`material-symbols-outlined ${currentView === item.id ? 'fill-1' : ''}`}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
         <button 
           onClick={onCreateRoom}
           className="size-14 bg-accent-green rounded-full shadow-2xl shadow-accent-green/40 flex items-center justify-center text-white active:scale-90 transition-transform border-4 border-background-dark"
           title="Criar Nova Sala"
         >
           <span className="material-symbols-outlined text-3xl font-bold">add</span>
         </button>
      </div>
    </nav>
  );
};

export default BottomNav;
