import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, PawPrint, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { getErrorMessage, isLikelyNetworkError } from '@/utils/errorMessage';

const REMEMBER_ADMIN_EMAIL_KEY = 'agendavet_admin_remembered_email';

const AdminAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  const savedEmail = localStorage.getItem(REMEMBER_ADMIN_EMAIL_KEY) ?? '';

  const [loginData, setLoginData] = useState({
    email: savedEmail,
    password: '',
  });

  useEffect(() => {
    if (savedEmail) setRememberEmail(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;

    const checkSessionAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted || !session) return;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (mounted && data) navigate('/admin', { replace: true });
    };

    checkSessionAndRedirect();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (mounted && session) checkSessionAndRedirect();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const doSignIn = () => supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      let signInResult = await doSignIn();
      if (signInResult.error && isLikelyNetworkError(signInResult.error)) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        signInResult = await doSignIn();
      }

      const { data: authData, error } = signInResult;

      if (error) throw error;
      if (!authData.user) {
        throw new Error('Sessão inválida após o login.');
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast({
          title: 'Acesso negado',
          description: 'Esta conta não possui permissão de administrador.',
          variant: 'destructive',
        });
        return;
      }

      // Salva ou remove o email conforme a preferência
      if (rememberEmail) {
        localStorage.setItem(REMEMBER_ADMIN_EMAIL_KEY, loginData.email);
      } else {
        localStorage.removeItem(REMEMBER_ADMIN_EMAIL_KEY);
      }

      toast({ title: 'Login realizado!', description: 'Bem-vindo ao painel administrativo.' });
      navigate('/admin');
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      const isNetwork = isLikelyNetworkError(error);
      console.error('Erro no login admin:', error);
      toast({
        title: 'Erro ao fazer login',
        description: message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : message === 'Email not confirmed'
            ? 'Confirme seu email antes de entrar.'
          : isNetwork
            ? 'Sem conexão ou servidor demorou. Confira a internet e tente de novo.'
            : message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex overflow-hidden font-sans">

      {/* Left panel — esconde em landscape mobile via CSS */}
      <div className="auth-brand-panel hidden md:flex flex-col items-center justify-center w-1/2 bg-teal-600 text-white p-12 gap-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <img
              src="/agendavet-logo.png"
              alt="AgendaVet"
              className="w-24 h-24 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <PawPrint className="text-teal-600 hidden" size={96} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">AgendaVet</h1>
            <p className="text-teal-200 text-lg mt-1">Sistema de Gestão Veterinária</p>
          </div>
          <div className="max-w-xs text-teal-100 text-sm leading-relaxed">
            Gerencie consultas, prontuários, receitas e muito mais em um único sistema moderno e seguro.
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-sm">
            {[
              "Agenda inteligente",
              "Prontuários digitais",
              "Receitas e exames",
              "Relatórios clínicos",
            ].map(item => (
              <div key={item} className="flex items-center gap-2 bg-teal-500/40 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 bg-teal-300 rounded-full shrink-0" />
                <span className="text-teal-100">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — rola em landscape mobile */}
      <div className="auth-scroll-panel flex-1 min-h-0 overflow-y-auto flex items-center justify-center bg-gray-50 p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm py-4"
        >
          {/* Mobile logo */}
          <div className="flex md:hidden flex-col items-center mb-8">
            <div className="bg-teal-600 rounded-2xl p-4 mb-3">
              <PawPrint className="text-white" size={40} />
            </div>
            <h1 className="font-black text-2xl text-teal-700">AgendaVet</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-teal-100 rounded-xl p-2.5">
                <Shield className="text-teal-600" size={22} />
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-lg">Acesso Restrito</h2>
                <p className="text-xs text-gray-500">Credenciais de administrador</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@clinica.com"
                    className="pl-9 h-10 border-gray-200 focus:border-teal-400 focus:ring-teal-400"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-sm font-semibold text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 border-gray-200 focus:border-teal-400 focus:ring-teal-400"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {/* ── Lembrar email ─────────────────────────── */}
              <label
                htmlFor="admin-remember-email"
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div className="relative flex items-center">
                  <input
                    id="admin-remember-email"
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="sr-only"
                  />
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
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Entrando...
                  </>
                ) : 'Entrar como Administrador'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-5">
              Sessão mantida até fazer logout manualmente.
            </p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            <a href="/" className="text-teal-600 hover:text-teal-700 hover:underline font-medium">
              ← Voltar para o início
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAuth;
