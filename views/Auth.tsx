
import React, { useState } from 'react';
import { UserProfile } from '../types.ts';
import { supabase, isAuthError, getProfile } from '../lib/supabase.ts';
import { LogIn, UserPlus, Lock, Mail, User, AlertCircle, RefreshCw, Trophy, ShieldAlert, Zap, Info } from 'lucide-react';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  const handleQuickStart = () => {
    onLogin({
      id: 'local-' + Math.random().toString(36).substr(2, 5),
      username: formData.username || 'Jogador_' + Math.floor(Math.random() * 1000),
      email: 'local@damas.pro',
      elo: 1200,
      wins: 0,
      losses: 0,
      subscriptionStatus: 'active',
      history: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const { data: authData, error: authError } = isLogin 
        ? await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password })
        : await supabase.auth.signUp({ 
            email: formData.email, 
            password: formData.password, 
            options: { data: { username: formData.username } } 
          });
      
      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('E-mail não confirmado. Verifique sua caixa de entrada ou desative "Confirm Email" no painel do Supabase.');
          setLoading(false);
          return;
        }
        throw authError;
      }

      if (!isLogin && authData.user && authData.session === null) {
        setInfo('Conta criada! Verifique seu e-mail para confirmar o cadastro e poder fazer login.');
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Buscar perfil real do banco de dados
        const { data: profile } = await getProfile(authData.user.id);
        
        onLogin({
          id: authData.user.id,
          email: authData.user.email || '',
          username: profile?.username || authData.user.user_metadata?.username || formData.username || 'Jogador',
          elo: profile?.elo || 1200,
          wins: profile?.wins || 0,
          losses: profile?.losses || 0,
          subscriptionStatus: profile?.subscription_status || 'active',
          history: []
        });
      }
    } catch (err: any) {
      if (isAuthError(err)) {
        console.warn("Usando modo de demonstração devido a erro de chave API.");
        handleQuickStart();
      } else {
        setError(err.message || 'Erro na autenticação. Verifique suas credenciais.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 shadow-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-xl mb-6">
            <Trophy className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Moz <span className="text-blue-500">Damas</span></h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Elite Checkers Online</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-bold flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" /> 
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 text-[10px] font-bold flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0" /> 
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <input type="text" placeholder="Apelido de Mestre" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input type="email" placeholder="E-mail" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input type="password" placeholder="Senha" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl transition-all uppercase italic tracking-widest text-sm shadow-lg active:scale-95 disabled:opacity-50">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? 'Entrar na Arena' : 'Confirmar Cadastro')}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-4">
          <button onClick={handleQuickStart} className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold py-4 rounded-2xl border border-white/5 transition-all text-[10px] uppercase flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Testar sem Conta (Modo Convidado)
          </button>
          
          <button onClick={() => { setIsLogin(!isLogin); setError(null); setInfo(null); }} className="text-slate-500 text-[10px] font-bold uppercase hover:text-white transition-colors">
            {isLogin ? 'Não tem conta? Registre-se agora' : 'Já é um mestre? Faça Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
