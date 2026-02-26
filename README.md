# AgendaVet 🐾

Sistema veterinário para gestão de fichas clínicas, histórico de procedimentos e portal do cliente.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Fluxo Completo (Tutor → Pet → Consulta → Veterinário)](#fluxo-completo)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura do Projeto](#arquitetura-do-projeto)
- [Fluxo de Atendimento (Admin)](#fluxo-de-atendimento-admin)
- [Módulos Disponíveis](#módulos-disponíveis)
- [Histórico Unificado (Timeline)](#histórico-unificado-timeline)
- [PWA — Uso Offline e Instalação](#pwa--uso-offline-e-instalação)
- [Banco de Dados (Supabase)](#banco-de-dados-supabase)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Rodando Localmente](#rodando-localmente)
- [Migrations — Como Aplicar](#migrations--como-aplicar)
- [Estrutura de Pastas](#estrutura-de-pastas)

---

## Visão Geral

O AgendaVet é uma aplicação web/PWA para clínicas veterinárias. Possui:

- **Painel Admin** — cadastro de pets, agendamentos e registro completo de procedimentos
- **Portal do Cliente** — tutores podem visualizar o histórico do seu pet
- **Timeline Unificada** — todos os registros exibidos em ordem cronológica em uma única tela
- **PWA** — instalável como app no celular, com cache offline para as principais telas

---

## Fluxo Completo

Para instruções detalhadas de como o fluxo procede — desde o login do tutor, cadastro de pet, agendamento de consulta, até o atendimento pelo veterinário — consulte **[FLUXO.md](./FLUXO.md)**.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 + `vite-plugin-pwa` (Workbox) |
| Estilo | Tailwind CSS + shadcn/ui |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Roteamento | React Router v6 |
| Animações | Framer Motion |
| PDF | jsPDF |

---

## Arquitetura do Projeto

### Camadas da Aplicação

```
Componente React
    ↓  usa
Hook customizado    (equivalente ao Controller/Presenter)
    ↓  chama
Service function    (lógica de negócio pura, testável)
    ↓  chama
Supabase Client     (equivalente ao Repository/DAO)
    ↓
PostgreSQL + RLS    (segurança e políticas no banco)
```

> Esta é **Clean Architecture adaptada para frontend SaaS** — sem backend Node.js,
> usando Supabase como camada de dados e RLS como middleware de segurança.

---

### Estrutura de Pastas

```
src/
├── modules/                           ← Domínios de negócio (SaaS-ready)
│   ├── appointments/
│   │   ├── types.ts                   ← AppointmentRecord + tipos de fluxo
│   │   ├── appointmentFlow.service.ts ← Máquina de estados (9 etapas)
│   │   └── useAppointmentFlow.ts      ← Hook que orquestra o fluxo
│   └── metrics/
│       ├── businessMetrics.service.ts ← Cálculos puros de métricas
│       └── useBusinessMetrics.ts      ← Hook com dados do Supabase
├── shared/
│   ├── config/
│   │   └── constants.ts               ← Configurações centralizadas da clínica
│   └── utils/
│       └── validation.ts              ← Schemas de validação
├── utils/
│   ├── scheduleOptimizer.ts           ← Algoritmo de encaixe inteligente
│   └── __tests__/
│       └── scheduleOptimizer.test.ts  ← Testes do optimizer (13/13 passando)
├── components/
│   ├── admin/               ← Todos os diálogos de módulos veterinários
│   │   ├── AttendanceTypeDialog.tsx  ← Menu principal de escolha de módulo
│   │   ├── ConsultaDialog.tsx        ← Consulta clínica (formulário completo)
│   │   ├── DocumentoDialog.tsx       ← Anexo de documentos
│   │   ├── VacinaDialog.tsx          ← Vacinação e aplicações
│   │   ├── ExameDialog.tsx           ← Exames laboratoriais
│   │   ├── PesoDialog.tsx            ← Controle de peso
│   │   ├── ReceitaDialog.tsx         ← Receituários / prescrições
│   │   ├── InternacaoDialog.tsx      ← Internações
│   │   ├── PatologiaDialog.tsx       ← Patologias / condições crônicas
│   │   ├── ObservacoesDialog.tsx     ← Observações gerais
│   │   ├── DiagnosticoDialog.tsx     ← Diagnósticos
│   │   ├── BanhoTosaDialog.tsx       ← Serviços de banho e tosa
│   │   ├── ObitoDialog.tsx           ← Registro de óbito
│   │   ├── FotosDialog.tsx           ← Galeria de fotos
│   │   ├── VideoDialog.tsx           ← Vídeos e gravações
│   │   ├── AvaliacaoCirurgicaDialog.tsx
│   │   ├── CirurgiaDialog.tsx
│   │   ├── RetornoDialog.tsx
│   │   ├── ManageRequestDialog.tsx   ← Gerencia agendamentos + Encaixe Inteligente
│   │   ├── HistoryEntryDetailDialog.tsx ← Modal de detalhes da timeline
│   │   ├── PetAdminHistorySection.tsx   ← Seção de histórico dentro dos diálogos
│   │   └── petAdminHistory.ts           ← Utilitário: logPetAdminHistory()
│   └── ErrorBoundary.tsx
├── hooks/
│   ├── useScheduleOptimizer.ts ← Hook de encaixe inteligente (Supabase)
│   ├── usePetTimeline.ts    ← Agrega todos os registros em uma timeline
│   ├── usePetsList.ts
│   └── useAppointmentRequests.ts
├── pages/
│   ├── AdminDashboard.tsx   ← Lista de agendamentos / pets
│   ├── AdminPetProfile.tsx  ← Ficha do pet + timeline
│   ├── AdminAuth.tsx
│   └── ClientPortal.tsx
└── integrations/
    └── supabase/
        ├── client.ts        ← Instância do cliente Supabase
        └── types.ts         ← Tipos gerados pelo Supabase CLI
```

---

## Fluxo de Atendimento (Admin)

### Fluxo padrão (todos os módulos)

```
AdminPetProfile
  └── Botão "Atendimento Clínico"
        └── AttendanceTypeDialog (grade de 17 botões)
              └── [usuário clica em um módulo]
                    ├── isAttendance=true (consulta, cirurgia, retorno, aval. cirúrgica)
                    │     └── Cria registro em appointment_requests (status=confirmed)
                    │           └── Abre o Dialog do módulo com o request como prop
                    └── isAttendance=false (peso, documento, vacina, exame, etc.)
                          └── Abre o Dialog do módulo com petId + petName
```

### Dentro de cada Dialog

1. **Carrega registros existentes** via Supabase (`loadRecords` / `fetchData`)
2. **Usuário preenche o formulário** e clica em "Salvar"
3. **Salva na tabela primária** (`pet_documents`, `pet_exams`, `pet_vaccines`, etc.)
4. **Chama `logPetAdminHistory()`** → insere em `pet_admin_history` com:
   - `module` — identificador do módulo (`documento`, `vacina`, `exame`, ...)
   - `action` — `create` | `update` | `delete` | `procedure`
   - `title` — texto legível do que foi feito
   - `details` — objeto JSONB com todos os campos do formulário
   - `source_table` — tabela de origem (para rastreabilidade)
   - `source_id` — UUID do registro na tabela de origem (usado para deduplicação na timeline)
5. **Chama `onSuccess()`** → dispara `refetchTimeline()` na página pai
6. **Exibe toast** de confirmação

### Por que `source_id` é importante

O `usePetTimeline` faz consultas em paralelo em `pet_admin_history` E nas tabelas específicas.
O `source_id` evita duplicatas: se um registro já tem entrada no histórico, ele não aparece novamente via consulta direta da tabela.

---

## Módulos Disponíveis

| Módulo | Chave | Tabela Primária | isAttendance |
|---|---|---|---|
| Consulta | `consulta` | `anamnesis` | ✅ |
| Avaliação Cirúrgica | `avaliacao_cirurgica` | `appointment_requests.admin_notes` | ✅ |
| Cirurgia | `cirurgia` | `appointment_requests.admin_notes` | ✅ |
| Retorno | `retorno` | `appointment_requests.admin_notes` | ✅ |
| Peso | `peso` | `pet_weight_records` | ❌ |
| Patologia | `patologia` | `pet_pathologies` | ❌ |
| Documento | `documento` | `pet_documents` | ❌ |
| Exame | `exame` | `pet_exams` | ❌ |
| Fotos | `fotos` | `pet_photos` | ❌ |
| Aplicações / Vacina | `vacina` | `pet_vaccines` | ❌ |
| Receita | `receita` | `pet_prescriptions` | ❌ |
| Observações | `observacoes` | `pet_observations` | ❌ |
| Vídeo | `video` | `pet_videos` | ❌ |
| Internação | `internacao` | `pet_hospitalizations` | ❌ |
| Diagnóstico | `diagnostico` | `pet_pathologies` | ❌ |
| Banho e Tosa | `banho_tosa` | `pet_observations` | ❌ |
| Óbito | `obito` | `pet_observations` + `pets.notes` | ❌ |

> **isAttendance=true**: o sistema cria automaticamente um registro em `appointment_requests` antes de abrir o diálogo, para garantir rastreabilidade clínica.

---

## Histórico Unificado (Timeline)

### `usePetTimeline` — Fontes e Deduplicação

O hook agrega em uma única lista ordenada por data/hora:

1. **`pet_admin_history`** (fonte principal) — inclui `source_id`
2. **`appointment_requests`** — deduplicado via `details.appointment_id`
3. **Tabelas individuais** (fallback para registros sem histórico):
   - `pet_weight_records`, `pet_exams`, `pet_prescriptions`, `pet_vaccines`
   - `pet_hospitalizations`, `pet_observations`, `pet_pathologies`, `pet_documents`

**Algoritmo de deduplicação:**
- Constrói um `Set<string>` com todos os `source_id` encontrados no histórico
- Para cada tabela individual, ignora registros cujo `id` já está no Set

### `HistoryEntryDetailDialog`

Modal que aparece ao clicar em qualquer entrada da timeline.
Exibe: título, data, hora, responsável, status, descrição e todos os campos do JSONB `details` com rótulos legíveis em PT-BR.

---

## PWA — Uso Offline e Instalação

### Como instalar no celular

1. Acesse o sistema pelo Chrome/Safari no celular
2. Toque no ícone de compartilhar (iOS) ou nos três pontos (Android)
3. Selecione **"Adicionar à Tela Inicial"** ou **"Instalar App"**

### Estratégias de cache (Workbox)

| Tipo de Recurso | Estratégia | TTL |
|---|---|---|
| Assets estáticos (JS/CSS/fontes) | CacheFirst | 30 dias |
| API Supabase | NetworkFirst | 24h (fallback offline) |
| Navegação (SPA) | NetworkFirst + fallback `/index.html` | — |

### Offline

Com o PWA instalado, as telas já visitadas ficam disponíveis offline.
Operações de escrita (salvar registros) requerem conexão — são rejeitadas com mensagem de erro quando offline.

---

## Fluxo Profissional de Agendamento

O sistema implementa uma máquina de estados com 9 etapas, gerenciada pelo
`appointmentFlow.service.ts` + `useAppointmentFlow.ts`:

```
PENDING → CONFIRMED → REMINDER_SENT → CHECKED_IN → IN_PROGRESS → COMPLETED
                                                                       ↓
                                                             RETURN_SCHEDULED

(qualquer etapa não-terminal) → CANCELLED
(CONFIRMED / REMINDER_SENT)   → NO_SHOW
```

| Status | Descrição |
|--------|-----------|
| `pending` | Cliente solicitou — aguarda confirmação |
| `confirmed` | Admin confirmou com data/hora/vet |
| `reminder_sent` | Lembrete de 24h registrado |
| `checked_in` | Cliente chegou à clínica |
| `in_progress` | Veterinário iniciou o atendimento |
| `completed` | Atendimento concluído |
| `return_scheduled` | Retorno agendado (cria novo `pending`) |
| `cancelled` | Cancelado com motivo registrado |
| `no_show` | Não compareceu |

### Uso do hook de fluxo

```typescript
import { useAppointmentFlow } from '@/modules/appointments/useAppointmentFlow';

const { confirm, checkInClient, startAttendance, complete, cancel } =
  useAppointmentFlow({ onSuccess: refetch });

// Confirmar agendamento:
await confirm(appointmentId, 'pending', {
  scheduled_date: '2026-02-25',
  scheduled_time: '09:00',
  veterinarian: 'Dr. Silva',
});

// Concluir com retorno automático:
await complete(appointmentId, 'in_progress', {
  schedule_return: true,
  return_date: '2026-03-25',
});
```

---

## Métricas Empresariais

Calculadas por `businessMetrics.service.ts`, expostas via `useBusinessMetrics.ts`:

```typescript
import { useBusinessMetrics } from '@/modules/metrics/useBusinessMetrics';

const { metrics, fetchMetrics } = useBusinessMetrics();

await fetchMetrics({ startDate: subDays(new Date(), 7), endDate: new Date() });

// Retorno JSON:
{
  weekly_occupancy: {
    occupancy_rate: 73.5,      // % de ocupação
    occupied_slots: 26,
    total_slots: 35,
    by_day: [...]              // por dia da semana
  },
  revenue_per_hour: {
    revenue_per_hour: 45.80,   // R$/hora de expediente
    total_revenue: 4122.00,
    by_shift: { morning: {...}, afternoon: {...} }
  },
  cancellation_rate: {
    cancellation_rate: 8.3,    // % cancelados
    no_show_rate: 2.1,
    total_appointments: 48
  },
  peak_hours: [
    { hour: '09:00', revenue: 1240.00, appointments_count: 8 },
    ...
  ]
}
```

---

## Encaixe Inteligente

O `scheduleOptimizer.ts` sugere os 3 melhores horários para um novo agendamento:

- Buffer automático de 15 min entre atendimentos
- Compactação por turno (penaliza lacunas > 2h)
- Reserva de 1 slot coringa por turno (emergências)
- Score de eficiência 0–100 com reasoning explicativo
- Integrado ao `ManageRequestDialog` com UI "Encaixe Inteligente"

---

## Banco de Dados (Supabase)

### Como a aplicação se conecta ao banco

Não é preciso criar uma API separada. O projeto já está integrado ao Supabase:

1. **Cliente** — `src/integrations/supabase/client.ts` usa a URL e a chave pública do seu projeto.
2. **Variáveis** — No `.env` você define `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (valores em **Settings → API** no dashboard do Supabase).
3. **Uso no código** — Em qualquer componente, importe o cliente e use `supabase.from('nome_da_tabela').select()`, `.insert()`, `.update()`, etc. O Supabase expõe uma API REST/Realtime para as tabelas automaticamente.
4. **Tipos** — As tabelas são tipadas em `src/integrations/supabase/types.ts`. Ao criar uma tabela nova no banco (por migration ou pelo SQL Editor), adicione a definição correspondente em `types.ts` e use-a nos diálogos (ex.: `ObitoDialog` usa a tabela `mortes`).

Ou seja: o mesmo projeto Supabase que você configurou no dashboard é o que a aplicação usa. Basta manter o `.env` apontando para esse projeto e rodar as migrations na ordem indicada abaixo.

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `pets` | Cadastro de pets |
| `profiles` | Perfis de usuários (tutores e admins) |
| `user_roles` | Papéis: `admin` ou `user` |
| `appointment_requests` | Agendamentos e atendimentos clínicos |
| `anamnesis` | Formulário de consulta clínica |
| `pet_admin_history` | **Log central** de todas as ações administrativas |
| `pet_documents` | Documentos e anexos |
| `pet_exams` | Exames laboratoriais |
| `pet_vaccines` | Vacinações e aplicações |
| `pet_weight_records` | Controle de peso |
| `pet_prescriptions` | Receituários |
| `pet_observations` | Observações gerais (também usada por Banho/Tosa e Óbito) |
| `mortes` | Registros de óbito (data, causa, notas) |
| `pet_hospitalizations` | Internações |
| `pet_pathologies` | Patologias e diagnósticos |
| `pet_photos` | Fotos |
| `pet_videos` | Vídeos e gravações |

### RLS (Row Level Security)

- **Admins** têm acesso total (`FOR ALL`) em todas as tabelas
- **Tutores** têm acesso de leitura (`FOR SELECT`) apenas nos registros do seu próprio pet
- As políticas utilizam `USING` + `WITH CHECK` explícitos para garantir compatibilidade com todos os drivers

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

> No dashboard do Supabase (Settings → API), use a **anon public** key como valor de `VITE_SUPABASE_ANON_KEY`. O projeto já usa o cliente Supabase; não é necessária nenhuma API extra.

---

## Rodando Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Visualizar build de produção
npm run preview
```

---

## Migrations — Como Aplicar

As migrations ficam em `supabase/migrations/`. Para aplicar:

### Via Supabase Dashboard (recomendado)

1. Acesse [app.supabase.com](https://app.supabase.com) → seu projeto
2. Vá em **SQL Editor**
3. Cole o conteúdo de cada migration em ordem cronológica e execute

### Ordem de execução

```
20260204162512_*.sql   ← Schema base
20260205205744_*.sql   ← Ajustes iniciais
20260209020913_*.sql   ← Serviços e agendamentos
20260210054901_*.sql   ← Roles e permissões
20260214100000_pet_records_complete.sql    ← Tabelas de registros veterinários
20260214173000_pet_admin_history.sql       ← Histórico administrativo (CRÍTICO)
20260216120000_fix_pet_prescriptions_table.sql
20260216130000_admin_insert_appointment_requests.sql
20260217000000_consolidate_rls_and_history.sql  ← RLS consolidado
20260218000000_mortes_table.sql                 ← Tabela de óbitos (mortes)
```

> ⚠️ **A migration `20260214173000_pet_admin_history.sql` é crítica.**
> Sem ela, nenhum registro aparecerá no histórico detalhado dos diálogos.

---

## Estrutura de Pastas Resumida

```
AgendaVet/
├── index.html              ← Meta tags PWA
├── vite.config.ts          ← Vite + PWA (Workbox)
├── package.json
├── src/
│   ├── App.tsx             ← Rotas
│   ├── main.tsx            ← Ponto de entrada
│   ├── index.css           ← Estilos globais / Tailwind
│   ├── components/
│   │   ├── admin/          ← Todos os diálogos veterinários
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── usePetTimeline.ts   ← Timeline unificada
│   │   └── usePetsList.ts
│   ├── pages/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminPetProfile.tsx ← Ficha + timeline
│   │   ├── AdminAuth.tsx
│   │   └── ClientPortal.tsx
│   └── integrations/supabase/
│       ├── client.ts
│       └── types.ts
└── supabase/migrations/    ← SQL para criar/atualizar o banco
```
