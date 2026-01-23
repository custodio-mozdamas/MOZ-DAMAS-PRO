
import React, { useState, useEffect } from 'react';
import { View, PlayerProfile } from './types';
import { authService } from './services/supabase';
import Dashboard from './views/Dashboard';
import GameRoom from './views/GameRoom';
import Leaderboard from './views/Leaderboard';
import Auth from './views/Auth';
import Tournaments from './views/Tournaments';
import ProfileView from './views/Profile';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [user, setUser] = useState<PlayerProfile | null>(null);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setCurrentView(View.HOME);
        } else {
          setCurrentView(View.LOGIN);
        }
      } catch (err) {
        setCurrentView(View.LOGIN);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  const navigateTo = (view: View, gameId?: string) => {
    if (gameId) setActiveGameId(gameId);
    setCurrentView(view);
  };

  const handleUpdateUser = (updatedUser: PlayerProfile) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center">
        <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-primary font-black tracking-widest animate-pulse">MOZ DAMAS PRO</p>
      </div>
    );
  }

  // Se não houver usuário, obriga a ficar na tela de Auth (Login/Register)
  if (!user) {
    return (
      <Auth 
        onAuthSuccess={(u) => { 
          setUser(u); 
          setCurrentView(View.HOME); 
        }} 
        isRegister={currentView === View.REGISTER}
        onToggleMode={() => setCurrentView(currentView === View.REGISTER ? View.LOGIN : View.REGISTER)}
      />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case View.HOME:
        return <Dashboard user={user} onPlay={(id) => navigateTo(View.GAME, id)} />;
      case View.GAME:
        return <GameRoom user={user} roomId={activeGameId || ''} onBack={() => setCurrentView(View.HOME)} />;
      case View.RANKING:
        return <Leaderboard onBack={() => setCurrentView(View.HOME)} />;
      case View.TOURNEYS:
        return <Tournaments onBack={() => setCurrentView(View.HOME)} />;
      case View.PROFILE:
        return <ProfileView user={user} onBack={() => setCurrentView(View.HOME)} onUpdate={handleUpdateUser} />;
      default:
        return <Dashboard user={user} onPlay={(id) => navigateTo(View.GAME, id)} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark overflow-x-hidden">
      {renderView()}

      {/* Bottom Navigation */}
      {currentView !== View.GAME && (
        <nav className="fixed bottom-0 w-full bg-surface-dark border-t border-gray-800 px-6 pb-6 pt-3 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
          <button 
            onClick={() => setCurrentView(View.HOME)}
            className={`flex flex-col items-center gap-1 group transition-colors ${currentView === View.HOME ? 'text-primary' : 'text-text-secondary'}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentView === View.HOME ? 'filled' : ''}`}>home</span>
            <span className="text-[10px] font-bold uppercase">Início</span>
          </button>
          <button 
            onClick={() => setCurrentView(View.TOURNEYS)}
            className={`flex flex-col items-center gap-1 group transition-colors ${currentView === View.TOURNEYS ? 'text-primary' : 'text-text-secondary'}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentView === View.TOURNEYS ? 'filled' : ''}`}>emoji_events</span>
            <span className="text-[10px] font-bold uppercase">Torneios</span>
          </button>
          <button 
            onClick={() => setCurrentView(View.RANKING)}
            className={`flex flex-col items-center gap-1 group transition-colors ${currentView === View.RANKING ? 'text-primary' : 'text-text-secondary'}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentView === View.RANKING ? 'filled' : ''}`}>leaderboard</span>
            <span className="text-[10px] font-bold uppercase">Ranking</span>
          </button>
          <button 
            onClick={() => setCurrentView(View.PROFILE)}
            className={`flex flex-col items-center gap-1 group transition-colors ${currentView === View.PROFILE ? 'text-primary' : 'text-text-secondary'}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentView === View.PROFILE ? 'filled' : ''}`}>person</span>
            <span className="text-[10px] font-bold uppercase">Perfil</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
