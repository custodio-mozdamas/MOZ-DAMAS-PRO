
import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileViewProps {
  userId: string;
  userName: string;
  setUserName: (name: string) => void;
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ userId, userName, setUserName, userAvatar, setUserAvatar, onLogout }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updating, setUpdating] = useState(false);

  const saveProfile = async (newUsername: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', userId);
    
    if (error) alert(error.message);
    setUpdating(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUpdating(true);
    // Para simplificar sem configurar buckets de storage agora,
    // vamos usar FileReader para visualização local, 
    // mas em produção você faria supabase.storage.from('avatars').upload(...)
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUserAvatar(base64);
      
      await supabase
        .from('profiles')
        .update({ avatar_url: base64 })
        .eq('id', userId);
        
      setUpdating(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in duration-300">
      <div className="relative group">
        <div className={`size-32 rounded-full border-4 border-accent-green mb-4 overflow-hidden shadow-xl shadow-accent-green/20 ${updating ? 'opacity-50' : ''}`}>
           <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-4 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">photo_camera</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handlePhotoUpload} 
        />
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col gap-1 text-left">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Seu Nome de Atleta</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              className="flex-1 bg-slate-900 border-slate-800 rounded-xl px-4 py-3 text-lg font-bold text-white focus:ring-primary focus:border-primary outline-none transition-all"
            />
            <button 
              onClick={() => saveProfile(userName)}
              disabled={updating}
              className="bg-primary px-4 rounded-xl text-white font-bold disabled:opacity-50"
            >
              SALVAR
            </button>
          </div>
        </div>
        
        <p className="text-slate-400 text-sm">Grandmaster • Nível 1</p>

        <div className="bg-card-dark rounded-2xl p-6 border border-slate-800 shadow-xl">
           <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400">Elo Atual</span>
              <span className="text-primary font-black text-xl">1200</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-slate-400">Status da Conta</span>
              <span className="text-accent-green font-bold">Ativa</span>
           </div>
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="mt-12 text-red-500 font-bold hover:underline flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">logout</span>
        Sair da Conta
      </button>
    </div>
  );
};

export default ProfileView;
