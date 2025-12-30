
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../App';
import { ForumTopic, ForumPost } from '../types';
import { 
  MessageSquare, Plus, Search, User, Clock, 
  Trash2, Send, ChevronRight, ArrowLeft, Loader2,
  ShieldAlert,
  X
} from 'lucide-react';

const CommunityPage: React.FC = () => {
  const { profile, user } = useAuth();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Topic/Post inputs
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [reply, setReply] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Forum_Topics')
      .select('*, author:Profiles(*)')
      .order('created_at', { ascending: false });
    
    if (!error) setTopics(data || []);
    setLoading(false);
  };

  const fetchPosts = async (topicId: string) => {
    const { data, error } = await supabase
      .from('Forum_Posts')
      .select('*, author:Profiles(*)')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    
    if (!error) setPosts(data || []);
  };

  const handleSelectTopic = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    fetchPosts(topic.id);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Você precisa estar logado para postar.');
    setActionLoading(true);

    const { data, error } = await supabase.from('Forum_Topics').insert({
      title: newTopic.title,
      description: newTopic.description,
      author_id: user.id
    }).select().single();

    if (error) {
      alert('Erro ao criar tópico: ' + error.message);
    } else {
      setIsModalOpen(false);
      setNewTopic({ title: '', description: '' });
      fetchTopics();
    }
    setActionLoading(false);
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTopic) return;
    if (!reply.trim()) return;
    setActionLoading(true);

    const { error } = await supabase.from('Forum_Posts').insert({
      topic_id: selectedTopic.id,
      author_id: user.id,
      content: reply
    });

    if (!error) {
      setReply('');
      fetchPosts(selectedTopic.id);
    }
    setActionLoading(false);
  };

  const deleteTopic = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tópico e todas as suas respostas?')) return;
    await supabase.from('Forum_Posts').delete().eq('topic_id', id);
    await supabase.from('Forum_Topics').delete().eq('id', id);
    setSelectedTopic(null);
    fetchTopics();
  };

  const deletePost = async (id: string) => {
    if (!confirm('Excluir esta resposta?')) return;
    await supabase.from('Forum_Posts').delete().eq('id', id);
    if (selectedTopic) fetchPosts(selectedTopic.id);
  };

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-[80vh]">
      {selectedTopic ? (
        /* Topic Detail View */
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
          <button 
            onClick={() => setSelectedTopic(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para a Comunidade
          </button>

          <div className="bg-white rounded-3xl border p-8 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                  {/* Fix: Changed .author?.name to .author?.FullName to match Profile type definition */}
                  {selectedTopic.author?.FullName?.[0] || '?'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedTopic.title}</h1>
                  {/* Fix: Changed .author?.name to .author?.FullName */}
                  <p className="text-sm text-gray-500">Postado por <span className="font-semibold text-blue-600">{selectedTopic.author?.FullName}</span> em {new Date(selectedTopic.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {/* Fix: Changed .role to .Role to match Profile type definition */}
              {profile?.Role === 'admin' && (
                <button onClick={() => deleteTopic(selectedTopic.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedTopic.description}
            </div>
          </div>

          <div className="space-y-4 ml-4 md:ml-12">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" /> Respostas ({posts.length})
            </h3>
            
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl border p-6 shadow-sm relative group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {/* Fix: Changed .author?.role to .author?.Role and .author?.name to .author?.FullName */}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${post.author?.Role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                      {post.author?.FullName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleString()}
                    </span>
                  </div>
                  {/* Fix: Changed .role to .Role */}
                  {profile?.Role === 'admin' && (
                    <button onClick={() => deletePost(post.id)} className="p-1.5 text-red-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
              </div>
            ))}

            {user ? (
              <form onSubmit={handlePostReply} className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 mt-8">
                <label className="block text-sm font-bold text-blue-900 mb-2">Sua Resposta</label>
                <textarea 
                  required
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-blue-100 focus:border-blue-400 outline-none transition-all h-32"
                  placeholder="Contribua com a discussão..."
                />
                <div className="flex justify-end mt-4">
                  <button 
                    disabled={actionLoading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    Responder
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">Você precisa estar logado para responder.</p>
                <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Fazer Login</Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Topics List View */
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-gray-900">Comunidade Albert</h1>
              <p className="text-gray-500 mt-2">Tire dúvidas, compartilhe conhecimento e cresça junto com outros alunos.</p>
            </div>
            <button 
              onClick={() => user ? setIsModalOpen(true) : alert('Faça login para criar tópicos')}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
            >
              <Plus className="h-5 w-5" /> Novo Tópico
            </button>
          </div>

          <div className="relative mb-10">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="Pesquisar discussões..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white rounded-3xl border border-gray-100 shadow-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all text-lg"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium">Carregando discussões...</p>
              </div>
            ) : filteredTopics.length > 0 ? (
              filteredTopics.map(topic => (
                <div 
                  key={topic.id} 
                  onClick={() => handleSelectTopic(topic)}
                  className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 rounded-2xl flex items-center justify-center transition-colors">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{topic.title}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                          {/* Fix: Changed .author?.name to .author?.FullName */}
                          <User className="h-4 w-4" /> {topic.author?.FullName}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Clock className="h-4 w-4" /> {new Date(topic.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-300 group-hover:text-blue-600 transition-colors" />
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
                <p className="text-gray-500">Nenhum tópico encontrado com esses termos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Topic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-6 w-6 text-gray-400" />
            </button>
            
            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900">Iniciar Discussão</h2>
              <p className="text-gray-500">Compartilhe sua dúvida ou ideia com a Academia Albert.</p>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Assunto / Título</label>
                <input 
                  required
                  type="text" 
                  placeholder="Ex: Dúvida sobre o curso de JavaScript"
                  value={newTopic.title}
                  onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Mensagem Detalhada</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Descreva aqui o que você está pensando..."
                  value={newTopic.description}
                  onChange={e => setNewTopic({...newTopic, description: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all h-40"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  disabled={actionLoading}
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  Publicar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
