# AgendaVetWeb — Plano de Conclusão

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar o AgendaVetWeb resolvendo bloqueios críticos, finalizando prontuários/pets, implementando o módulo de Produtos e o módulo Financeiro básico.

**Architecture:** Next.js 16 App Router + Supabase + shadcn/ui + Recharts. Toda a lógica de dados passa por `lib/data-store.ts` (SWR) ou chamadas diretas ao `supabase` client. Componentes de módulos ficam em `components/<modulo>/` e páginas em `app/<modulo>/page.tsx`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Tailwind CSS, shadcn/ui, Recharts, date-fns, Zod (validação), react-quill-new (editor rich text)

---

## Mapa de Arquivos

| Arquivo | Ação | Motivo |
|---|---|---|
| `app/api/vet-copilot/route.ts` | Modificar | Remover bloqueio clinic_members obrigatório |
| `app/api/vet-copilot/actions/route.ts` | Modificar | Mesmo fix |
| `app/api/vet-copilot/conversations/route.ts` | Modificar | Mesmo fix |
| `app/api/vet-copilot/rag/route.ts` | Modificar | Mesmo fix |
| `app/api/vet-copilot/usage/route.ts` | Modificar | Mesmo fix |
| `components/admin/modules/cirurgia-dialog.tsx` | Modificar | Implementar save no Supabase (linha 72 TODO) |
| `components/admin/modules/cirurgia-dialog-bkp.tsx` | Deletar | Arquivo backup obsoleto |
| `components/admin/modules/cirurgia-dialog-temp.tsx` | Deletar | Arquivo temporário obsoleto |
| `components/admin/modules/consulta-dialog-fixed.tsx` | Deletar | Versão antiga obsoleta |
| `components/admin/modules/exame-dialog-old.tsx` | Deletar | Versão antiga obsoleta |
| `components/admin/modules/receita-dialog-old.tsx` | Deletar | Versão antiga obsoleta |
| `components/medical-records/medical-record-form-dialog-old.tsx` | Deletar | Versão antiga obsoleta |
| `components/pets/pet-detail-content-fixed.tsx` | Deletar | Versão antiga obsoleta |
| `components/pets/pet-detail-content-updated.tsx` | Deletar | Versão antiga obsoleta |
| `components/products-services/products-content.tsx` | Modificar | Implementar CRUD de produtos (hoje é placeholder) |
| `app/financeiro/page.tsx` | Criar | Nova página financeiro |
| `components/financeiro/financeiro-content.tsx` | Criar | Componente principal financeiro |
| `components/app-sidebar.tsx` | Modificar | Adicionar link Financeiro na navegação |
| `supabase/migrations/20260321_financeiro.sql` | Criar | Tabela financial_records |

---

## FASE 1 — Bloqueios Críticos

### Task 1: Fix Vet-Copilot — clinic_members blocker

**Problema:** As 5 rotas da API do Vet-Copilot retornam HTTP 403 se o usuário não tiver entrada na tabela `clinic_members` (que provavelmente não existe no Supabase). Isso torna o assistente IA completamente inacessível.

**Solução:** Tornar o `clinic_members` check gracioso — se não encontrar membership, continua com `clinicId = null` em vez de retornar 403. O assistente funciona sem contexto de clínica.

**Arquivos:**
- Modificar: `app/api/vet-copilot/route.ts:28-36`
- Modificar: `app/api/vet-copilot/actions/route.ts`
- Modificar: `app/api/vet-copilot/conversations/route.ts`
- Modificar: `app/api/vet-copilot/rag/route.ts`
- Modificar: `app/api/vet-copilot/usage/route.ts`

- [ ] **Step 1: Ler o route.ts principal para entender o contexto completo**

  ```bash
  # Arquivo: AgendaVet/app/api/vet-copilot/route.ts
  ```
  Confirme que a lógica é: busca clinic_members → se não encontra → retorna 403

- [ ] **Step 2: Modificar route.ts — tornar membership opcional**

  Substituir no `AgendaVet/app/api/vet-copilot/route.ts` (linhas 28-36):
  ```typescript
  // ANTES (bloqueia):
  const { data: membership } = await supabase
    .from('clinic_members')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single()
  if (!membership) {
    return Response.json({ error: 'No clinic membership' }, { status: 403 })
  }
  const clinicId = membership.clinic_id

  // DEPOIS (gracioso):
  const { data: membership } = await supabase
    .from('clinic_members')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .single()
  const clinicId = membership?.clinic_id ?? null
  ```

- [ ] **Step 3: Aplicar o mesmo fix nas outras 4 rotas**

  Nos arquivos `actions/route.ts`, `conversations/route.ts`, `rag/route.ts`, `usage/route.ts`:
  - Ler cada arquivo para entender contexto
  - Substituir o mesmo padrão: remover o `if (!membership) return 403`
  - Tornar `clinicId` opcional com `?? null`

- [ ] **Step 4: Verificar se o Vet-Copilot abre sem erro**

  Navegue para `/vet-copilot` no browser e envie uma mensagem de teste.
  Esperado: resposta da IA sem erro 403.

- [ ] **Step 5: Commit**

  ```bash
  cd AgendaVet-Surgical-Fix
  git add AgendaVet/app/api/vet-copilot/
  git commit -m "fix: tornar clinic_members opcional no vet-copilot para não bloquear usuários"
  ```

---

### Task 2: Limpeza de Arquivos Duplicados

**Problema:** Existem 8 arquivos -bkp, -temp, -old, -fixed, -updated que causam confusão de manutenção e podem estar sendo importados por engano.

**Arquivos:**
- Deletar: `components/admin/modules/cirurgia-dialog-bkp.tsx`
- Deletar: `components/admin/modules/cirurgia-dialog-temp.tsx`
- Deletar: `components/admin/modules/consulta-dialog-fixed.tsx`
- Deletar: `components/admin/modules/exame-dialog-old.tsx`
- Deletar: `components/admin/modules/receita-dialog-old.tsx`
- Deletar: `components/medical-records/medical-record-form-dialog-old.tsx`
- Deletar: `components/pets/pet-detail-content-fixed.tsx`
- Deletar: `components/pets/pet-detail-content-updated.tsx`

- [ ] **Step 1: Verificar que nenhum arquivo duplicado está sendo importado**

  ```bash
  grep -rn "cirurgia-dialog-bkp\|cirurgia-dialog-temp\|consulta-dialog-fixed\|exame-dialog-old\|receita-dialog-old\|medical-record-form-dialog-old\|pet-detail-content-fixed\|pet-detail-content-updated" AgendaVet/
  ```
  Esperado: zero resultados. Se houver imports, atualizar para o arquivo correto primeiro.

- [ ] **Step 2: Deletar os 8 arquivos**

  ```bash
  rm AgendaVet/components/admin/modules/cirurgia-dialog-bkp.tsx
  rm AgendaVet/components/admin/modules/cirurgia-dialog-temp.tsx
  rm AgendaVet/components/admin/modules/consulta-dialog-fixed.tsx
  rm AgendaVet/components/admin/modules/exame-dialog-old.tsx
  rm AgendaVet/components/admin/modules/receita-dialog-old.tsx
  rm AgendaVet/components/medical-records/medical-record-form-dialog-old.tsx
  rm AgendaVet/components/pets/pet-detail-content-fixed.tsx
  rm AgendaVet/components/pets/pet-detail-content-updated.tsx
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add -A
  git commit -m "chore: remover arquivos duplicados/obsoletos (-bkp, -temp, -old, -fixed)"
  ```

---

## FASE 2 — Completar Prontuários Médicos

### Task 3: Implementar save da Cirurgia no Supabase

**Problema:** `cirurgia-dialog.tsx` linha 72 tem `// TODO: Implementar salvamento na tabela medical_records`. O formulário de cirurgia é rico (anestesia, materiais, fármacos, sutura) mas não persiste nenhum dado.

**Referência:** `vacina-dialog.tsx` salva em `pet_vaccines`, `consulta-dialog.tsx` salva em `medical_records`. Cirurgia deve salvar em `medical_records` com `type: 'surgery'`.

**Arquivos:**
- Modificar: `components/admin/modules/cirurgia-dialog.tsx`

- [ ] **Step 1: Ler cirurgia-dialog.tsx completo**

  Leia o arquivo para entender:
  - Quais campos o formulário coleta (anestesia, materiais, fármacos, sutura, etc.)
  - Onde está o TODO na linha 72 (dentro de qual função)
  - Qual a assinatura do `onSave` prop

- [ ] **Step 2: Ler consulta-dialog.tsx para entender o padrão de save**

  Veja como `consulta-dialog.tsx` monta o objeto e chama `supabase.from('medical_records').insert()`
  Copie a estrutura base.

- [ ] **Step 3: Implementar o save na função handleSubmit do cirurgia-dialog**

  Estrutura do objeto a salvar:
  ```typescript
  const recordData = {
    pet_id: petId,
    type: 'surgery',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: `Cirurgia: ${formData.procedimento}`,
    notes: JSON.stringify({
      procedimento: formData.procedimento,
      anestesia: formData.anestesia,
      materiais: formData.materiais,
      farmacos: formData.farmacos,
      sutura: formData.sutura,
      duracao: formData.duracao,
      observacoes: formData.observacoes,
      // demais campos coletados pelo form
    }),
    veterinarian: userData?.user?.email || '',
    created_by: userData?.user?.id,
  }

  const { error } = await supabase
    .from('medical_records' as any)
    .insert([recordData] as any)

  if (error) throw error
  ```

- [ ] **Step 4: Adicionar toast de sucesso/erro e fechar dialog**

  Após o insert bem-sucedido:
  ```typescript
  toast({ title: 'Cirurgia registrada com sucesso!' })
  onOpenChange(false)
  // Chamar mutate() se o componente pai usar SWR
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add AgendaVet/components/admin/modules/cirurgia-dialog.tsx
  git commit -m "feat: implementar salvamento de cirurgia no Supabase (medical_records)"
  ```

---

## FASE 3 — Completar Módulo Produtos

### Task 4: Implementar CRUD de Produtos

**Problema:** `products-content.tsx` exibe apenas um placeholder "Módulo de Produtos em breve". A aba Serviços já está 100% funcional — Produtos segue o mesmo padrão.

**Referência:** `products-services-content.tsx` tem CRUD completo de serviços em Supabase. Copiar a estrutura para produtos.

**Arquivos:**
- Modificar: `components/products-services/products-content.tsx`

- [ ] **Step 1: Ler products-services-content.tsx completo**

  Entenda a estrutura: estado, fetchServices, handleSave, handleDelete, Dialog, formulário.

- [ ] **Step 2: Verificar se existe tabela de produtos no Supabase**

  ```bash
  grep -rn "products\|estoque\|inventory" AgendaVet/lib/supabase/types.ts | head -20
  ```
  Se existir tabela `products` ou `inventory`, usar. Se não, usar a mesma tabela `services` com `category: 'produto'` como workaround.

- [ ] **Step 3: Implementar products-content.tsx**

  Interface do produto:
  ```typescript
  interface Product {
    id: string
    name: string
    description?: string
    price?: number
    stock_quantity?: number
    unit?: string   // 'unidade', 'caixa', 'ml', 'kg'
    category?: string
    active?: boolean
    created_at?: string
  }
  ```

  O componente deve ter:
  - Lista de produtos com busca por nome
  - Botão "Novo Produto"
  - Dialog com formulário: nome, descrição, preço, quantidade em estoque, unidade, categoria
  - Ações: Editar e Excluir por produto
  - Loading state e empty state

- [ ] **Step 4: Conectar ao Supabase**

  ```typescript
  // Fetch
  const { data } = await supabase.from('products').select('*').order('name')

  // Insert/Update
  await supabase.from('products').insert([payload])
  await supabase.from('products').update(payload).eq('id', id)

  // Delete
  await supabase.from('products').delete().eq('id', id)
  ```

  Se a tabela não existir, usar `services` com filtro `category = 'produto'` temporariamente e adicionar nota de que SQL de migração é necessário.

- [ ] **Step 5: Commit**

  ```bash
  git add AgendaVet/components/products-services/products-content.tsx
  git commit -m "feat: implementar CRUD de produtos com Supabase"
  ```

---

## FASE 4 — Módulo Financeiro

### Task 5: Criar Migração SQL para financial_records

**Objetivo:** Criar tabela `financial_records` no Supabase para registrar receitas/despesas de cada atendimento.

**Arquivos:**
- Criar: `AgendaVet/supabase/migrations/20260321_financeiro.sql`

- [ ] **Step 1: Criar o arquivo SQL de migração**

  ```sql
  -- supabase/migrations/20260321_financeiro.sql

  create table if not exists public.financial_records (
    id uuid default gen_random_uuid() primary key,
    appointment_id uuid references public.appointment_requests(id) on delete set null,
    pet_id uuid references public.pets(id) on delete set null,
    profile_id uuid references public.profiles(id) on delete set null,
    type text not null check (type in ('receita', 'despesa')),
    category text not null,  -- 'consulta', 'vacina', 'cirurgia', 'produto', 'outro'
    description text,
    amount numeric(10,2) not null default 0,
    payment_method text check (payment_method in ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'outro')),
    status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
    due_date date,
    paid_at timestamp with time zone,
    notes text,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc', now()),
    updated_at timestamp with time zone default timezone('utc', now())
  );

  -- RLS
  alter table public.financial_records enable row level security;

  create policy "Authenticated users can manage financial records"
    on public.financial_records
    for all
    using (auth.uid() is not null);

  -- Índices
  create index if not exists financial_records_appointment_id_idx on public.financial_records(appointment_id);
  create index if not exists financial_records_created_at_idx on public.financial_records(created_at desc);
  create index if not exists financial_records_status_idx on public.financial_records(status);
  ```

- [ ] **Step 2: Aplicar a migração no Supabase**

  Instrução para o usuário:
  > Execute esse SQL no Supabase Studio → SQL Editor do seu projeto.

- [ ] **Step 3: Commit do SQL**

  ```bash
  git add AgendaVet/supabase/migrations/20260321_financeiro.sql
  git commit -m "feat(db): adicionar tabela financial_records para módulo financeiro"
  ```

---

### Task 6: Criar Componente Financeiro

**Objetivo:** Criar página `/financeiro` com visão de receitas, despesas, lançamentos e resumo mensal.

**Arquivos:**
- Criar: `AgendaVet/app/financeiro/page.tsx`
- Criar: `AgendaVet/components/financeiro/financeiro-content.tsx`
- Modificar: `AgendaVet/components/app-sidebar.tsx` (adicionar link)

- [ ] **Step 1: Criar app/financeiro/page.tsx**

  ```tsx
  'use client'

  import { AppLayout } from '@/components/app-layout'
  import { FinanceiroContent } from '@/components/financeiro/financeiro-content'

  export default function FinanceiroPage() {
    return (
      <AppLayout breadcrumbs={[{ label: 'Financeiro' }]}>
        <FinanceiroContent />
      </AppLayout>
    )
  }
  ```

- [ ] **Step 2: Criar components/financeiro/financeiro-content.tsx**

  O componente deve ter 3 abas:
  - **Resumo**: Cards de receita do mês, despesa, saldo, inadimplência. Gráfico de receita vs despesa (Recharts BarChart) dos últimos 30 dias.
  - **Lançamentos**: Tabela paginada de todos os registros financeiros com filtro por tipo (receita/despesa), status e período. Botão "Novo Lançamento".
  - **A Receber**: Lista de registros com `status = 'pendente'` ordenados por `due_date`.

  Estado principal:
  ```typescript
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null)
  const [filter, setFilter] = useState<'todos' | 'receita' | 'despesa'>('todos')
  ```

  Fetch:
  ```typescript
  const fetchRecords = async () => {
    const { data } = await supabase
      .from('financial_records')
      .select('*, pets(name), profiles(full_name)')
      .order('created_at', { ascending: false })
    setRecords(data || [])
  }
  ```

  Dialog de novo lançamento com campos:
  - Tipo (receita/despesa)
  - Categoria (consulta, vacina, cirurgia, produto, outro)
  - Descrição
  - Valor (R$)
  - Método de pagamento
  - Status (pendente/pago)
  - Data de vencimento
  - Paciente (select de pets — opcional)
  - Tutor (select de profiles — opcional)
  - Observações

- [ ] **Step 3: Adicionar Financeiro na sidebar**

  Ler `components/app-sidebar.tsx` para entender o padrão de navegação.
  Adicionar entrada após "Analytics":
  ```tsx
  {
    title: 'Financeiro',
    url: '/financeiro',
    icon: DollarSign,  // já importado ou adicionar
  }
  ```

- [ ] **Step 4: Verificar navegação**

  Abrir o app → verificar se o link "Financeiro" aparece na sidebar → clicar → página carrega com os 3 cards e tabela vazia.

- [ ] **Step 5: Commit**

  ```bash
  git add AgendaVet/app/financeiro/ AgendaVet/components/financeiro/ AgendaVet/components/app-sidebar.tsx
  git commit -m "feat: criar módulo financeiro com lançamentos, resumo e a receber"
  ```

---

## FASE 5 — Verificação Final

### Task 7: Verificação e Ajustes

- [ ] **Step 1: Verificar o build sem erros críticos**

  ```bash
  cd AgendaVet-Surgical-Fix/AgendaVet && npm run build 2>&1 | tail -30
  ```
  Esperado: build completo (pode ter warnings de TypeScript por causa do `ignoreBuildErrors: true`, mas não deve quebrar).

- [ ] **Step 2: Testar fluxos principais manualmente**

  - [ ] Login → Dashboard carrega
  - [ ] Pets → abrir um pet → aba Registros → clicar "Novo Registro" → selecionar Cirurgia → preencher → salvar → registro aparece na lista
  - [ ] Vet-Copilot → enviar mensagem → IA responde (sem erro 403)
  - [ ] Produtos & Serviços → aba Produtos → criar produto → aparece na lista
  - [ ] Financeiro → criar lançamento → aparece na tabela

- [ ] **Step 3: Commit final de ajustes**

  ```bash
  git add -A
  git commit -m "fix: ajustes finais de verificação"
  ```

---

## Ordem de Execução (Paralelizável)

```
PARALELO 1:                    PARALELO 2:
Task 1 (clinic_members)        Task 2 (limpeza duplicatas)
       ↓                              ↓
Task 3 (cirurgia save)         Task 4 (produtos CRUD)
       ↓
Task 5 (SQL financeiro)
       ↓
Task 6 (componente financeiro)
       ↓
Task 7 (verificação)
```

Tasks 1+2 são **totalmente independentes** → podem rodar em paralelo.
Tasks 3+4 são **independentes entre si** → podem rodar em paralelo.
Tasks 5+6+7 devem ser **sequenciais**.

---

## Resumo de Impacto

| Task | Impacto | Tempo Estimado |
|---|---|---|
| Fix clinic_members | Desbloqueia IA assistant | Baixo |
| Limpeza duplicatas | Reduz confusão de manutenção | Muito baixo |
| Cirurgia save | Completa prontuários 100% | Médio |
| Produtos CRUD | Completa módulo produtos | Médio |
| Módulo Financeiro | Nova feature de valor | Alto |
