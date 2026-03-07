import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Stethoscope, CalendarCheck, FileText,
  ShieldCheck, PawPrint, ArrowRight, Clock, Users,
} from 'lucide-react';

const features = [
  {
    icon: CalendarCheck,
    title: 'Agendamento Online',
    description: 'Solicite consultas de forma rápida e prática, a qualquer hora do dia.',
    bg: 'bg-teal-50',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    icon: FileText,
    title: 'Prontuário Digital',
    description: 'Histórico completo do seu pet sempre disponível e seguro na nuvem.',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Stethoscope,
    title: 'Gestão Clínica',
    description: 'Receitas, exames, vacinas e muito mais em um só sistema moderno.',
    bg: 'bg-cyan-50',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    icon: ShieldCheck,
    title: 'Dados Protegidos',
    description: 'Informações armazenadas com segurança e disponíveis quando precisar.',
    bg: 'bg-teal-50',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700',
  },
];

const stats = [
  { icon: Users,   value: '2',    label: 'Veterinários'     },
  { icon: Clock,   value: '24h',  label: 'Agendamento'      },
  { icon: PawPrint, value: '100%', label: 'Digital'         },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col overflow-hidden font-sans bg-white">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="bg-teal-600 text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-2 shadow-lg flex-wrap shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-teal-700 rounded-xl p-2 shrink-0 border border-teal-500/30">
            <img
              src="/agendavet-logo.png" alt="AgendaVet"
              className="h-8 w-8 object-contain rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="min-w-0">
            <span className="font-black text-base sm:text-lg truncate block">AgendaVet</span>
            <span className="text-teal-200 text-xs ml-0 sm:ml-2 hidden sm:inline">· Clínica Veterinária</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/auth')}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-teal-100 hover:text-white transition-colors"
          >
            Portal do Tutor
          </button>
          <button
            onClick={() => navigate('/admin/login')}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-white text-teal-700 hover:bg-teal-50 rounded-xl transition-colors shadow-sm"
          >
            Portal do Usuário
          </button>
        </div>
      </nav>

      {/* ── Conteúdo rolável (rolagem só aqui) ───────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <PawPrint size={14} />
            Sistema Veterinário Completo
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            Cuidado veterinário<br />
            <span className="text-teal-200">simples e digital</span>
          </h1>
          <p className="text-lg text-teal-100 max-w-xl mx-auto mb-8 leading-relaxed">
            Agende consultas, acompanhe a saúde do seu pet e acesse prontuários completos com Dr. Cleyton Chaves.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-teal-700 font-bold rounded-2xl hover:bg-teal-50 transition-all shadow-lg hover:shadow-xl text-base"
            >
              <PawPrint size={18} />
              Acessar Portal do Tutor
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all text-base"
            >
              Portal do Usuário
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex justify-center gap-8 mt-14 max-w-lg mx-auto"
        >
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-center">
              <div className="bg-white/20 rounded-xl p-3 mb-1">
                <Icon size={20} />
              </div>
              <div className="text-2xl font-black">{value}</div>
              <div className="text-teal-200 text-xs font-medium">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-3">
              Tudo que você precisa
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
              Uma plataforma completa para a saúde e bem-estar do seu pet.
            </p>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={itemVariants}
                  className={`${f.bg} rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
                    <Icon size={22} className={f.iconColor} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 text-sm">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-14 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-gradient-to-br from-teal-600 to-emerald-600 rounded-3xl p-10 text-center text-white shadow-2xl"
        >
          <PawPrint size={40} className="mx-auto mb-4 text-teal-200" />
          <h2 className="font-black text-2xl mb-3">Pronto para começar?</h2>
          <p className="text-teal-100 text-sm mb-6 max-w-sm mx-auto">
            Crie sua conta gratuitamente e tenha acesso a todos os registros do seu pet.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors shadow-lg text-sm"
          >
            Criar conta grátis →
          </button>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-teal-700 text-white py-6 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <PawPrint size={16} className="text-teal-300" />
          <span className="font-bold text-sm">AgendaVet</span>
        </div>
        <p className="text-teal-300 text-xs">
          Dr. Cleyton Chaves · Clínica Veterinária · {new Date().getFullYear()}
        </p>
        <div className="flex justify-center gap-4 mt-3 text-xs text-teal-400">
          <button onClick={() => navigate('/auth')} className="hover:text-teal-200 transition-colors">Portal do Tutor</button>
          <span>·</span>
          <button onClick={() => navigate('/admin/login')} className="hover:text-teal-200 transition-colors">Portal do Usuário</button>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Index;
