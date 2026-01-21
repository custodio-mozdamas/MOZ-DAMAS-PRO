
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Verifique seu e-mail para confirmar o cadastro!');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col px-6 py-8 min-h-screen animate-in fade-in duration-500">
      <header className="flex flex-col items-center gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="size-10 text-accent-green">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Damas Pro</h1>
        </div>
        
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-slate-800 shadow-2xl group">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=2000&auto=format&fit=crop")' }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-transparent to-transparent"></div>
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Ambiente Realtime</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleAuth} className="bg-navy-card rounded-3xl shadow-2xl border border-slate-800 p-6 flex flex-col gap-6">
        <div className="flex border-b border-slate-800">
          <button 
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 flex flex-col items-center justify-center pb-3 transition-all ${tab === 'login' ? 'border-b-2 border-accent-green text-accent-green' : 'text-slate-500'}`}
          >
            <span className="text-sm font-bold tracking-wide">Entrar</span>
          </button>
          <button 
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 flex flex-col items-center justify-center pb-3 transition-all ${tab === 'register' ? 'border-b-2 border-accent-green text-accent-green' : 'text-slate-500'}`}
          >
            <span className="text-sm font-bold tracking-wide">Cadastrar</span>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail</span>
              <input 
                required
                className="w-full rounded-2xl bg-slate-900 border-slate-700 focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 h-14 px-4 text-base transition-all outline-none text-white" 
                placeholder="seu@email.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center ml-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha</span>
                <a className="text-xs font-bold text-accent-green hover:underline" href="#">Esqueceu?</a>
              </div>
              <div className="relative">
                <input 
                  required
                  className="w-full rounded-2xl bg-slate-900 border-slate-700 focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 h-14 px-4 text-base transition-all outline-none text-white" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </label>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-accent-green text-white font-black text-base shadow-lg shadow-accent-green/20 hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'PROCESSANDO...' : tab === 'login' ? 'ENTRAR NA ARENA' : 'CRIAR CONTA'}
          </button>
        </div>
      </form>

      <footer className="mt-auto pt-10 pb-6 flex flex-col items-center gap-6">
        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">© 2024 Damas Pro • Integrado com Supabase</p>
      </footer>
    </div>
  );
};

export default LoginView;
