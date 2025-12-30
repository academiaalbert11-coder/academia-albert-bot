
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Course } from '../types';
import { CheckCircle, ArrowRight, Play, Star, ShieldCheck, Zap, Video, PlayCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from('Courses').select('*').order('created_at', { ascending: false });
      if (!error) setCourses(data || []);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  const videoCourses = courses.filter(c => c.homeVideoUrl);

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative bg-white pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black uppercase mb-6 tracking-widest">
                <Zap size={14}/> Nova Era do Ensino
              </div>
              <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-7xl">
                Academia <span className="text-blue-600">Albert</span>
              </h1>
              <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A plataforma de educação online mais completa de Moçambique. Aprenda habilidades reais com mentores de elite.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2">
                  Começar Agora <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/login" className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all">
                  Área do Aluno
                </Link>
              </div>
            </div>
            <div className="mt-16 lg:mt-0 relative">
              <div className="relative group">
                 <img src="https://picsum.photos/seed/edu/800/600" className="rounded-[3rem] shadow-2xl transition-transform group-hover:scale-[1.02] duration-700" />
                 <div className="absolute inset-0 bg-blue-600/10 rounded-[3rem]"></div>
              </div>
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-2xl border flex items-center gap-4 animate-bounce-slow">
                 <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center font-bold">98%</div>
                 <div className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Taxa de Satisfação<br/><span className="text-gray-900">Dos Alunos</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Videos Section (Novidade: Vídeos configurados pelo admin) */}
      {videoCourses.length > 0 && (
        <section className="bg-gray-900 py-24 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black text-white mb-4">Aulas Demonstrativas</h2>
               <p className="text-gray-400">Assista uma prévia do que você vai encontrar em nossa plataforma.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               {videoCourses.slice(0, 2).map(course => (
                 <div key={course.id} className="space-y-4">
                    <div className="aspect-video rounded-3xl overflow-hidden bg-black border-4 border-gray-800 shadow-2xl group relative">
                       <video 
                         src={course.homeVideoUrl} 
                         className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                         controls 
                         controlsList="nodownload"
                         onContextMenu={e => e.preventDefault()}
                       />
                       {!course.homeVideoUrl?.includes('.mp4') && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <PlayCircle size={64} className="text-white opacity-40 group-hover:scale-110 transition-transform" />
                         </div>
                       )}
                    </div>
                    <div className="flex justify-between items-center px-2">
                       <h3 className="text-white font-bold">{course.title}</h3>
                       <Link to="/register" className="text-blue-400 text-sm font-black hover:text-blue-300">VER MAIS</Link>
                    </div>
                 </div>
               ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px]"></div>
        </section>
      )}

      {/* Course Catalog */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-4xl font-black text-gray-900">Explore Nossos Cursos</h2>
            <p className="text-gray-500 mt-2">Educação de qualidade, acessível e sem fronteiras.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-[2rem] h-80"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all group relative">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={course.bannerUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <div className="bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                      {course.category}
                    </div>
                    {course.isFree && (
                      <div className="bg-green-500 px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-sm shadow-green-200">
                        Grátis
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-1">{course.title}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{course.description}</p>
                  <div className="flex items-center justify-between border-t pt-6">
                    <div>
                      {course.isFree ? (
                        <span className="text-2xl font-black text-green-600 uppercase tracking-tighter">Gratuito</span>
                      ) : (
                        <div className="flex flex-col">
                           {course.promoPrice ? (
                            <>
                              <span className="text-sm text-gray-400 line-through font-bold">{course.price} MT</span>
                              <span className="text-2xl font-black text-blue-600 tracking-tighter">{course.promoPrice} MT</span>
                            </>
                          ) : (
                            <span className="text-2xl font-black text-blue-600 tracking-tighter">{course.price} MT</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Link to="/register" className="p-4 bg-gray-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg group-hover:scale-110">
                      <Play className="h-5 w-5 fill-current" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LandingPage;
