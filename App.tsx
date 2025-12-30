
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Profile } from './types';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminPanel from './pages/AdminPanel';
import CoursePlayer from './pages/CoursePlayer';
import CommunityPage from './pages/CommunityPage';
import { LogOut, User, LayoutDashboard, Settings, Menu, X, GraduationCap, Users, Mail, Phone } from 'lucide-react';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id: string) => {
    try {
      const { data, error } = await supabase.from('Profiles').select('*').eq('id', id).maybeSingle();
      if (error) {
        if (error.message.includes('bigint')) {
          console.error("ERRO CRÍTICO: Mude o tipo da coluna id de bigint para uuid no Supabase.");
        }
        throw error;
      }
      
      // Força Admin para o email mestre
      if (data && data.Email?.toLowerCase() === 'academiaalbert11@gmail.com') {
        data.Role = 'admin';
      }
      
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  if (roles && profile && !roles.includes(profile.Role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Academia Albert</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-sm font-medium text-gray-600 hover:text-blue-600">Início</Link>
                <Link to="/community" className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Comunidade
                </Link>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              {profile ? (
                <>
                  <Link to={profile.Role === 'admin' ? '/admin' : '/dashboard'} className="text-gray-600 hover:text-blue-600 font-medium">
                    Minha Área
                  </Link>
                  <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{profile.FullName}</p>
                      <p className="text-xs text-gray-500 capitalize">{profile.Role}</p>
                    </div>
                    <button onClick={signOut} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Login</Link>
                  <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold">
                    Cadastrar
                  </Link>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-b px-4 py-4 space-y-4">
            <Link to="/" className="block text-gray-600 py-2">Início</Link>
            <Link to="/community" className="block text-gray-600 py-2">Comunidade</Link>
            {profile ? (
              <>
                <Link to={profile.Role === 'admin' ? '/admin' : '/dashboard'} className="block text-gray-600 py-2">Minha Área</Link>
                <button onClick={signOut} className="w-full text-left text-red-600 py-2">Sair</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-gray-600 py-2">Login</Link>
                <Link to="/register" className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-center font-bold">Registrar</Link>
              </>
            )}
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold text-white">Academia Albert</span>
            </div>
            <p className="text-sm leading-relaxed opacity-70">
              Transformando o futuro através da educação online de alta qualidade e acessível para todos.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Contato Oficial</h4>
            <div className="space-y-3">
              <a href="mailto:academiaalbert11@gmail.com" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <Mail className="h-4 w-4" /> academiaalbert11@gmail.com
              </a>
              <a href="tel:+258844265435" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <Phone className="h-4 w-4" /> +258 844265435
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Localização</h4>
            <p className="text-sm opacity-70">
              Disponível em todo o território nacional através de nossa plataforma digital premium.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-xs opacity-50">
          &copy; {new Date().getFullYear()} Academia Albert. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute roles={['user', 'student', 'admin']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/course/:id" 
              element={
                <ProtectedRoute roles={['user', 'student', 'admin']}>
                  <CoursePlayer />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
