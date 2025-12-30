
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../supabaseClient';
import { 
  MessageCircle, Send, X, Bot, User, 
  MessageSquare, Mail, Phone, ExternalLink,
  Sparkles, Loader2, HeartHandshake
} from 'lucide-react';

const DoubtSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'selection' | 'ai' | 'professor'>('selection');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [professorContact, setProfessorContact] = useState<{whatsapp: string, email: string} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) fetchProfessorContact();
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const fetchProfessorContact = async () => {
    // Fix: Updated query to use capitalized 'Role' column as per database schema.
    const { data } = await supabase.from('Profiles').select('whatsapp, supportEmail').eq('Role', 'admin').limit(1).maybeSingle();
    if (data) setProfessorContact({ whatsapp: data.whatsapp || '', email: data.supportEmail || '' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: 'Você é o Tutor Virtual da Academia Albert. Seu nome é Albert AI. Seja amigável, encorajador e educativo. Responda em Português de Moçambique/Portugal. Se o aluno tiver dúvidas técnicas sobre o curso, explique pacientemente. Se for sobre pagamentos, peça para falar com o professor humano.',
        }
      });
      
      const text = response.text || 'Desculpe, tive um probleminha. Pode repetir?';
      setChatHistory(prev => [...prev, { role: 'bot', text }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Ops! Estou um pouco cansado agora. Tente falar com o professor ou volte mais tarde.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      {/* Botão Flutuante Animado */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full shadow-2xl shadow-blue-300 hover:scale-110 active:scale-95 transition-all animate-bounce-slow"
        >
          <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-25"></div>
          <span className="text-4xl filter drop-shadow-md group-hover:rotate-12 transition-transform">🤔</span>
          
          <div className="absolute right-full mr-6 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase tracking-widest translate-x-4 group-hover:translate-x-0">
            Dúvidas? Fale comigo!
          </div>
        </button>
      )}

      {/* Painel de Suporte */}
      {isOpen && (
        <div className="w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-500 max-h-[650px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                 {mode === 'ai' ? <Sparkles size={24}/> : <HeartHandshake size={24}/>}
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight">Academia Albert</h4>
                <p className="text-[10px] uppercase font-bold opacity-80 tracking-widest">Suporte Inteligente</p>
              </div>
            </div>
            <button onClick={() => {setIsOpen(false); setMode('selection');}} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
          </div>

          <div className="flex-grow overflow-y-auto p-8 bg-slate-50/50">
            {mode === 'selection' && (
              <div className="space-y-5 py-4 animate-in fade-in zoom-in duration-500">
                <h5 className="font-black text-slate-800 text-center text-xl mb-8 leading-tight">Olá! Como podemos te ajudar agora?</h5>
                
                <button 
                  onClick={() => setMode('ai')}
                  className="w-full p-6 bg-white border-2 border-slate-100 rounded-3xl text-left group hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50 transition-all"
                >
                   <div className="flex items-center gap-5">
                      <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Bot size={32}/></div>
                      <div>
                        <p className="font-black text-slate-900 text-lg">Albert AI (Gemini)</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Respostas Instantâneas</p>
                      </div>
                   </div>
                </button>

                <button 
                  onClick={() => setMode('professor')}
                  className="w-full p-6 bg-white border-2 border-slate-100 rounded-3xl text-left group hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50 transition-all"
                >
                   <div className="flex items-center gap-5">
                      <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><User size={32}/></div>
                      <div>
                        <p className="font-black text-slate-900 text-lg">Falar com o Professor</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Atendimento Humano</p>
                      </div>
                   </div>
                </button>
              </div>
            )}

            {mode === 'ai' && (
              <div className="flex flex-col h-full animate-in slide-in-from-right duration-500">
                 <div className="flex-grow space-y-5 mb-6">
                    <div className="flex items-start gap-3">
                       <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"><Bot size={18}/></div>
                       <div className="bg-white p-5 rounded-[1.5rem] rounded-tl-none text-sm font-medium text-slate-700 shadow-sm border border-slate-100 max-w-[85%]">
                         Olá! Sou o Albert AI. Em que posso ajudar nos teus estudos hoje? 🚀
                       </div>
                    </div>
                    {chatHistory.map((chat, idx) => (
                      <div key={idx} className={`flex items-start gap-3 ${chat.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-2 rounded-xl shadow-lg ${chat.role === 'user' ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-blue-600 text-white shadow-blue-100'}`}>
                          {chat.role === 'user' ? <User size={18}/> : <Bot size={18}/>}
                        </div>
                        <div className={`p-5 rounded-[1.5rem] text-sm font-medium shadow-sm border ${chat.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none border-blue-500 max-w-[85%]' : 'bg-white text-slate-700 rounded-tl-none border-slate-100 max-w-[85%]'}`}>
                          {chat.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-start gap-3 animate-pulse">
                         <div className="p-2 bg-blue-600 text-white rounded-xl"><Bot size={18}/></div>
                         <div className="bg-white p-5 rounded-[1.5rem] rounded-tl-none shadow-sm border border-slate-100">
                            <div className="flex gap-1">
                               <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                               <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                               <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-300"></div>
                            </div>
                         </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                 </div>
                 <form onSubmit={handleSendMessage} className="relative mt-auto pt-4 bg-white p-2 rounded-3xl shadow-lg border border-slate-100 focus-within:ring-2 ring-blue-500 transition-all">
                    <input 
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder="Escreva sua dúvida aqui..." 
                      className="w-full p-4 bg-transparent text-sm outline-none font-bold pr-16"
                    />
                    <button type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-90 transition-all shadow-lg shadow-blue-100 flex items-center justify-center">
                       <Send size={20}/>
                    </button>
                 </form>
                 <button onClick={() => setMode('selection')} className="text-center text-[10px] font-black text-slate-400 mt-6 uppercase hover:text-blue-600 transition-colors tracking-widest">Voltar para opções</button>
              </div>
            )}

            {mode === 'professor' && (
              <div className="py-6 space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                   <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-50/50">
                      <User size={48} className="text-blue-600"/>
                   </div>
                   <h5 className="font-black text-slate-900 text-2xl tracking-tight">Atendimento Direto</h5>
                   <p className="text-sm text-slate-500 mt-2 font-medium">O professor responderá assim que estiver online.</p>
                </div>

                <div className="space-y-4">
                   {professorContact?.whatsapp ? (
                     <a 
                      href={`https://wa.me/${professorContact.whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      className="flex items-center justify-between p-6 bg-green-50 border-2 border-green-100 rounded-[2rem] group hover:bg-green-600 hover:border-green-600 transition-all shadow-lg shadow-green-50"
                     >
                       <div className="flex items-center gap-5">
                          <div className="p-4 bg-white rounded-2xl text-green-600 group-hover:scale-110 transition-transform shadow-sm"><MessageSquare size={24}/></div>
                          <div className="group-hover:text-white transition-colors">
                            <p className="font-black text-green-900 group-hover:text-white text-lg">WhatsApp</p>
                            <p className="text-[10px] uppercase font-black opacity-60 tracking-wider">Resposta em poucas horas</p>
                          </div>
                       </div>
                       <ExternalLink size={20} className="text-green-300 group-hover:text-white transition-colors"/>
                     </a>
                   ) : (
                     <p className="text-center text-xs text-slate-400 py-6 italic font-bold">O professor ainda não configurou o WhatsApp.</p>
                   )}

                   {professorContact?.email ? (
                     <a 
                      href={`mailto:${professorContact.email}`}
                      className="flex items-center justify-between p-6 bg-blue-50 border-2 border-blue-100 rounded-[2rem] group hover:bg-blue-600 hover:border-blue-600 transition-all shadow-lg shadow-blue-50"
                     >
                       <div className="flex items-center gap-5">
                          <div className="p-4 bg-white rounded-2xl text-blue-600 group-hover:scale-110 transition-transform shadow-sm"><Mail size={24}/></div>
                          <div className="group-hover:text-white transition-colors">
                            <p className="font-black text-blue-900 group-hover:text-white text-lg">E-mail Suporte</p>
                            <p className="text-[10px] uppercase font-black opacity-60 tracking-wider">Dúvidas administrativas</p>
                          </div>
                       </div>
                       <ExternalLink size={20} className="text-blue-300 group-hover:text-white transition-colors"/>
                     </a>
                   ) : (
                     <p className="text-center text-xs text-slate-400 py-6 italic font-bold">O professor ainda não configurou o e-mail.</p>
                   )}
                </div>
                <button onClick={() => setMode('selection')} className="w-full text-center text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 transition-colors tracking-widest mt-4">Cancelar e voltar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoubtSupport;
