
import React, { useState, useEffect } from 'react';
import { authService } from '../services/supabase';
import { PlayerProfile } from '../types';

interface AuthProps {
  onAuthSuccess: (user: PlayerProfile) => void;
  isRegister: boolean;
  onToggleMode: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, isRegister, onToggleMode }) => {
  const [formData, setFormData] = useState({ email: '', username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Limpar erro ao mudar de modo
  useEffect(() => {
    setError('');
  }, [isRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        if (formData.password !== formData.confirm) {
          setError('As senhas não coincidem');
          setIsSubmitting(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          setIsSubmitting(false);
          return;
        }
        const u = await authService.register(formData);
        onAuthSuccess(u);
      } else {
        const u = await authService.login(formData.email, formData.password);
        onAuthSuccess(u);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-dark">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="mx-auto size-20 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 mb-6 transform -rotate-6">
            <span className="material-symbols-outlined text-white text-5xl filled">grid_view</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">MOZ DAMAS PRO</h1>
          <p className="mt-2 text-text-secondary font-medium italic">O palco da elite moçambicana</p>
        </div>

        <div className="bg-surface-dark p-8 rounded-3xl border border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl text-center animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {isRegister && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-text-secondary ml-1">Nome de Utilizador</label>
                  <input
                    required
                    className="w-full px-5 py-4 bg-background-dark/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-white/20"
                    placeholder="Ex: MozKing_88"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-text-secondary ml-1">E-mail</label>
                <input
                  required
                  type="email"
                  className="w-full px-5 py-4 bg-background-dark/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-white/20"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-text-secondary ml-1">Palavra-passe</label>
                <input
                  required
                  type="password"
                  className="w-full px-5 py-4 bg-background-dark/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-white/20"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              {isRegister && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-text-secondary ml-1">Confirmar Palavra-passe</label>
                  <input
                    required
                    type="password"
                    className="w-full px-5 py-4 bg-background-dark/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-white/20"
                    placeholder="••••••••"
                    value={formData.confirm}
                    onChange={e => setFormData({ ...formData, confirm: e.target.value })}
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="group relative w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden"
            >
              {isSubmitting ? (
                <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
              ) : (
                <span className="relative z-10">{isRegister ? 'CRIAR MINHA CONTA' : 'ENTRAR NO JOGO'}</span>
              )}
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={onToggleMode}
              className="text-text-secondary text-sm font-bold hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {isRegister ? (
                <>Já é mestre? <span className="text-primary underline">Fazer Login</span></>
              ) : (
                <>Novo por aqui? <span className="text-primary underline">Criar Conta</span></>
              )}
            </button>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-text-secondary uppercase font-bold tracking-widest opacity-50">
          Versão Pro • Moçambique 2024
        </p>
      </div>
    </div>
  );
};

export default Auth;
