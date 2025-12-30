
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Course, Profile, Payment, Module, Lesson } from '../types';
import { useAuth } from '../App';
import { 
  Users, BookOpen, DollarSign, Plus, 
  Trash2, X, Loader2, Save, 
  ShieldCheck, FileText, UserCheck, ChevronRight,
  ListOrdered, GraduationCap, TrendingUp,
  HelpCircle, Video, Type
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'courses'>('stats');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States para Cursos e Hierarquia
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<(Module & { lessons: Lesson[] })[]>([]);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  // Form States
  const [newCourse, setNewCourse] = useState({ 
    title: '', 
    description: '', 
    category: '', 
    price: 0, 
    bannerUrl: '', 
    isFree: false 
  });
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({
    title: '', content_type: 'video', video_url: '', pdf_url: '', content_text: '', quiz_data: []
  });

  useEffect(() => {
    fetchBaseData();
  }, []);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, payRes] = await Promise.all([
        supabase.from('Profiles').select('*').order('FullName'),
        supabase.from('Courses').select('*').order('created_at', { ascending: false }),
        supabase.from('Payments').select('*')
      ]);
      if (pRes.data) setProfiles(pRes.data);
      if (cRes.data) setCourses(cRes.data);
      if (payRes.data) setPayments(payRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Iniciando criação de curso:", newCourse);
    
    try {
      if (!newCourse.title || !newCourse.bannerUrl) {
        throw new Error("Título e Banner são obrigatórios.");
      }

      // IMPORTANTE: Garantir que os nomes das propriedades batam com as colunas do banco
      const payload = {
        title: newCourse.title,
        description: newCourse.description,
        category: newCourse.category,
        price: Number(newCourse.price),
        bannerUrl: newCourse.bannerUrl,
        isFree: newCourse.isFree
      };

      const { data, error } = await supabase
        .from('Courses')
        .insert([payload])
        .select();

      if (error) {
        console.error("Erro retornado pelo Supabase:", error);
        throw error;
      }

      console.log("Curso criado com sucesso:", data);
      setIsCourseModalOpen(false);
      setNewCourse({ title: '', description: '', category: '', price: 0, bannerUrl: '', isFree: false });
      fetchBaseData();
      alert("Curso publicado com sucesso!");
    } catch (err: any) {
      console.error("Erro detalhado:", err);
      alert("Falha ao salvar: " + (err.message || "Erro desconhecido. Verifique o console (F12)"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const manageCourseContent = async (course: Course) => {
    setSelectedCourse(course);
    const { data: mods } = await supabase
      .from('Modules')
      .select('*')
      .eq('course_id', course.id)
      .order('order_index');
    
    if (mods) {
      const modsWithLessons = await Promise.all(mods.map(async m => {
        const { data: less } = await supabase
          .from('Lessons')
          .select('*')
          .eq('module_id', m.id)
          .order('order_index');
        return { ...m, lessons: less || [] };
      }));
      setModules(modsWithLessons);
    }
  };

  const addModule = async () => {
    if (!selectedCourse || !newModuleTitle) return;
    const { error } = await supabase.from('Modules').insert([{
      course_id: selectedCourse.id,
      title: newModuleTitle,
      order_index: modules.length + 1
    }]);
    
    if (error) {
      alert("Erro ao criar módulo: " + error.message);
    } else {
      setNewModuleTitle('');
      setIsModuleModalOpen(false);
      manageCourseContent(selectedCourse);
    }
  };

  const addLesson = async () => {
    if (!selectedModuleId || !selectedCourse) return;
    const { error } = await supabase.from('Lessons').insert([{
      ...newLesson,
      module_id: selectedModuleId,
      order_index: modules.find(m => m.id === selectedModuleId)?.lessons.length || 0
    }]);

    if (error) {
      alert("Erro ao adicionar aula: " + error.message);
    } else {
      setIsLessonModalOpen(false);
      setNewLesson({ title: '', content_type: 'video', video_url: '', pdf_url: '', content_text: '', quiz_data: [] });
      manageCourseContent(selectedCourse);
    }
  };

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <ShieldCheck className="text-blue-600" size={40}/> Academia <span className="text-blue-600">Admin</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Gestão estratégica da plataforma</p>
        </div>
        <button 
          onClick={() => setIsCourseModalOpen(true)} 
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Criar Novo Curso
        </button>
      </div>

      <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
        {[
          { id: 'stats', label: 'Dashboard', icon: TrendingUp },
          { id: 'courses', label: 'Cursos & Grade', icon: GraduationCap },
          { id: 'users', label: 'Alunos', icon: Users },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSelectedCourse(null); }}
            className={`px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
          >
            <tab.icon size={20}/> {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48}/>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando...</p>
        </div>
      ) : (
        <>
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <StatCard label="Receita Bruta" value={`${totalRevenue.toLocaleString()} MT`} icon={<DollarSign/>} color="text-green-600" />
               <StatCard label="Estudantes" value={profiles.length.toString()} icon={<Users/>} color="text-blue-600" />
               <StatCard label="Cursos" value={courses.length.toString()} icon={<BookOpen/>} color="text-purple-600" />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-8 text-xs font-black uppercase text-slate-400">Nome</th>
                      <th className="p-8 text-xs font-black uppercase text-slate-400">Cargo</th>
                      <th className="p-8 text-xs font-black uppercase text-slate-400 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {profiles.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-8 font-black text-slate-900">{p.FullName}</td>
                        <td className="p-8">
                           <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${p.Role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{p.Role}</span>
                        </td>
                        <td className="p-8 text-right space-x-2">
                           <button onClick={() => supabase.from('Profiles').update({ Role: 'admin' }).eq('id', p.id).then(fetchBaseData)} className="p-3 hover:bg-purple-50 rounded-2xl text-purple-400"><ShieldCheck size={20}/></button>
                           <button onClick={() => supabase.from('Profiles').update({ Role: 'student' }).eq('id', p.id).then(fetchBaseData)} className="p-3 hover:bg-blue-50 rounded-2xl text-blue-400"><UserCheck size={20}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-8">
               {!selectedCourse ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {courses.map(c => (
                     <div key={c.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group">
                        <img src={c.bannerUrl} className="w-full aspect-video object-cover rounded-3xl mb-6 shadow-md" />
                        <h3 className="font-black text-2xl text-slate-900 mb-6">{c.title}</h3>
                        <button onClick={() => manageCourseContent(c)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg">
                          <ListOrdered size={20}/> GERENCIAR GRADE
                        </button>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="bg-white p-12 rounded-[3.5rem] border shadow-xl animate-in slide-in-from-right duration-500">
                    <div className="flex justify-between items-center mb-12">
                       <button onClick={() => setSelectedCourse(null)} className="text-slate-400 font-black flex items-center gap-2 hover:text-blue-600 transition-all uppercase text-xs">
                         <ChevronRight className="rotate-180"/> Voltar
                       </button>
                       <h2 className="text-3xl font-black text-slate-900">{selectedCourse.title}</h2>
                       <button onClick={() => setIsModuleModalOpen(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-lg">
                         + Novo Módulo
                       </button>
                    </div>
                    {/* Lista de Módulos */}
                    <div className="space-y-8">
                       {modules.map((m, idx) => (
                         <div key={m.id} className="border border-slate-100 rounded-[2.5rem] overflow-hidden bg-slate-50/30">
                            <div className="p-8 flex justify-between items-center bg-white border-b">
                               <div className="flex items-center gap-5">
                                  <span className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black">{idx + 1}</span>
                                  <h4 className="font-black text-xl text-slate-800">{m.title}</h4>
                               </div>
                               <button onClick={() => { setSelectedModuleId(m.id); setIsLessonModalOpen(true); }} className="text-blue-600 font-black text-xs uppercase bg-blue-50 px-6 py-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                                 + AULA
                               </button>
                            </div>
                            <div className="p-6 space-y-3">
                               {m.lessons.map(lesson => (
                                 <div key={lesson.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-5">
                                       {lesson.content_type === 'video' ? <Video className="text-blue-400" size={20}/> : <FileText className="text-red-400" size={20}/>}
                                       <span className="font-black text-slate-700">{lesson.title}</span>
                                    </div>
                                    <button onClick={async () => {
                                      await supabase.from('Lessons').delete().eq('id', lesson.id);
                                      manageCourseContent(selectedCourse);
                                    }} className="text-slate-300 hover:text-red-500 transition-colors">
                                      <Trash2 size={18}/>
                                    </button>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}
        </>
      )}

      {/* MODAL: CRIAR CURSO */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleCreateCourse} className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100">
              <button type="button" onClick={() => setIsCourseModalOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-red-500 transition-colors"><X size={28}/></button>
              <h2 className="text-4xl font-black text-slate-900 mb-10">Novo Curso</h2>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Título do Curso</label>
                    <input required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-[1.5rem] outline-none transition-all font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Descrição</label>
                    <textarea required value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-[1.5rem] outline-none min-h-[120px]" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Preço (MT)</label>
                       <input type="number" required value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: Number(e.target.value)})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Categoria</label>
                       <input required value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3">URL do Banner</label>
                    <input required value={newCourse.bannerUrl} onChange={e => setNewCourse({...newCourse, bannerUrl: e.target.value})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent" placeholder="https://..." />
                 </div>
                 <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-[1.5rem] border border-blue-100">
                    <input type="checkbox" checked={newCourse.isFree} onChange={e => setNewCourse({...newCourse, isFree: e.target.checked})} className="w-6 h-6 accent-blue-600" />
                    <span className="font-black text-blue-900 text-sm">Curso Gratuito</span>
                 </div>
                 <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl mt-6 disabled:opacity-50 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                 >
                   {isSubmitting ? <Loader2 className="animate-spin"/> : <><Save size={24}/> PUBLICAR CURSO</>}
                 </button>
              </div>
           </form>
        </div>
      )}

      {/* MODAL: NOVO MÓDULO */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
           <div className="bg-white p-12 rounded-[3rem] w-full max-w-sm shadow-2xl border border-slate-100">
              <h3 className="font-black text-3xl text-slate-900 mb-8">Novo Módulo</h3>
              <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} className="w-full p-5 border-2 rounded-2xl mb-8 font-black outline-none" placeholder="Ex: Módulo 01" />
              <div className="flex gap-4">
                 <button onClick={() => setIsModuleModalOpen(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black">CANCELAR</button>
                 <button onClick={addModule} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">SALVAR</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: NOVA LIÇÃO */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg z-[400] flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl my-8 relative">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black text-slate-900">Configurar Aula</h2>
                 <button onClick={() => setIsLessonModalOpen(false)} className="text-slate-300 hover:text-red-500"><X size={28}/></button>
              </div>
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Título</label>
                    <input value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none" />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Tipo</label>
                    <div className="grid grid-cols-4 gap-3">
                       {(['video', 'text', 'pdf', 'quiz'] as const).map(type => (
                         <button 
                          key={type}
                          type="button"
                          onClick={() => setNewLesson({...newLesson, content_type: type})}
                          className={`p-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all flex flex-col items-center gap-2 ${newLesson.content_type === type ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 text-slate-400 bg-slate-50'}`}
                         >
                           {type === 'video' && <Video size={20}/>}
                           {type === 'pdf' && <FileText size={20}/>}
                           {type === 'text' && <Type size={20}/>}
                           {type === 'quiz' && <HelpCircle size={20}/>}
                           {type}
                         </button>
                       ))}
                    </div>
                 </div>
                 {newLesson.content_type === 'video' && (
                   <input value={newLesson.video_url} onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl" placeholder="Link do vídeo..." />
                 )}
                 {newLesson.content_type === 'pdf' && (
                   <input value={newLesson.pdf_url} onChange={e => setNewLesson({...newLesson, pdf_url: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl" placeholder="Link do PDF..." />
                 )}
                 <button onClick={addLesson} className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-3">
                   <Save size={24}/> FINALIZAR AULA
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string, icon: any, color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-center gap-8 group">
    <div className={`p-6 bg-slate-50 rounded-[2rem] ${color} group-hover:scale-110 transition-all duration-500`}>{icon}</div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  </div>
);

export default AdminPanel;
