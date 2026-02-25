import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PawPrint, Calendar, ClipboardList, LogOut, Home, Bell, Settings } from "lucide-react";

interface ClientLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

const CLIENT_TABS = [
  { href: "/cliente", label: "Meus Pets",     icon: PawPrint       },
  { href: "/cliente", label: "Agendar",        icon: Calendar       },
  { href: "/cliente", label: "Solicitações",   icon: ClipboardList  },
];

export const ClientLayout = ({ children, userName }: ClientLayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-100 font-sans">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-teal-600 text-white shadow-lg z-20 shrink-0">
        <div className="flex items-center justify-between px-4 py-2 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white rounded-xl p-1.5 shadow-sm">
              <img
                src="/agendavet-logo.png"
                alt="AgendaVet"
                className="h-7 w-7 rounded-lg object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div>
              <div className="font-bold text-base leading-tight">AgendaVet</div>
              <div className="text-teal-200 text-[11px]">Portal do Tutor</div>
            </div>
          </div>

          {/* Center: client greeting */}
          {userName && (
            <div className="hidden md:block text-center flex-1">
              <div className="font-semibold text-sm">Olá, {userName}</div>
              <div className="text-teal-200 text-[11px]">Bem-vindo(a) ao portal</div>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button className="flex flex-col items-center gap-0.5 hover:bg-teal-500 px-2 py-1.5 rounded-lg transition-colors min-w-[50px]">
              <Bell size={17} />
              <span className="text-[9px] font-medium">Avisos</span>
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex flex-col items-center gap-0.5 hover:bg-teal-500 px-2 py-1.5 rounded-lg transition-colors min-w-[50px]"
            >
              <Home size={17} />
              <span className="text-[9px] font-medium">Início</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-0.5 hover:bg-red-600 px-2 py-1.5 rounded-lg transition-colors min-w-[50px]"
            >
              <LogOut size={17} />
              <span className="text-[9px] font-medium">Sair</span>
            </button>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="flex items-end px-4 border-t border-teal-500 overflow-x-auto">
          {CLIENT_TABS.map(({ href, label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => navigate(href)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-teal-100 hover:text-white hover:bg-teal-500 rounded-t-lg transition-all whitespace-nowrap"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-auto p-4">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-teal-700 text-teal-200 text-center py-2 text-[11px] shrink-0">
        AgendaVet © {new Date().getFullYear()} — Dr. Cleyton Chaves · Clínica Veterinária
      </footer>
    </div>
  );
};
