# AgentVet Clinical Copilot - Arquitetura Técnica

## Visão Geral

O **AgentVet Clinical Copilot** é um assistente de IA integrado ao AgendaVet que auxilia veterinários durante consultas, fornecendo suporte clínico baseado em evidências sem substituir o julgamento profissional.

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Chat UI    │  │ Consulta UI  │  │  Configurações   │  │
│  │  (Copilot)   │  │   (Context)  │  │    do Agent      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              API ROUTE - Next.js App Router                  │
│                    /api/vet-copilot                          │
│                                                              │
│  • Autenticação via JWT (Supabase Auth)                    │
│  • Context Builder (monta contexto clínico)                │
│  • Tool Executor (executa funções específicas)               │
│  • Stream Handler (gerencia streaming da resposta)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI SDK (Vercel)                          │
│                                                              │
│  • streamText() - streaming de respostas                   │
│  • tool() - definição de ferramentas                        │
│  • convertToModelMessages() - formatação                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Modelo de IA (via OpenRouter)                   │
│                                                              │
│  • anthropic/claude-sonnet-4  (recomendado)                │
│  • anthropic/claude-opus-4.5  (análises complexas)           │
│  • openai/gpt-4o             (alternativa)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │   pets   │ │ profiles │ │appointments│ │ pet_exams   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐                 │
│  │pet_vaccines│ │pet_observations│ │pet_prescriptions│       │
│  └──────────┘ └──────────┘ └──────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Funcionamento

### 1. Inicialização da Consulta

```
Veterinário seleciona pet na consulta
         │
         ▼
┌────────────────────────┐
│  ContextBuilder.gather() │
│  - Dados do pet        │
│  - Histórico médico    │
│  - Vacinas             │
│  - Exames recentes     │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  System Prompt montado │
│  + contexto clínico    │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  IA carregada com      │
│  contexto completo     │
└────────────────────────┘
```

### 2. Durante a Consulta

```
Veterinário faz pergunta ou solicitação
              │
              ▼
┌──────────────────────────────┐
│  Classificador de Intenção   │
│  - summarize_history         │
│  - differential_diagnosis    │
│  - suggest_exams            │
│  - calculate_dosage         │
│  - general_question         │
└──────────────────────────────┘
              │
     ┌────────┴────────┐
     │                 │
Precisa de dados?   Apenas IA?
     │                 │
     ▼                 ▼
┌──────────┐    ┌──────────────┐
│  Tool    │    │ Resposta     │
│  Call    │    │ direta       │
└──────────┘    └──────────────┘
     │
     ▼
┌──────────────────────┐
│  Executa query no    │
│  Supabase            │
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│  Retorna resultado   │
│  para IA             │
└──────────────────────┘
```

## Componentes Principais

### 1. VetCopilotContext (lib/vet-copilot/context.ts)

Responsável por coletar e formatar dados clínicos do pet selecionado.

**Funções:**
- `gatherPetContext(petId)` - Coleta todos os dados relevantes do pet
- `formatMedicalHistory(records)` - Formata histórico médico para o prompt
- `buildSystemPrompt(context)` - Monta o system prompt completo

### 2. VetCopilotTools (lib/vet-copilot/tools.ts)

Define as ferramentas que a IA pode usar para acessar dados.

**Tools disponíveis:**
- `get_pet_info` - Informações básicas do pet
- `get_medical_history` - Histórico médico completo
- `get_vaccination_status` - Status de vacinação
- `get_recent_exams` - Exames laboratoriais recentes
- `calculate_medication_dosage` - Calculadora de doses
- `search_clinical_knowledge` - Busca em base de conhecimento (RAG)

### 3. VetCopilotAPI (app/api/vet-copilot/route.ts)

Endpoint principal que orquestra a comunicação com a IA.

**Responsabilidades:**
- Autenticação do usuário
- Validação de permissões
- Montagem do contexto
- Streaming da resposta
- Execução de tools

### 4. VetCopilotUI (components/vet-copilot/)

Interface de chat especializada para o contexto clínico.

**Componentes:**
- `VetCopilotChat` - Interface de chat flutuante ou embutida
- `VetCopilotSuggestions` - Sugestões contextuais rápidas
- `VetCopilotSummary` - Resumo do histórico do pet
- `DosageCalculator` - Interface para cálculo de doses

## Segurança e Compliance

### 1. Não-substituição do Veterinário

```typescript
// Sempre incluir no system prompt:
const SAFETY_PREFIX = `
Você é um ASSISTENTE CLÍNICO, não um veterinário.
- SEMPRE apresente sugestões como "apoio clínico" ou "segunda opinião"
- NUNCA afirme diagnósticos definitivos
- SEMPRE incluir aviso: "A decisão final é do veterinário responsável"
- NUNCA prescreva medicamentos sem revisão profissional
`;
```

### 2. Evidência Baseada em Dados

```typescript
// Incluir fontes quando possível:
const EVIDENCE_GUIDELINE = `
Baseie suas sugestões em:
- Dados do prontuário do paciente atual
- Diretrizes da WSAVA (World Small Animal Veterinary Association)
- AAHA (American Animal Hospital Association) guidelines
- Literatura veterinária peer-reviewed
Indique nível de evidência quando aplicável (alto/médio/baixo)
`;
```

### 3. Auditoria e Logging

```typescript
// Registrar todas as interações:
interface CopilotInteraction {
  id: string;
  veterinarianId: string;
  petId: string;
  consultationId?: string;
  query: string;
  response: string;
  toolsUsed: string[];
  timestamp: Date;
  rating?: number; // Feedback do veterinário
}
```

## Escalabilidade

### Fase 1: MVP (Atual)
- Contexto manual na consulta
- 5 tools básicas
- Respostas streaming

### Fase 2: RAG (Próxima)
- Base de conhecimento vet integrada
- Busca semântica em artigos
- Vetores de embeddings

### Fase 3: Autonomous
- Sugestões proativas baseadas em sintomas
- Alertas de interações medicamentosas
- Predição de riscos

## Integração com Fluxo Existente

O Copilot se integra na página de consulta (`/medical-records`) através de:

1. **Botão flutuante** - Acesso rápido em qualquer tela
2. **Painel lateral** - Visão expandida durante consulta
3. **Contexto automático** - Pet selecionado é automaticamente carregado

```tsx
// Exemplo de uso na página de consulta
<VetCopilotProvider petId={selectedPet.id}>
  <MedicalRecordForm />
  <VetCopilotChat position="floating" />
</VetCopilotProvider>
```

## Modelos Recomendados

| Modelo | Uso | Custo | Latência |
|--------|-----|-------|----------|
| claude-sonnet-4 | Geral/consultas | Médio | Baixa |
| claude-opus-4.5 | Diagnósticos complexos | Alto | Média |
| gpt-4o | Alternativa econômica | Médio | Baixa |
| gpt-4o-mini | Tarefas simples | Baixo | Baixa |

## Próximos Passos

1. Implementar `VetCopilotContext`
2. Criar tools básicas
3. Atualizar endpoint `/api/chat` para `/api/vet-copilot`
4. Desenvolver UI especializada
5. Implementar logging de auditoria
