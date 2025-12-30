
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { GraduationCap, ArrowLeft, User, Mail, Lock, Phone, Loader2, AlertCircle } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [FullName, setFullName] = useState('');
  const [Email, setEmail] = useState('');
  const [PhoneValue, setPhoneValue] = useState('');
  const [PasswordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Regra 6: Impedir se Email estiver vazio
    if (!Email.trim()) {
      setError('O campo Email é obrigatório.');
      return;
    }

    // Regra 4: Se o campo senha estiver vazio, deve ser automaticamente substituído por "TEMP1234"
    let FinalPassword = PasswordInput;
    if (!FinalPassword.trim()) {
      FinalPassword = "TEMP1234";
    }

    // Regra 7: Bloquear envio de senha null no frontend
    if (FinalPassword === null || FinalPassword === undefined || FinalPassword === "") {
        setError('Erro crítico: A senha não pode ser nula.');
        return;
    }

    if (FinalPassword !== "TEMP1234" && FinalPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Tentar criar usuário no Auth do Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email: Email,
        password: FinalPassword
      });

      // Se o erro for que o usuário já existe no AUTH, tentamos apenas criar o Perfil caso falte
      if (authError) {
        if (authError.message.includes('already registered') || authError.status === 422) {
          // O usuário já existe no Auth, vamos ver se ele existe na tabela Profiles
          const { data: authLogin } = await supabase.auth.signInWithPassword({ email: Email, password: FinalPassword });
          if (authLogin.user) {
             const { data: profile } = await supabase.from('Profiles').select('id').eq('id', authLogin.user.id).maybeSingle();
             if (profile) {
                throw new Error("Esta conta já está totalmente configurada. Por favor, faça login.");
             }
             // Se não tem perfil, o código continuará para o insert abaixo usando o ID do authLogin
             await insertProfile(authLogin.user.id, FinalPassword);
             
             // Redirecionamento inteligente baseado no email admin
             if (Email.toLowerCase() === 'academiaalbert11@gmail.com') navigate('/admin');
             else navigate('/dashboard');
             return;
          }
        }
        throw authError;
      }

      if (data.user) {
        await insertProfile(data.user.id, FinalPassword);
        if (Email.toLowerCase() === 'academiaalbert11@gmail.com') navigate('/admin');
        else navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  const insertProfile = async (userId: string, pass: string) => {
    // Regra 1, 2, 5: INSERT na tabela "Profiles" com nomes capitalizados
    // Adição da regra de Admin para o email específico
    const { error: profileError } = await supabase.from("Profiles").insert([{
      id: userId,
      FullName: FullName,
      Email: Email,
      Phone: PhoneValue,
      Password: pass,
      Role: Email.toLowerCase() === 'academiaalbert11@gmail.com' ? "admin" : "user"
    }]);

    if (profileError) {
      if (profileError.message.includes('bigint')) {
        throw new Error("ERRO DE BANCO: A coluna 'id' na tabela 'Profiles' deve ser do tipo UUID. Vá ao Supabase e altere o tipo da coluna id de bigint para uuid.");
      }
      throw profileError;
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 animate-in fade-in duration-700">
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 space-y-8 animate-in slide-in-from-bottom-8 duration-500">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-blue-600 font-black hover:gap-3 transition-all uppercase text-xs tracking-widest">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 animate-float">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Criar Conta</h2>
          <p className="text-slate-500 mt-2 font-medium">Cadastre-se na Academia Albert</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Nome Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input type="text" required value={FullName} onChange={e => setFullName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-medium" placeholder="Nome Completo" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Email</label>
            <input type="email" required value={Email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-medium" placeholder="seu@email.com" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Telefone</label>
            <input type="tel" required value={PhoneValue} onChange={e => setPhoneValue(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-medium" placeholder="Ex: 840000000" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Senha (Opcional)</label>
            <input type="password" value={PasswordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-medium" placeholder="Vazio = TEMP1234" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Confirmar Senha</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-medium" placeholder="Repita a senha" />
          </div>

          <button type="submit" disabled={loading} className="md:col-span-2 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Registrar'}
          </button>
        </form>
        <p className="text-center text-slate-500 font-medium">Já tem conta? <Link to="/login" className="text-blue-600 font-black">Login</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;
