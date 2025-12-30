
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../App';
import { Course, Enrollment } from '../types';
import { Play, CreditCard, Search, Clock, CheckCircle, X, Loader2, Zap } from 'lucide-react';
import DoubtSupport from '../components/DoubtSupport';

const StudentDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'EMOLA' | 'BIM' | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [coursesRes, enrollmentsRes] = await Promise.all([
      supabase.from('Courses').select('*').order('created_at', { ascending: false }),
      supabase.from('Enrollments').select('*').eq('profile_id', user.id)
    ]);
    
    if (coursesRes.data) setCourses(coursesRes.data);
    if (enrollmentsRes.data) setEnrollments(enrollmentsRes.data);
    setLoading(false);
  };

  const getEnrollment = (courseId: string) => enrollments.find(e => e.course_id === courseId);

  const handleEnrollClick = async (course: Course) => {
    if (course.isFree) {
       setProcessingPayment(true);
       try {
         await supabase.from('Enrollments').insert({
           profile_id: user?.id,
           course_id: course.id,
           status: 'paid'
         });
         fetchData();
       } catch (err) {
         alert('Erro ao liberar curso grátis.');
       } finally {
         setProcessingPayment(false);
       }
    } else {
       setSelectedCourse(course);
       setIsPayModalOpen(true);
    }
  };

  const handlePayment = async () => {
    if (!selectedCourse || !paymentMethod || !user) return;
    setProcessingPayment(true);
    
    try {
      const { data: enrollment, error: eErr } = await supabase.from('Enrollments').insert({
        profile_id: user.id,
        course_id: selectedCourse.id,
        status: 'pending'
      }).select().single();
      
      if (eErr) throw eErr;
      const amount = selectedCourse.promoPrice || selectedCourse.price;

      const { data: invoice, error: iErr } = await supabase.from('Invoices').insert({
        enrollment_id: enrollment.id,
        amount,
        status: 'unpaid'
      }).select().single();

      if (iErr) throw iErr;
      await new Promise(resolve => setTimeout(resolve, 1500));

      await supabase.from('Payments').insert({
        invoice_id: invoice.id,
        method: paymentMethod,
        amount,
        status: 'success'
      });

      await supabase.from('Invoices').update({ status: 'paid' }).eq('id', invoice.id);
      await supabase.from('Enrollments').update({ status: 'paid' }).eq('id', enrollment.id);

      setIsPayModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Erro no processamento.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const enrollment = getEnrollment(c.id);
    if (filter === 'mine') return enrollment?.status === 'paid' && matchesSearch;
    if (filter === 'pending') return enrollment?.status === 'pending' && matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="bg-blue-600 rounded-[2.5rem] p-10 mb-12 text-white overflow-hidden relative shadow-2xl shadow-blue-100 animate-in fade-in slide-in-from-top duration-700">
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2">Olá, {profile?.FullName || 'Estudante'}!</h1>
          <p className="text-blue-100 font-medium max-w-lg opacity-80">Hoje é um ótimo dia para aprender algo novo.</p>
        </div>
        <Zap className="absolute -right-10 -bottom-10 w-72 h-72 text-blue-500 opacity-20 rotate-12" />
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
          {['all', 'mine', 'pending'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f === 'all' ? 'Explorar' : f === 'mine' ? 'Meus Cursos' : 'Aguardando'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="O que você quer aprender?" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48}/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredCourses.map(course => {
            const enrollment = getEnrollment(course.id);
            const isPaid = enrollment?.status === 'paid';
            const isPending = enrollment?.status === 'pending';

            return (
              <div key={course.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col relative animate-in zoom-in duration-500">
                <div className="relative aspect-video">
                  <img src={course.bannerUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  {isPaid && <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-lg shadow-green-200"><CheckCircle size={12}/> Ativo</div>}
                  {isPending && <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-lg shadow-yellow-200"><Clock size={12}/> Pendente</div>}
                </div>
                
                <div className="p-8 flex-grow flex flex-col">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{course.category}</span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">{course.title}</h3>
                  <div className="mt-auto pt-6 border-t flex items-center justify-between">
                    {!isPaid ? (
                      <button 
                        onClick={() => handleEnrollClick(course)}
                        disabled={processingPayment}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        {processingPayment ? <Loader2 className="animate-spin" size={18}/> : <CreditCard size={18}/>}
                        {course.isFree ? 'Liberar Grátis' : 'Matricular'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/course/${course.id}`)}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl"
                      >
                        <Play className="h-4 w-4" /> ESTUDAR AGORA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Support */}
      <DoubtSupport />

      {/* Payment Modal */}
      {isPayModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in duration-300">
             <button onClick={() => setIsPayModalOpen(false)} className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-colors"><X/></button>
             <h2 className="text-2xl font-black mb-6">Finalizar Inscrição</h2>
             <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-[2rem] flex justify-between items-center">
                   <span className="font-bold text-blue-900">Total:</span>
                   <span className="text-3xl font-black text-blue-600">{selectedCourse.promoPrice || selectedCourse.price} MT</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                   {(['MPESA', 'EMOLA', 'BIM'] as const).map(m => (
                     <button key={m} onClick={() => setPaymentMethod(m)} className={`p-4 border-2 rounded-2xl font-bold transition-all ${paymentMethod === m ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105' : 'border-gray-100 text-gray-400'}`}>{m}</button>
                   ))}
                </div>
                <button onClick={handlePayment} disabled={!paymentMethod || processingPayment} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all uppercase tracking-widest">
                  {processingPayment ? 'Processando...' : 'Confirmar'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
