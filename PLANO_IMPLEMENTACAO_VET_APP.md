# Plano de Implementação: Vet-App e desvinculação do Expo Go

## 1. Como funciona a lógica dos apps (Tutor e Vet)

### Visão geral

Os dois apps (Tutor e Vet) e o **web** usam o **mesmo backend**: **Supabase** (Auth + Postgres). Não existe “banco do web” separado — tudo é um único projeto Supabase. A “migração do banco do web para o Vet-App” na prática significa: **garantir que o Vet-App mobile use as mesmas tabelas e fluxos que o web**, o que já acontece hoje. O que falta é **migrar as funcionalidades e telas do painel web** para o app.

---

### AgendaVet-Tutor-App (app do tutor)

| Aspecto | Detalhes |
|--------|----------|
| **Auth** | Login/cadastro via Supabase Auth; sessão persistida com `AsyncStorage`. |
| **Rotas** | `(tabs)`: Meus Pets, Agendamentos, Perfil; `pet-details/[id]`; `login`. |
| **Dados** | `profiles`, `pets`, `appointment_requests`, `pet_vaccines`, `pet_exams`, `pet_observations`, `pet_prescriptions`, `pet_weight_records`, `pet_pathologies`, `pet_hospitalizations`. |
| **Fluxos** | Listar pets do usuário; solicitar agendamento (`appointment_requests`); ver detalhes do pet (vacinas, exames, observações, etc.). |

---

### AgendaVet-Vet-App (app do veterinário)

| Aspecto | Detalhes |
|--------|----------|
| **Auth** | Login via Supabase; verificação de admin (role) para acessar o app. |
| **Rotas** | `(tabs)`: Agenda do Dia, Pacientes, Prontuário, Perfil; `pet/[id]` (ficha do pet); `login`. |
| **Dados** | Mesmas tabelas do web: `appointment_requests`, `profiles`, `pets`, `pet_services`, `pet_admin_history`, `services`, etc. |
| **Já no app** | Agenda do dia (pedidos + confirmar/cancelar/check-in/concluir), lista de pacientes, adicionar pet, tela de prontuário (lista de pets), ficha do pet com timeline de serviços. |
| **Hooks** | `useAppointmentRequests`, `usePets`, `usePetTimeline` — já conversam com Supabase. |

Ou seja: a **lógica de negócio e banco** já está alinhada; o que falta é **replicar no mobile** todas as telas e fluxos que existem no painel web (diálogos de consulta, receita, vacina, peso, exames, etc.).

---

## 2. Desvincular do Expo Go (usar build nativo)

Hoje os projetos usam `expo start` e rodam no **Expo Go**. Para ter um app instalável e independente (e, se quiser, usar libs nativas), é preciso usar **development build** e/ou **EAS Build**.

### Passos para desvincular do Expo Go

1. **Instalar EAS CLI** (se ainda não tiver):
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Criar `eas.json`** na raiz do **AgendaVet-Vet-App** (e depois repetir para o Tutor-App se quiser):
   ```json
   {
     "cli": { "version": ">= 3.0.0" },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "android": { "buildType": "apk" },
         "ios": { "simulator": false }
       },
       "production": {
         "autoIncrement": true
       }
     },
     "submit": {
       "production": {}
     }
   }
   ```

3. **Configurar plugins nativos no `app.json`** (Expo já usa `expo-router`; não é obrigatório adicionar mais nada só para “sair” do Expo Go).

4. **Gerar o primeiro build**:
   - **Android (APK para teste):**
     ```bash
     cd AgendaVet-Vet-App
     eas build --profile preview --platform android
     ```
   - **iOS (simulador ou dispositivo):**
     ```bash
     eas build --profile development --platform ios
     ```

5. **Rodar em desenvolvimento com o build nativo** (em vez do Expo Go):
   ```bash
   npx expo start --dev-client
   ```
   O app instalado (development build) abrirá no lugar do Expo Go.

6. **Variáveis de ambiente**: usar **EAS Secrets** para `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` nos builds EAS, ou um `.env` no build local (nunca commitar chaves).

Resultado: o Vet-App (e o Tutor-App) passam a rodar em **build nativo**, sem depender do Expo Go.

---

## 3. “Migrar o banco do web” para o Vet-App

O **banco já é um só** (Supabase). O que se migra é **funcionalidade e fluxo**:

- **Web (admin/vet):** `src/modules/vet/` — Dashboard com abas (patients, tutors, calendar, requests, analytics, users, services), ficha do pet com dezenas de diálogos (consulta, receita, vacina, peso, exame, observações, patologia, internação, documento, vídeo, óbito, etc.) e exportação em PDF.
- **Vet-App (mobile):** já tem agenda do dia, pacientes, prontuário e ficha do pet com timeline; **não** tem os CRUDs completos nem as abas de calendário, analytics, usuários, serviços.

Portanto, o “plano de migração” abaixo é um **plano para levar todas as funcionalidades e fluxos do web para o Vet-App**, mantendo o mesmo banco (Supabase).

---

## 4. Plano de implementação: migrar funcionalidades e fluxos do web para o Vet-App

### Fase 0: Preparação (banco e ambiente)

| # | Tarefa | Detalhe |
|---|--------|--------|
| 0.1 | Tipagem Supabase no Vet-App | Copiar ou gerar tipos a partir de `src/core/integrations/supabase/types.ts` para o Vet-App (ex.: `lib/supabase-types.ts`) e tipar o cliente Supabase. |
| 0.2 | Variáveis de ambiente | Garantir `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` em todos os ambientes (dev, EAS). |
| 0.3 | EAS + desvinculação Expo Go | Executar a seção 2 (criar `eas.json`, primeiro build, `expo start --dev-client`). |

---

### Fase 1: Auth e permissões

| # | Tarefa | Detalhe |
|---|--------|--------|
| 1.1 | useAdminCheck no Vet-App | Replicar a lógica de `src/modules/vet/hooks/useAdminCheck.ts` no Vet-App (leitura de `user_roles` / role admin). |
| 1.2 | Bloqueio de rotas | Se o usuário não for admin/vet, redirecionar para login ou tela “Sem permissão”. |

---

### Fase 2: Dashboard e abas (paridade com o web)

No web o Dashboard tem: **patients**, **tutors**, **calendar**, **requests**, **analytics**, **users**, **services**. No app já existem: Agenda do Dia, Pacientes, Prontuário, Perfil.

| # | Tarefa | Detalhe |
|---|--------|--------|
| 2.1 | Aba “Solicitações” | Equivalente à aba **requests** do web: lista de `appointment_requests` com filtros (pendente/confirmado/cancelado) e ações (aprovar, rejeitar, editar). Reaproveitar `useAppointmentRequests` e criar tela similar a `AppointmentRequestsTable`. |
| 2.2 | Aba “Calendário” | Equivalente à **calendar**: vista semanal/mensal de agendamentos (leitura de `appointment_requests` + `services`). Pode ser uma tela nova ou substituir/estender a “Agenda do Dia”. Componente de referência: `CalendarView.tsx` (web). |
| 2.3 | Aba “Serviços” | Equivalente à **services**: listar e editar `services` (nome, preço, ativo). Referência: `ServicesManager.tsx`. |
| 2.4 | Aba “Clientes/Tutores” | Equivalente à **tutors**: lista de `profiles` (e contagem de pets). Referência: `TutorsListTab.tsx`. |
| 2.5 | Analytics (opcional) | Equivalente à **analytics**: métricas (agendamentos por período, faturamento por serviço). Referência: `AnalyticsDashboard.tsx` e `businessMetrics.service.ts`. |
| 2.6 | Gestão de usuários (opcional) | Equivalente à **users**: lista de admins, auditoria. Referência: `UserManagement.tsx`. |

---

### Fase 3: Ficha do pet (prontuário completo)

No web, a ficha do pet (`AdminPetProfile` / `PetProfile`) tem abas e vários diálogos de CRUD. No app já existe `app/pet/[id].tsx` com timeline.

| # | Tarefa | Detalhe |
|---|--------|--------|
| 3.1 | Abas na ficha do pet | Organizar por: Resumo, Timeline (já existe), Anamnese, Exame físico, Manejo, ou conforme o web. |
| 3.2 | Consulta (anamnese + conclusão) | Fluxo: selecionar atendimento → preencher anamnese (`anamnesis`) → concluir e atualizar `appointment_requests` (status completed). Referência: `ConsultaDialog.tsx`, `petAdminHistory`. |
| 3.3 | Receita | CRUD em `pet_prescriptions`. Referência: `ReceitaDialog.tsx`. |
| 3.4 | Vacina | CRUD em `pet_vaccines`. Referência: `VacinaDialog.tsx`. |
| 3.5 | Peso | CRUD em `pet_weight_records`. Referência: `PesoDialog.tsx`. |
| 3.6 | Exame | CRUD em `pet_exams`. Referência: `ExameDialog.tsx`. |
| 3.7 | Observações | CRUD em `pet_observations`. Referência: `ObservacoesDialog.tsx`. |
| 3.8 | Patologia/Diagnóstico | CRUD em `pet_pathologies`. Referência: `PatologiaDialog.tsx`, `DiagnosticoDialog.tsx`. |
| 3.9 | Internação | CRUD em `pet_hospitalizations`. Referência: `InternacaoDialog.tsx`. |
| 3.10 | Documentos | CRUD em `pet_documents`. Referência: `DocumentoDialog.tsx`. |
| 3.11 | Fotos | CRUD em `pet_photos`. Referência: `FotosDialog.tsx` (no mobile pode usar `expo-image-picker` + upload para Storage). |
| 3.12 | Vídeo | CRUD em `pet_videos`. Referência: `VideoDialog.tsx`. |
| 3.13 | Outros tipos de atendimento | Retorno, Cirurgia, Avaliação cirúrgica, Banho e tosa, Óbito. Referência: `RetornoDialog`, `CirurgiaDialog`, `AvaliacaoCirurgicaDialog`, `BanhoTosaDialog`, `ObitoDialog`. Cada um atualiza `appointment_requests` e/ou tabelas específicas. |
| 3.14 | Histórico administrativo | Garantir que toda ação de CRUD registre em `pet_admin_history` (como no web em `petAdminHistory.ts`), para a timeline continuar correta. |

Implementação sugerida no mobile: **um fluxo “Adicionar registro”** na ficha do pet que abre um menu (Consulta, Receita, Vacina, Peso, etc.) e, para cada tipo, uma tela/modal com os campos equivalentes aos do web, usando os mesmos `insert`/`update` no Supabase.

---

### Fase 4: Fluxos de agendamento e atendimento

| # | Tarefa | Detalhe |
|---|--------|--------|
| 4.1 | Gerenciar pedido (data/hora/serviço) | Equivalente a `ManageRequestDialog`: editar `scheduled_date`, `service_id`, observações do `appointment_requests`. |
| 4.2 | Atendimento rápido (sem pedido prévio) | Equivalente a `AttendanceTypeDialog` / “Atendimento avulso”: criar pet e/ou appointment e abrir direto na ficha para registrar consulta/receita/etc. |
| 4.3 | Otimizador de agenda (opcional) | Se usar no web: `useScheduleOptimizer` / `scheduleOptimizer.ts` — sugerir horários. Pode ser uma melhoria posterior no app. |

---

### Fase 5: Exportação e relatórios (opcional)

| # | Tarefa | Detalhe |
|---|--------|--------|
| 5.1 | PDF no mobile | No web: `exportReceitaPdf`, `exportAppointmentPdf`, `exportPetRecordPdf`. No React Native pode usar libs como `react-native-print` ou gerar HTML e compartilhar como PDF. Implementar pelo menos “Compartilhar ficha do pet” e “Compartilhar receita”. |

---

### Fase 6: Testes e ajustes

| # | Tarefa | Detalhe |
|---|--------|--------|
| 6.1 | Testes manuais | Percorrer todos os fluxos no app (agenda, solicitações, pacientes, ficha do pet, cada tipo de registro) e comparar com o web. |
| 6.2 | RLS e segurança | Garantir que as políticas RLS do Supabase permitam as mesmas operações que o web (admin/vet). |
| 6.3 | Performance | Listas longas: paginação ou virtualização; cache com React Query já em uso. |

---

## 5. Ordem sugerida de implementação

1. **Fase 0** (tipagem, env, EAS / sair do Expo Go).  
2. **Fase 1** (admin check e proteção de rotas).  
3. **Fase 2.1 e 2.2** (Solicitações e Calendário) — maior impacto no dia a dia.  
4. **Fase 3** (ficha do pet) — por partes: primeiro Consulta + Receita + Peso + Observações; depois Vacina, Exame, Patologia, Internação, Documento, Fotos, Vídeo; por último Retorno, Cirurgia, Óbito, etc.  
5. **Fase 2.3 a 2.6** (Serviços, Tutores, Analytics, Users) conforme prioridade.  
6. **Fase 4** (gerenciar pedido, atendimento avulso).  
7. **Fase 5 e 6** (PDF, testes, RLS).

---

## 6. Resumo

- **Tutor e Vet:** mesma lógica de auth e mesmo banco (Supabase); o Vet-App já consome as mesmas tabelas que o web.  
- **Desvincular do Expo Go:** usar EAS Build + development build e rodar com `expo start --dev-client`.  
- **“Migrar o banco do web para o Vet-App”:** na prática = **migrar todas as funcionalidades e fluxos do painel web** para o Vet-App; o banco já é compartilhado.  
- Este plano cobre todas as funcionalidades e fluxos do web a serem migrados para o Vet-App, em fases, com referências aos componentes e tabelas existentes.
