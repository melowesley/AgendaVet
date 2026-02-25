import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function HeroSectionOne() {
  const navigate = useNavigate();

  return (
    <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
      <HeroNavbar onAuth={() => navigate('/auth')} onAdmin={() => navigate('/admin/login')} />
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="px-4 py-10 md:py-20">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-7xl dark:text-slate-300">
          {"Cuide do seu pet em minutos, não em horas"
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
        >
          Sistema completo de gestão veterinária. Agende consultas, acesse prontuários,
          receitas e exames do seu pet em um só lugar, de forma simples e segura.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1 }}
          className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Button
            onClick={() => navigate('/auth')}
            className="w-60 h-11 transform rounded-lg gradient-primary text-white shadow-md font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Portal do Tutor
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/login')}
            className="w-60 h-11 transform rounded-lg border border-gray-300 dark:border-gray-700 transition-all duration-300 hover:-translate-y-0.5"
          >
            Portal do Usuário
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.2 }}
          className="relative z-10 mt-20 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="w-full overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700">
            <img
              src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200"
              alt="Clínica veterinária e pet"
              className="aspect-[16/9] h-auto w-full object-cover"
              height={1000}
              width={1000}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function HeroNavbar({ onAuth, onAdmin }: { onAuth: () => void; onAdmin: () => void }) {
  return (
    <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg overflow-hidden flex-shrink-0">
          <img src="/agendavet-logo.png" alt="AgendaVet" className="size-7 object-contain" />
        </div>
        <h1 className="text-base font-bold md:text-2xl text-slate-800 dark:text-white">AgendaVet</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onAdmin} className="hidden sm:flex text-slate-600 dark:text-slate-300">
          Portal do Usuário
        </Button>
        <Button size="sm" onClick={onAuth} className="gradient-primary text-white shadow-sm">
          Portal do Tutor
        </Button>
      </div>
    </nav>
  );
}
