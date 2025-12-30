
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { GraduationCap, ArrowLeft, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email e Senha são obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      // 1. Autenticar no Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email, 
        password: password 
      });
      
      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error("Credenciais inválidas. Verifique seu email e senha.");
        }
        throw authError;
      }

      if (!data.user) throw new Error("Usuário não autenticado.");

      // 2. Buscar perfil na tabela Profiles usando colunas capitalizadas
      const { data: profile, error: profileError } = await supabase
        .from('Profiles')
        .select('Role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        if (profileError.message.includes('bigint')) {
          throw new Error("ERRO TÉCNICO: A coluna 'id' na tabela 'Profiles' está como BIGINT. Você precisa ir ao painel do Supabase, clicar na tabela Profiles e alterar o tipo da coluna id de 'int8/bigint' para 'uuid'.");
        }
        throw profileError;
      }

      // Lógica de Redirecionamento com prioridade para o email admin
      if (email.toLowerCase() === 'academiaalbert11@gmail.com') {
        navigate('/admin');
      } else if (profile && profile.Role === 'admin') {
        navigate('/admin');
      } else if (profile) {
        navigate('/dashboard');
      } else {
        throw new Error("Perfil não localizado. Tente registrar-se novamente.");
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 animate-in fade-in duration-700">
      <div className="max-w-md w-full glass-card rounded-[2.5rem] shadow-2xl p-10 space-y-8 border-white/50 animate-in slide-in-from-bottom-8 duration-500">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-blue-600 font-black hover:gap-3 transition-all uppercase text-xs tracking-widest">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-lg shadow-blue-200 animate-float">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Login</h2>
          <p className="text-slate-500 mt-2 font-medium">Bem-vindo à Academia Albert</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-medium" placeholder="seu@email.com" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-medium" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-slate-500 font-medium">Novo por aqui? <Link to="/register" className="text-blue-600 font-black">Registrar</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
