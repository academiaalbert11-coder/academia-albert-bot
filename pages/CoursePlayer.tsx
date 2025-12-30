
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Course, Module, Lesson } from '../types';
import { 
  ChevronLeft, PlayCircle, BookOpen, MessageSquare, 
  CheckCircle, ShieldAlert, FileDown, Info, 
  ChevronDown, Youtube, Play, FileText, HelpCircle,
  Trophy, AlertTriangle, Lock
} from 'lucide-react';
import DoubtSupport from '../components/DoubtSupport';

const CoursePlayer: React.FC = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<(Module & { lessons: Lesson[] })[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
  // Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    const { data: courseData } = await supabase.from('Courses').select('*').eq('id', id).single();
    if (courseData) {
      setCourse(courseData);
      const { data: moduleData } = await supabase.from('Modules').select('*').eq('course_id', id).order('order_index');
      if (moduleData) {
        const modulesWithLessons = await Promise.all(moduleData.map(async (m) => {
          const { data: lessons } = await supabase.from('Lessons').select('*').eq('module_id', m.id).order('order_index');
          return { ...m, lessons: lessons || [] };
        }));
        setModules(modulesWithLessons);
        if (modulesWithLessons[0]?.lessons[0]) {
          setCurrentLesson(modulesWithLessons[0].lessons[0]);
          setExpandedModules([modulesWithLessons[0].id]);
        }
      }
    }
    setLoading(false);
  };

  const toggleModule = (id: string) => {
    setExpandedModules(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const startQuiz = () => {
    setQuizStep(0);
    setQuizScore(0);
    setIsQuizFinished(false);
    setSelectedAnswer(null);
  };

  const handleQuizAnswer = () => {
    if (selectedAnswer === null || !currentLesson?.quiz_data) return;
    
    if (selectedAnswer === currentLesson.quiz_data[quizStep].correct_index) {
      setQuizScore(prev => prev + 1);
    }

    if (quizStep + 1 < currentLesson.quiz_data.length) {
      setQuizStep(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsQuizFinished(true);
    }
  };

  useEffect(() => {
    const handleContext = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContext);
    return () => document.removeEventListener('contextmenu', handleContext);
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-blue-600"/></div>;
  if (!course) return <div className="p-20 text-center font-bold">Curso não localizado.</div>;

  const renderContent = () => {
    if (!currentLesson) return <div className="bg-gray-100 aspect-video rounded-3xl flex items-center justify-center font-bold text-gray-400">Escolha uma aula ao lado.</div>;

    switch (currentLesson.content_type) {
      case 'video':
        const isYT = currentLesson.video_url?.includes('youtube.com') || currentLesson.video_url?.includes('youtu.be');
        return (
          <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-gray-900">
            {isYT ? (
              <iframe 
                src={`https://www.youtube.com/embed/${currentLesson.video_url?.split('v=')[1]?.split('&')[0]}?modestbranding=1&rel=0`} 
                className="w-full h-full" 
                allowFullScreen 
              />
            ) : (
              <video 
                controls 
                controlsList="nodownload" 
                disablePictureInPicture
                className="w-full h-full"
                src={currentLesson.video_url} 
                onContextMenu={e => e.preventDefault()}
              />
            )}
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] text-white/70 font-black flex items-center gap-2 pointer-events-none border border-white/10 uppercase tracking-widest">
              <ShieldAlert size={12}/> Conteúdo Protegido pela Academia Albert
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="bg-white p-12 rounded-[3rem] border shadow-sm min-h-[500px] animate-in slide-in-from-bottom duration-500">
            <h2 className="text-3xl font-black mb-10 text-gray-900 border-b pb-6">{currentLesson.title}</h2>
            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap font-medium text-lg">
              {currentLesson.content_text}
            </div>
          </div>
        );
      case 'pdf':
        return (
          <div className="h-[800px] w-full bg-gray-900 rounded-[3rem] overflow-hidden border-8 border-gray-800 flex flex-col shadow-2xl animate-in fade-in duration-500">
            <div className="bg-gray-800 p-6 flex justify-between items-center text-white px-10">
               <span className="font-black text-sm flex items-center gap-3 uppercase tracking-widest"><FileText size={20} className="text-blue-400"/> Ebook & Material Complementar</span>
               <div className="flex items-center gap-2 bg-yellow-400/10 text-yellow-400 px-4 py-2 rounded-xl text-[10px] font-black border border-yellow-400/20">
                 <Lock size={12}/> DOWNLOAD BLOQUEADO
               </div>
            </div>
            <iframe src={`${currentLesson.pdf_url}#toolbar=0&navpanes=0&scrollbar=0`} className="flex-grow w-full border-none" />
          </div>
        );
      case 'quiz':
        if (isQuizFinished) return (
          <div className="bg-white p-16 rounded-[3rem] border shadow-2xl text-center flex flex-col items-center animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <Trophy size={48}/>
             </div>
             <h2 className="text-4xl font-black mb-4">Quiz Concluído!</h2>
             <p className="text-gray-500 text-xl font-medium mb-8">Você acertou <span className="text-blue-600 font-black">{quizScore} de {currentLesson.quiz_data?.length}</span> questões.</p>
             <button onClick={startQuiz} className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl">RECOMECAR TESTE</button>
          </div>
        );

        const currentQ = currentLesson.quiz_data?.[quizStep];
        return (
          <div className="bg-white p-12 rounded-[3rem] border shadow-xl animate-in slide-in-from-bottom duration-500">
             <div className="flex justify-between items-center mb-10">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full">Questão {quizStep + 1} de {currentLesson.quiz_data?.length}</span>
                <HelpCircle size={32} className="text-orange-400"/>
             </div>
             
             <h3 className="text-2xl font-black text-gray-900 mb-10 leading-tight">{currentQ?.question}</h3>
             
             <div className="space-y-4 mb-10">
                {currentQ?.options.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedAnswer(idx)}
                    className={`w-full p-6 text-left rounded-2xl font-bold transition-all border-2 flex items-center justify-between group ${selectedAnswer === idx ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg' : 'border-gray-100 text-gray-500 hover:border-blue-200'}`}
                  >
                    {opt}
                    <div className={`w-6 h-6 rounded-full border-2 transition-all ${selectedAnswer === idx ? 'border-blue-600 bg-blue-600' : 'border-gray-200 group-hover:border-blue-300'}`}></div>
                  </button>
                ))}
             </div>

             <button 
               onClick={handleQuizAnswer}
               disabled={selectedAnswer === null}
               className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all uppercase tracking-widest"
             >
               PRÓXIMA PERGUNTA
             </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
         <Link to="/dashboard" className="text-gray-400 font-black flex items-center gap-3 hover:text-blue-600 transition-all uppercase text-[10px] tracking-widest"><ChevronLeft size={16}/> Meus Estudos</Link>
         <h1 className="text-xl font-black text-gray-900">{course.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {renderContent()}
          <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">AI</div>
                <div>
                   <h3 className="text-lg font-black text-gray-900">{currentLesson?.title || 'Selecione uma aula'}</h3>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Aula Ativa</p>
                </div>
             </div>
             <p className="text-gray-500 leading-relaxed font-medium">{course.description}</p>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden sticky top-24">
              <div className="p-8 border-b bg-gray-50/50">
                 <h3 className="font-black text-gray-900 flex items-center gap-3"><BookOpen size={24} className="text-blue-600"/> GRADE CURRICULAR</h3>
              </div>
              <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                 {modules.map((m, idx) => (
                   <div key={m.id} className="rounded-2xl border border-gray-100 overflow-hidden">
                      <button 
                        onClick={() => toggleModule(m.id)}
                        className="w-full p-5 flex justify-between items-center hover:bg-gray-50 transition-all text-left"
                      >
                         <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-blue-600">{idx + 1}.</span>
                           <h4 className="font-bold text-gray-700 text-sm truncate max-w-[180px]">{m.title}</h4>
                         </div>
                         <ChevronDown size={18} className={`text-gray-300 transition-transform duration-300 ${expandedModules.includes(m.id) ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedModules.includes(m.id) && (
                        <div className="bg-gray-50/30 p-2 space-y-1 border-t">
                           {m.lessons.map(lesson => (
                             <button 
                               key={lesson.id}
                               onClick={() => { setCurrentLesson(lesson); if (lesson.content_type === 'quiz') startQuiz(); }}
                               className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${currentLesson?.id === lesson.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white text-gray-500 hover:text-blue-600'}`}
                             >
                                {lesson.content_type === 'video' ? <Play size={14}/> : lesson.content_type === 'pdf' ? <FileText size={14}/> : lesson.content_type === 'quiz' ? <HelpCircle size={14}/> : <Info size={14}/>}
                                <span className="text-xs font-bold truncate">{lesson.title}</span>
                             </button>
                           ))}
                        </div>
                      )}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
      <DoubtSupport />
    </div>
  );
};

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

export default CoursePlayer;
