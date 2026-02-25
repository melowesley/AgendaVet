import { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut, Stethoscope, Menu,
  LayoutDashboard, Users, Calendar, Bandage,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AttendanceTypeSidebarProvider } from "@/contexts/AttendanceTypeSidebarContext";

// ---------------------------------------------------------------------------
// Nav tabs config (mantido para compatibilidade)
// ---------------------------------------------------------------------------

const ADMIN_TABS = [
  { value: "patients",  label: "Pacientes"    },
  { value: "calendar",  label: "Agenda"       },
  { value: "requests",  label: "Solicitações" },
  { value: "analytics", label: "Dashboard"    },
  { value: "users",     label: "Usuários"     },
  { value: "services",  label: "Serviços"     },
] as const;

// ---------------------------------------------------------------------------
// AdminLayout
// ---------------------------------------------------------------------------

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { icon: Calendar, label: "Agenda", value: "calendar" },
  { icon: Stethoscope, label: "Atendimento clínico", labelLines: ["Atendimento", "clínico"], value: "patients" },
  { icon: Users, label: "Tutores", value: "tutors" },
  { icon: Bandage, label: "Serviços", value: "services" },
  { icon: LayoutDashboard, label: "Painel de controle", labelLines: ["Painel de", "controle"], value: "analytics" },
] as const;

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isPetProfilePage = location.pathname.startsWith("/admin/pet/");
  const activeTab = isPetProfilePage
    ? "patients"
    : (searchParams.get("tab") || "patients");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleTabChange = (tab: string) => {
    setMobileMenuOpen(false);
    // Sempre navegar para /admin com a aba desejada, para garantir que a página carregue
    navigate(`/admin?tab=${tab}`);
  };

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.value === "patients") return activeTab === "patients" || isPetProfilePage;
    return activeTab === item.value;
  };

  const renderNavContent = () => (
    <>
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 rounded-lg p-2 border border-slate-700">
            <img
              src="/agendavet-logo.png"
              alt="AgendaVet"
              className="h-8 w-8 rounded object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).replaceWith(
                  Object.assign(document.createElement("span"), {
                    innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" class="text-white" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9l-4.5-4.5M9.5 4.5C8.1 3.1 6.3 2.4 4.5 2.4S1 3.5 1 5s1.5 2.5 3 2.5 3.5-.5 4.5 1.5M9.5 4.5C9.5 7.5 8 10 6 12M14 9c3 1 5 3.5 5 6.5 0 4-3.5 6.5-7 6.5S5 19.5 5 15.5c0-1.5.5-3 1.5-4"/></svg>`,
                  })
                );
              }}
            />
          </div>
          <span className="font-bold text-lg">AgendaVet</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const lines = "labelLines" in item && item.labelLines ? item.labelLines : [item.label];
          return (
            <button
              key={item.value}
              onClick={() => handleTabChange(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                active
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="text-sm font-medium leading-tight flex flex-col">
                {lines.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-100 font-sans">

      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-20 shrink-0">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-700"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">AgendaVet</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <span>Novidades</span>
              <span className="text-slate-400">|</span>
              <span className="font-semibold">Dr. Cleyton</span>
              <span className="text-slate-400">|</span>
              <span className="text-xs text-slate-500">UNIDADE I</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-xs cursor-pointer hover:bg-teal-700 transition-colors shrink-0">
              CC
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu (Sheet) ────────────────────────────────────────────── */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-slate-900 text-white border-slate-800">
          <div className="flex flex-col h-full">
            {renderNavContent()}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Sidebar (oculta em mobile) ───────────────────────────────────── */}
        <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col shrink-0 border-r border-slate-800">
          {renderNavContent()}
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

export const AdminLayout = ({ children }: AdminLayoutProps) => (
  <AttendanceTypeSidebarProvider>
    <AdminLayoutInner>{children}</AdminLayoutInner>
  </AttendanceTypeSidebarProvider>
);
