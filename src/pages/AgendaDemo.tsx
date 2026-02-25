import { useState } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Search,
  PawPrint,
  Bell,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppointmentType =
  | "CONSULTA"
  | "VACINA"
  | "CIRURGIA"
  | "EXAME"
  | "BANHO/TOSA"
  | "RETORNO"
  | "ATIVIDADE";

interface Appointment {
  time: string;
  petName: string;
  ownerName?: string;
  age?: string;
  sex?: "M" | "F";
  phone?: string;
  type: AppointmentType;
  highlight?: boolean;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const VETS = [
  { id: 1, name: "Dra. Ana Souza", specialty: "Clínica Geral", color: "#4ade80" },
  { id: 2, name: "Dr. Carlos Lima", specialty: "Cirurgia", color: "#f87171" },
  { id: 3, name: "Dra. Beatriz Moura", specialty: "Dermatologia", color: "#60a5fa" },
  { id: 4, name: "Dr. Felipe Torres", specialty: "Medicina Geral", color: "#a78bfa" },
  { id: 5, name: "Dra. Julia Ramos", specialty: "Clínica Geral", color: "#fb923c" },
];

const MORNING_APPOINTMENTS: Appointment[] = [
  { time: "08:00", petName: "Rex", ownerName: "João Silva", age: "3A", sex: "M", type: "CONSULTA" },
  { time: "08:30", petName: "Mel", ownerName: "Maria Oliveira", age: "5A", sex: "F", type: "VACINA" },
  { time: "09:00", petName: "Thor", ownerName: "Pedro Alves", age: "2A", sex: "M", type: "CONSULTA", highlight: true },
  { time: "10:00", petName: "Luna", ownerName: "Ana Santos", age: "4A", sex: "F", type: "EXAME" },
  { time: "11:00", petName: "Bob", ownerName: "Carlos Pereira", age: "7A", sex: "M", type: "CONSULTA" },
  { time: "12:00", petName: "Nina", ownerName: "Luciana Costa", age: "1A", sex: "F", type: "BANHO/TOSA" },
];

const AFTERNOON_APPOINTMENTS: Appointment[] = [
  { time: "13:00", petName: "Max", ownerName: "Roberto Nunes", age: "6A", sex: "M", phone: "11987650001", type: "CONSULTA", highlight: true },
  { time: "14:00", petName: "Bela", ownerName: "Fernanda Lima", age: "2A", sex: "F", phone: "11987650002", type: "RETORNO" },
  { time: "15:00", petName: "Simba", ownerName: "Eduardo Melo", age: "4A", sex: "M", phone: "11987650003", type: "CIRURGIA" },
  { time: "16:00", petName: "", type: "ATIVIDADE" },
  { time: "16:30", petName: "REUNIÃO EQUIPE VET", type: "ATIVIDADE" },
  { time: "17:00", petName: "REUNIÃO EQUIPE VET", type: "ATIVIDADE" },
];

const APPOINTMENT_COLORS: Record<AppointmentType, string> = {
  CONSULTA: "#d1fae5",
  VACINA: "#dbeafe",
  CIRURGIA: "#fee2e2",
  EXAME: "#fef3c7",
  "BANHO/TOSA": "#ede9fe",
  RETORNO: "#fce7f3",
  ATIVIDADE: "#e5e7eb",
};

const APPOINTMENT_TEXT_COLORS: Record<AppointmentType, string> = {
  CONSULTA: "#065f46",
  VACINA: "#1e40af",
  CIRURGIA: "#991b1b",
  EXAME: "#92400e",
  "BANHO/TOSA": "#5b21b6",
  RETORNO: "#9d174d",
  ATIVIDADE: "#374151",
};

// ---------------------------------------------------------------------------
// Helper: mini calendar
// ---------------------------------------------------------------------------

function MiniCalendar({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date(selected));
  const startDay = startOfWeek(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1), { weekStartsOn: 1 });
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(startDay, i));
  const today = new Date();

  return (
    <div className="bg-white rounded-lg shadow p-3 select-none text-sm">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setViewMonth(m => subWeeks(m, 4))} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft size={14} />
        </button>
        <span className="font-semibold text-teal-700 uppercase text-xs">
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </span>
        <button onClick={() => setViewMonth(m => addWeeks(m, 4))} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center text-[10px] text-gray-500 font-medium mb-1">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
          const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
          const isSelected = format(day, "yyyy-MM-dd") === format(selected, "yyyy-MM-dd");
          return (
            <button
              key={i}
              onClick={() => onSelect(day)}
              className={[
                "w-7 h-7 text-[11px] rounded-full flex items-center justify-center mx-auto",
                !isCurrentMonth ? "text-gray-300" : "text-gray-700 hover:bg-teal-100",
                isToday ? "font-bold text-teal-600" : "",
                isSelected ? "bg-teal-600 text-white hover:bg-teal-700 font-bold" : "",
              ].join(" ")}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appointment row
// ---------------------------------------------------------------------------

function ApptRow({ appt, showPhone }: { appt: Appointment; showPhone?: boolean }) {
  const bg = APPOINTMENT_COLORS[appt.type];
  const tc = APPOINTMENT_TEXT_COLORS[appt.type];

  if (appt.type === "ATIVIDADE") {
    return (
      <tr style={{ backgroundColor: "#f3f4f6" }}>
        <td className="px-2 py-1 text-xs font-medium text-gray-500 whitespace-nowrap">{appt.time}</td>
        <td className="px-2 py-1 text-xs text-gray-500 font-medium" colSpan={showPhone ? 4 : 3}>{appt.petName || "—"}</td>
        <td className="px-2 py-1 text-xs text-gray-400 text-right">
          <span className="text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">ATIVIDADE</span>
        </td>
        <td className="px-2 py-1 text-xs">
          <button className="text-red-400 hover:text-red-600"><X size={12} /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ backgroundColor: appt.highlight ? "#fef9c3" : bg }} className="hover:brightness-95 transition-all cursor-pointer">
      <td className="px-2 py-1.5 text-xs font-medium text-gray-600 whitespace-nowrap">{appt.time}</td>
      <td className="px-2 py-1.5 text-xs font-bold" style={{ color: tc }}>{appt.petName}</td>
      <td className="px-2 py-1.5 text-xs text-gray-600 whitespace-nowrap">
        {appt.age && <>{appt.age} {appt.sex === "M" ? "♂" : "♀"}</>}
      </td>
      {showPhone && (
        <td className="px-2 py-1.5 text-xs text-gray-600">{appt.phone || "—"}</td>
      )}
      <td className="px-2 py-1.5 text-xs text-gray-500 hidden sm:table-cell">{appt.ownerName}</td>
      <td className="px-2 py-1.5">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: tc + "22", color: tc }}>
          {appt.type}
        </span>
      </td>
      <td className="px-2 py-1.5">
        <button className="text-red-400 hover:text-red-600"><X size={12} /></button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const AgendaDemo = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeNav, setActiveNav] = useState("Agenda");
  const [filterSpec, setFilterSpec] = useState("Todas");

  const navItems = ["Buscar", "Minhas Opções", "Agenda", "Pacientes", "Financeiro", "Relatórios"];

  const colorDots = ["#4ade80", "#fbbf24", "#f87171", "#60a5fa", "#a78bfa", "#fb923c"];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-sm font-sans">

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <header className="bg-teal-600 text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Logo / clinic name */}
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5">
              <PawPrint className="text-teal-600" size={22} />
            </div>
            <div>
              <div className="text-lg font-bold leading-tight">AgendaVet</div>
              <div className="text-teal-200 text-[11px]">Sistema de Gestão Veterinária</div>
            </div>
          </div>

          {/* Center: vet name + date */}
          <div className="hidden md:block text-center">
            <div className="font-bold text-base">Dra. Ana Souza</div>
            <div className="text-teal-200 text-xs">CLÍNICA GERAL</div>
            <div className="text-teal-100 text-[11px]">
              {format(selectedDate, "EEEE, dd / MMM / yyyy", { locale: ptBR }).toUpperCase()}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            <button className="flex flex-col items-center gap-0.5 hover:bg-teal-500 px-3 py-1.5 rounded transition-colors">
              <Bell size={18} />
              <span className="text-[10px]">Avisos</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 hover:bg-teal-500 px-3 py-1.5 rounded transition-colors">
              <MessageSquare size={18} />
              <span className="text-[10px]">Mensagens</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 hover:bg-teal-500 px-3 py-1.5 rounded transition-colors">
              <Settings size={18} />
              <span className="text-[10px]">Configuração</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 hover:bg-red-500 px-3 py-1.5 rounded transition-colors">
              <LogOut size={18} />
              <span className="text-[10px]">Sair</span>
            </button>
          </div>
        </div>

        {/* ── Navigation bar ──────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1 px-4 pb-0 border-t border-teal-500">
          {navItems.map(item => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={[
                "px-4 py-2 text-sm font-medium transition-colors",
                activeNav === item
                  ? "bg-white text-teal-700 rounded-t-md -mb-px border-b-0"
                  : "text-teal-100 hover:text-white hover:bg-teal-500 rounded-t-md",
              ].join(" ")}
            >
              {item}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pb-1">
            <span className="text-teal-200 text-xs">Filial:</span>
            <select className="text-teal-700 text-xs bg-white rounded px-2 py-1 border-0 outline-none">
              <option>São Paulo - Centro</option>
              <option>São Paulo - Sul</option>
            </select>
          </div>
        </nav>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ──────────────────────────────────────────────────── */}
        <aside className="w-52 bg-teal-50 border-r border-teal-200 flex flex-col gap-4 p-3 overflow-y-auto shrink-0">
          <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} />

          {/* Agendas section */}
          <div>
            <div className="font-bold text-teal-700 text-xs mb-2 uppercase tracking-wide">Agendas</div>
            <div className="mb-2">
              <label className="text-xs text-gray-500">Filtrar por especialidade:</label>
              <select
                value={filterSpec}
                onChange={e => setFilterSpec(e.target.value)}
                className="w-full mt-1 text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              >
                {["Todas", "Clínica Geral", "Cirurgia", "Dermatologia"].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="text-xs font-semibold text-teal-700 mb-1 mt-2">Veterinários</div>
            <ul className="space-y-1">
              {VETS.map(vet => (
                <li key={vet.id} className="flex items-center gap-2 cursor-pointer hover:bg-teal-100 rounded px-1 py-0.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: vet.color }} />
                  <div>
                    <div className="text-xs font-medium text-gray-700 leading-tight">{vet.name}</div>
                    <div className="text-[10px] text-gray-400">{vet.specialty}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Search free slot */}
          <button className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors mt-auto">
            <Search size={13} />
            Buscar Horário Livre
          </button>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto p-3 flex flex-col gap-3">

          {/* Date header + new appointment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(d => subDays(d, 1))}
                className="p-1 hover:bg-white rounded shadow-sm border border-gray-200"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-base font-bold text-teal-700 flex items-center gap-2">
                <PawPrint size={16} className="text-teal-500" />
                {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
              </h2>
              <button
                onClick={() => setSelectedDate(d => addDays(d, 1))}
                className="p-1 hover:bg-white rounded shadow-sm border border-gray-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow">
              <Plus size={14} />
              Novo Agendamento
            </button>
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {(Object.entries(APPOINTMENT_COLORS) as [AppointmentType, string][]).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1 text-[11px]">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color, border: "1px solid #ccc" }} />
                <span className="text-gray-600">{type}</span>
              </div>
            ))}
          </div>

          {/* ── Two-column schedule ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1">

            {/* Morning column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-teal-600 text-white px-4 py-2 flex items-center justify-between">
                <div className="font-semibold text-sm">☀️ Manhã — Dra. Ana Souza</div>
                <div className="flex gap-2">
                  <div className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    PENDENTES DE ASSINAR PRONTUÁRIOS
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">Hora</th>
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">Paciente</th>
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">Idade</th>
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase hidden sm:table-cell">Tutor</th>
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">Tipo</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MORNING_APPOINTMENTS.map((appt, i) => (
                      <ApptRow key={i} appt={appt} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>Ordenar por:</span>
                <select className="border-0 text-[11px] text-gray-600 bg-transparent outline-none cursor-pointer">
                  <option>Horário</option>
                  <option>Paciente</option>
                  <option>Tipo</option>
                </select>
              </div>
            </div>

            {/* Afternoon column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-teal-700 text-white px-4 py-2 flex items-center justify-between">
                <div className="font-semibold text-sm">🌙 Tarde — Dra. Ana Souza</div>
                <div className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  3 PACIENTES PENDENTES DE PAGAMENTO
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">Hora</th>
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">Paciente</th>
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">Idade</th>
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">Fone</th>
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase hidden sm:table-cell">Tutor</th>
                      <th className="px-2 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">Tipo</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {AFTERNOON_APPOINTMENTS.map((appt, i) => (
                      <ApptRow key={i} appt={appt} showPhone />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>Ordenar por:</span>
                <select className="border-0 text-[11px] text-gray-600 bg-transparent outline-none cursor-pointer">
                  <option>Horário</option>
                  <option>Paciente</option>
                  <option>Tipo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom notice */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 text-xs text-teal-700 flex items-center gap-2">
            <Bell size={14} className="shrink-0" />
            Esta é uma <strong>demonstração de layout</strong>. O visual acima mostra como o sistema AgendaVet poderia ser apresentado no estilo de agenda da referência fornecida.
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgendaDemo;
