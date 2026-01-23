
import React, { useState, useRef } from 'react';
import { PlayerProfile } from '../types';
import { authService } from '../services/supabase';

interface ProfileViewProps {
  user: PlayerProfile;
  onBack: () => void;
  onUpdate: (user: PlayerProfile) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const updated = await authService.updateUser({ username, avatar_url: avatar });
    onUpdate(updated);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (confirm("Deseja realmente sair da conta?")) {
      await authService.logout();
      window.location.reload();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark pb-24">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-background-dark border-b border-gray-800">
        <button onClick={onBack} className="material-symbols-outlined size-10 flex items-center justify-center">arrow_back</button>
        <h2 className="text-lg font-bold">Perfil</h2>
        <div className="flex gap-1">
          <button onClick={() => setIsEditing(!isEditing)} className="material-symbols-outlined size-10 flex items-center justify-center">
            {isEditing ? 'close' : 'settings'}
          </button>
          <button onClick={handleLogout} className="material-symbols-outlined size-10 flex items-center justify-center text-red-500">logout</button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <section className="flex flex-col items-center pt-6 pb-6">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full border-4 border-surface-dark overflow-hidden shadow-xl bg-slate-800">
              <img src={avatar} className="w-full h-full object-cover" alt="Profile" />
            </div>
            {isEditing && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-4 border-background-dark hover:scale-110 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px] text-white">photo_camera</span>
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          {isEditing ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-center text-xl font-bold focus:ring-2 focus:ring-primary outline-none"
                placeholder="Nome de utilizador"
              />
              <button 
                onClick={handleSave}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                Guardar Alterações
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Mestre Moçambicano</span>
              </div>
            </>
          )}
        </section>

        <div className="bg-surface-dark rounded-2xl p-6 mb-6 border border-gray-800 flex justify-between items-end">
          <div>
            <p className="text-xs text-text-secondary mb-1 font-bold uppercase tracking-wider">Pontuação ELO</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-primary">{user.elo}</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="material-symbols-outlined text-yellow-500 filled mb-1">trophy</span>
            <p className="text-[10px] text-text-secondary font-bold uppercase">Moz Ranking</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-8">
          <div className="bg-surface-dark p-4 rounded-2xl border border-gray-800 text-center">
            <span className="block text-xl font-black text-green-500">{user.wins}</span>
            <span className="text-[8px] text-text-secondary uppercase font-bold mt-1 block">Vitórias</span>
          </div>
          <div className="bg-surface-dark p-4 rounded-2xl border border-gray-800 text-center">
            <span className="block text-xl font-black text-red-500">{user.losses}</span>
            <span className="text-[8px] text-text-secondary uppercase font-bold mt-1 block">Derrotas</span>
          </div>
          <div className="bg-surface-dark p-4 rounded-2xl border border-gray-800 text-center">
            <span className="block text-xl font-black text-gray-400">{user.draws}</span>
            <span className="text-[8px] text-text-secondary uppercase font-bold mt-1 block">Empates</span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold mb-4">Configurações Avançadas</h3>
          <button className="w-full p-4 rounded-xl bg-surface-dark border border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-text-secondary">notifications</span>
                <span className="text-sm font-medium">Notificações</span>
             </div>
             <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
          </button>
          <button onClick={handleLogout} className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-red-500">
             <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">logout</span>
                <span className="text-sm font-bold">Terminar Sessão</span>
             </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProfileView;
