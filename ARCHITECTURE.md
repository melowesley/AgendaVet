# AgendaVet — Auditoria Arquitetural e Decisões Técnicas

## 1. Diagnóstico do Estado Atual

### Problemas Identificados

| Área | Problema | Impacto | Prioridade |
|------|----------|---------|------------|
| **Lógica de negócio em componentes** | `AdminDashboard.fetchStats()` e `AnalyticsDashboard.fetchData()` calculam métricas diretamente no componente | Impossível reusar; dificulta testes | Alta |
| **AppointmentStatus incompleto** | `src/types/appointment.ts` define apenas 5 status (`pending`, `confirmed`, `in-progress`, `completed`, `cancelled`) — fluxo real tem 9 etapas | Dados de status no banco não refletem o fluxo clínico | Alta |
| **Transições de status sem validação** | `ManageRequestDialog` atualiza status diretamente via `supabase.update()` sem checar se a transição é válida (ex: `completed → pending`) | Dados inconsistentes | Alta |
| **Tipos duplicados** | `AppointmentRequest` definida em `useAppointmentRequests.ts`; `Appointment` em `types/appointment.ts`; `AppointmentRow` em `AnalyticsDashboard.tsx` | Drift de tipos; manutenção custosa | Média |
| **Acoplamento Supabase ↔ componente** | Componentes como `AttendanceTypeDialog` chamam `supabase` diretamente para criar registros históricos | Mudança de query exige tocar no componente | Média |
| **Sem validação de entrada** | Formulários validam apenas via HTML nativo; sem schema de validação centralizado | Dados inválidos entram no banco | Média |
| **Métricas embutidas no componente** | `AnalyticsDashboard` calcula ocupação, faturamento e cancelamentos via `useMemo` inline | Não reutilizável; não testável | Média |
| **Sem constantes centralizadas** | Horários de funcionamento, buffer de atendimento, status disponíveis hardcoded em múltiplos arquivos | Mudança de regra exige busca por todo o projeto | Baixa |

### Pontos de Acoplamento Excessivo

```
AttendanceTypeDialog
  └── chama supabase diretamente para criar appointment_requests
  └── importa 17 dialogs filhos (correto para composição, mas sem service layer)

AdminDashboard
  └── chama supabase para stats (deveria ser um hook/service)
  └── lógica de autenticação misturada com lógica de dados

ManageRequestDialog
  └── atualiza status sem máquina de estados
  └── não valida transições permitidas
```

---

## 2. Nova Arquitetura — Decisão Técnica

### Por que NÃO reescrever do zero

O projeto é um **SPA React + Supabase** (BaaS), sem servidor customizado.
A arquitetura correta para esse stack é:

```
Componente React
    ↓  usa
Hook customizado  (equivalente ao Controller/Presenter)
    ↓  chama
Service function  (lógica de negócio pura, testável)
    ↓  chama
Supabase Client   (equivalente ao Repository/DAO)
    ↓
PostgreSQL + RLS  (segurança e políticas no banco)
```

Isso é **Clean Architecture adaptada para frontend SaaS** — sem backend Node.js,
usando Supabase como camada de dados e RLS como middleware de segurança.

### Estrutura de Pastas Adotada

```
src/
├── modules/                    ← domínios de negócio (NOVO)
│   ├── appointments/
│   │   ├── types.ts            ← AppointmentStatus enum + interfaces
│   │   ├── appointmentFlow.service.ts  ← regras de negócio do fluxo
│   │   └── useAppointmentFlow.ts       ← hook que orquestra o fluxo
│   ├── metrics/
│   │   ├── businessMetrics.service.ts  ← cálculos puros de métricas
│   │   └── useBusinessMetrics.ts       ← hook com dados do Supabase
│   ├── clients/                ← (futuro) lógica de clientes
│   ├── pets/                   ← (futuro) lógica de pets
│   ├── services/               ← (futuro) catálogo de serviços
│   └── professionals/          ← (futuro) gestão de veterinários
├── shared/
│   ├── config/
│   │   └── constants.ts        ← configurações centralizadas (NOVO)
│   └── utils/
│       └── validation.ts       ← schemas de validação (NOVO)
├── utils/
│   ├── scheduleOptimizer.ts    ← encaixe inteligente (criado na sessão anterior)
│   └── ...
├── hooks/                      ← hooks existentes (mantidos sem alteração)
├── components/                 ← componentes existentes (mantidos)
├── pages/                      ← páginas existentes (mantidas)
└── integrations/supabase/      ← client + types gerados (mantidos)
```

**Regra de compatibilidade:** todos os arquivos existentes continuam funcionando.
Novos módulos são adições, não substituições.

---

## 3. Fluxo Profissional Completo

```
1. PENDING          → Cliente solicita agendamento
2. CONFIRMED        → Admin confirma + define data/hora/veterinário
3. REMINDER_SENT    → Sistema marca que lembrete 24h foi enviado
4. CHECKED_IN       → Cliente/recepção registra check-in no dia
5. IN_PROGRESS      → Veterinário inicia o atendimento
6. COMPLETED        → Atendimento finalizado + histórico registrado
7. RETURN_SCHEDULED → (derivado) retorno agendado após conclusão
8. CANCELLED        → Cancelado em qualquer etapa (com motivo)
9. NO_SHOW          → Cliente não compareceu
```

### Máquina de Estados (transições válidas)

```
PENDING         → CONFIRMED | CANCELLED
CONFIRMED       → REMINDER_SENT | CHECKED_IN | CANCELLED | NO_SHOW
REMINDER_SENT   → CHECKED_IN | CANCELLED | NO_SHOW
CHECKED_IN      → IN_PROGRESS | CANCELLED
IN_PROGRESS     → COMPLETED | CANCELLED
COMPLETED       → RETURN_SCHEDULED  (opcional, não muda o registro original)
CANCELLED       → (terminal)
NO_SHOW         → (terminal)
RETURN_SCHEDULED→ (terminal, mas cria novo PENDING)
```

---

## 4. Métricas Empresariais

Calculadas em `businessMetrics.service.ts`, consumidas via `useBusinessMetrics.ts`:

- **Taxa de ocupação semanal**: `(agendamentos_confirmados / slots_totais) × 100`
- **Faturamento por hora**: `receita_total / horas_ocupadas`
- **Taxa de cancelamento**: `(cancelados / total_não_pendentes) × 100`
- **Horário mais rentável**: agrupamento por hora → soma de receita

---

## 5. Plano de Commits (GitHub Ready)

```bash
# Commit 1 — Tipos e enums
git commit -m "feat(types): add AppointmentStatus enum and flow types"

# Commit 2 — Constantes e validação
git commit -m "feat(shared): add centralized constants and validation schemas"

# Commit 3 — Serviço de fluxo
git commit -m "feat(appointments): add appointmentFlow service with state machine"

# Commit 4 — Hook de fluxo
git commit -m "feat(appointments): add useAppointmentFlow hook"

# Commit 5 — Métricas
git commit -m "feat(metrics): add businessMetrics service and useBusinessMetrics hook"

# Commit 6 — Docs
git commit -m "docs: add ARCHITECTURE.md and update README with new structure"
```

---

## 6. Próximos Passos — Evolução para IA Preditiva

| Fase | Funcionalidade | Tecnologia sugerida |
|------|---------------|---------------------|
| **Curto prazo** | Notificações automáticas de lembrete | Supabase Edge Functions + pg_cron |
| **Médio prazo** | Predição de no-show por histórico | Regressão logística simples (dados do próprio banco) |
| **Médio prazo** | Sugestão de horário por perfil de cliente | `scheduleOptimizer` + histórico de preferências |
| **Longo prazo** | Análise de saúde preventiva por raça/idade | Modelo de ML treinado em `pet_admin_history` |
| **Longo prazo** | Chatbot de triagem | OpenAI API via Supabase Edge Functions |

---

## 7. Justificativas Técnicas

**Por que TypeScript enum ao invés de `as const`?**
O `AppointmentStatus` usa `as const` (não `enum` nativo do TS) para compatibilidade
com JSON e Supabase sem serialização extra.

**Por que serviços como funções puras e não classes?**
Tree-shaking mais eficiente; alinha com o padrão já usado em `scheduleOptimizer.ts`.
Classes adicionariam complexidade sem benefício real neste stack.

**Por que manter hooks em `/hooks` ao invés de mover para `/modules`?**
Hooks existentes têm imports consolidados em todo o projeto. Criar novos hooks
em `/modules` e manter os antigos em `/hooks` garante zero breaking changes.
