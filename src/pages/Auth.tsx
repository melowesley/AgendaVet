import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Phone, MapPin, PawPrint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const REMEMBER_EMAIL_KEY = 'agendavet_remembered_email';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [rememberEmail, setRememberEmail] = useState(false);

  // Carrega email salvo ao iniciar
  const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';

  const [loginData, setLoginData] = useState({
    email: savedEmail,
    password: '',
  });
  const [signupData, setSignupData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', phone: '', address: '',
  });

  // Se havia email salvo, ativa a opção automaticamente
  useEffect(() => {
    if (savedEmail) setRememberEmail(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) navigate('/cliente');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/cliente');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      if (error) throw error;

      // Salva ou remove o email conforme a preferência
      if (rememberEmail) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, loginData.email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      toast({ title: 'Login realizado com sucesso!', description: 'Bem-vindo(a) de volta!' });
    } catch (error: unknown) {
      let message = 'Ocorreu um erro inesperado';
      if (error instanceof Error) {
        message = error.message;
        if (message === 'Invalid login credentials') message = 'Email ou senha incorretos';
        else if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
          message = 'Sem conexão ou servidor demorou. Confira a internet e tente de novo.';
        }
      }
      toast({
        title: 'Erro ao fazer login',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }
    if (signupData.password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: signupData.fullName, phone: signupData.phone, address: signupData.address },
        },
      });
      if (error) throw error;
      if (signUpData.user) {
        await supabase.from('profiles').upsert({
          user_id: signUpData.user.id,
          full_name: signupData.fullName,
          phone: signupData.phone,
          address: signupData.address || null,
        }, { onConflict: 'user_id' });
      }
      toast({ title: 'Cadastro realizado!', description: 'Verifique seu email para confirmar sua conta.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ocorreu um erro inesperado';
      toast({ title: 'Erro ao cadastrar', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex overflow-hidden font-sans">

      {/* Left panel — CSS controla visibilidade: só aparece em desktop real (≥768px wide E ≥560px tall) */}
      <div className="auth-brand-panel flex-col items-center justify-center w-2/5 bg-teal-600 text-white p-10 gap-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <div className="bg-white rounded-3xl p-5 shadow-2xl">
            <img
              src="/agendavet-logo.png"
              alt="AgendaVet"
              className="w-20 h-20 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-black">AgendaVet</h1>
            <p className="text-teal-200 mt-1">Portal do Tutor</p>
          </div>
          <p className="text-teal-100 text-sm max-w-xs leading-relaxed">
            Agende consultas, acompanhe a saúde dos seus pets e acesse prontuários digitais com facilidade.
          </p>
          <div className="w-full max-w-xs space-y-2 text-sm">
            {["Agendamento online 24h", "Histórico completo do pet", "Acompanhamento de vacinas", "Acesso a receitas digitais"].map(item => (
              <div key={item} className="flex items-center gap-2 bg-teal-500/40 rounded-lg px-3 py-2">
                <PawPrint size={12} className="text-teal-300 shrink-0" />
                <span className="text-teal-100">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — rola em landscape mobile */}
      <div className="auth-scroll-panel flex-1 min-h-0 overflow-y-auto flex items-center justify-center bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-4"
        >
          {/* Mini-logo mobile — CSS controla: visível em mobile, oculto em desktop */}
          <div className="auth-mobile-logo flex-col items-center mb-6">
            <div className="bg-teal-600 rounded-2xl p-3 mb-2">
              <PawPrint className="text-white" size={36} />
            </div>
            <h1 className="font-black text-xl text-teal-700">AgendaVet</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <h2 className="font-bold text-gray-800 text-xl mb-1">Acesse sua conta</h2>
            <p className="text-sm text-gray-500 mb-6">Entre ou crie uma conta para agendar consultas</p>

            {/* Tab selector */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
              {(['login', 'signup'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                    activeTab === tab
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  ].join(" ")}
                >
                  {tab === 'login' ? 'Entrar' : 'Cadastrar'}
                </button>
              ))}
            </div>

            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      id="login-email" type="email" placeholder="seu@email.com"
                      className="pl-9 h-10 border-gray-200 focus:border-teal-400"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-sm font-semibold text-gray-700">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      id="login-password" type="password" placeholder="••••••••"
                      className="pl-9 h-10 border-gray-200 focus:border-teal-400"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                {/* ── Lembrar email ─────────────────────────── */}
                <label
                  htmlFor="remember-email"
                  className="flex items-center gap-2.5 cursor-pointer select-none group"
                >
                  <div className="relative flex items-center">
                    <input
                      id="remember-email"
                      type="checkbox"
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
                      className="sr-only"
                    />
                    {/* visual checkbox customizado */}
                    <div
                      className={[
                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                        rememberEmail
                          ? "bg-teal-600 border-teal-600"
                          : "bg-white border-gray-300 group-hover:border-teal-400",
                      ].join(" ")}
                    >
                      {rememberEmail && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                    Lembrar meu email
                  </span>
                </label>
                {/* ────────────────────────────────────────────── */}

                <button
                  type="submit" disabled={loading}
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Entrando...</>
                  ) : 'Entrar'}
                </button>
              </form>
            )}

            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3">
                {[
                  { id: 'signup-name', label: 'Nome completo', icon: User, type: 'text', placeholder: 'Seu nome completo', key: 'fullName', autoComplete: 'name' },
                  { id: 'signup-phone', label: 'Telefone', icon: Phone, type: 'tel', placeholder: '(11) 99999-0000', key: 'phone', autoComplete: 'tel' },
                  { id: 'signup-address', label: 'Endereço', icon: MapPin, type: 'text', placeholder: 'Rua, número, bairro, cidade', key: 'address', autoComplete: 'street-address' },
                  { id: 'signup-email', label: 'Email', icon: Mail, type: 'email', placeholder: 'seu@email.com', key: 'email', autoComplete: 'email' },
                  { id: 'signup-pass', label: 'Senha', icon: Lock, type: 'password', placeholder: 'Mínimo 6 caracteres', key: 'password', autoComplete: 'new-password' },
                  { id: 'signup-confirm', label: 'Confirmar Senha', icon: Lock, type: 'password', placeholder: 'Repita a senha', key: 'confirmPassword', autoComplete: 'new-password' },
                ].map(({ id, label, icon: Icon, type, placeholder, key, autoComplete }) => (
                  <div key={id} className="space-y-1">
                    <Label htmlFor={id} className="text-xs font-semibold text-gray-700">
                      {label} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <Input
                        id={id} type={type} placeholder={placeholder}
                        className="pl-8 h-9 text-sm border-gray-200 focus:border-teal-400"
                        value={signupData[key as keyof typeof signupData]}
                        onChange={(e) => setSignupData({ ...signupData, [key]: e.target.value })}
                        autoComplete={autoComplete}
                        required
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="submit" disabled={loading}
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Cadastrando...</>
                  ) : 'Criar conta'}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            <a href="/" className="text-teal-600 hover:underline font-medium">← Voltar para a página inicial</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
