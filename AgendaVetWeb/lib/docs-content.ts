/**
 * Conteúdo dos guias do AgendaVet em formato Markdown
 * Usado pela página /guia para renderização dinâmica
 */

export const GUIA_AGENDAVET = `
# AgendaVet — Guia do Fundador

## Visão Geral

O AgendaVet é um sistema veterinário completo para gestão de fichas clínicas, histórico de procedimentos e portal do cliente. Desenvolvido com tecnologia de ponta para clínicas veterinárias modernas.

## O Produto

O AgendaVet resolve o principal problema das clínicas veterinárias: a fragmentação do histórico clínico dos animais e a falta de comunicação com os tutores.

### Funcionalidades Principais

- **Painel Administrativo** — Dashboard completo para gestão da clínica
- **Prontuário Digital** — Ficha clínica completa com 17 módulos de registro
- **Timeline Unificada** — Histórico cronológico de todos os procedimentos
- **Portal do Tutor** — Acesso web e app para acompanhamento do pet
- **App do Veterinário** — Acesso mobile para atendimento em campo
- **IA Integrada** — Assistente clínico com Gemini e DeepSeek
- **Agendamento Inteligente** — Sistema com encaixe automático
- **PWA** — Instalável como app em qualquer dispositivo

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend Web | Next.js 16 + TypeScript + Tailwind |
| App Mobile | Expo / React Native |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| IA | Google Gemini 2.0 + DeepSeek V3/R1 |
| Deploy | Vercel (Web) + EAS (Mobile) |

## Módulos Clínicos

Todos os 17 módulos estão operacionais e integrados ao histórico unificado:

1. **Consulta** — Anamnese completa
2. **Avaliação Cirúrgica** — Pré-operatório
3. **Cirurgia** — Registro cirúrgico
4. **Retorno** — Consultas de acompanhamento
5. **Peso** — Controle de peso corporal
6. **Patologia** — Condições crônicas
7. **Documento** — Anexos e arquivos
8. **Exame** — Laboratoriais e de imagem
9. **Fotos** — Galeria fotográfica
10. **Vacina** — Vacinação e aplicações
11. **Receita** — Receituários / prescrições
12. **Observações** — Notas gerais
13. **Vídeo** — Gravações e vídeos
14. **Internação** — Hospitalização
15. **Diagnóstico** — Diagnósticos registrados
16. **Banho e Tosa** — Serviços de estética
17. **Óbito** — Registro de falecimento

## Fluxo de Atendimento

\`\`\`
PENDING → CONFIRMED → REMINDER_SENT → CHECKED_IN → IN_PROGRESS → COMPLETED
\`\`\`

## Banco de Dados

O Supabase gerencia toda a persistência com RLS (Row Level Security):
- **Admins** têm acesso total
- **Tutores** visualizam apenas seus próprios pets

## Roadmap

- [x] Sistema de agendamento com máquina de estados
- [x] 17 módulos clínicos operacionais
- [x] Timeline unificada com deduplicação
- [x] Portal do tutor web
- [x] PWA instalável
- [x] IA Híbrida (Gemini + DeepSeek)
- [x] Sistema RAG com memória clínica
- [ ] App nativo iOS/Android (em desenvolvimento)
- [ ] Integração com laboratórios
- [ ] Telemedicina veterinária
- [ ] Multi-clínica (SaaS)

---

*AgendaVet — Construindo o futuro da medicina veterinária*
`;

export const GUIA_IA_ENGENHARIA = `
# AgendaVet — Engenharia de IA

## Arquitetura de IA Híbrida

O AgendaVet implementa um motor de IA que alterna inteligentemente entre múltiplos modelos dependendo da especialidade clínica requerida.

## Modelos Disponíveis

### Modelos Gratuitos

| Modelo | Especialidade | Uso |
|--------|--------------|-----|
| DeepSeek R1 | Raciocínio Clínico | Diagnóstico diferencial |
| Gemini 2.0 Flash | Emergências | Triagem rápida |
| Gemini 2.5 Flash | Análise Laboratorial | Interpretação de exames |
| Gemini 1.5 Flash | Medicina Preventiva | Vacinas e wellness |

### Modelos Premium

| Modelo | Especialidade | Uso |
|--------|--------------|-----|
| Gemini 2.5 Pro | Pesquisa Veterinária | Literatura científica |
| Gemini 1.5 Pro | Terapia Intensiva | UTI e cuidados críticos |
| Claude Sonnet | Análise de Imagens | Radiografias e imagens |
| GPT-4o | Planejamento Cirúrgico | Procedimentos complexos |

## Sistema RAG (Retrieval-Augmented Generation)

O RAG permite que a IA "leia" o histórico completo do pet antes de responder:

\`\`\`
Pergunta do veterinário
        ↓
Busca vetorial no histórico (pgvector)
        ↓
Contexto clínico relevante
        ↓
Prompt enriquecido → Modelo IA
        ↓
Resposta contextualizada
\`\`\`

### Componentes do RAG

1. **Embeddings** — Histórico clínico convertido em vetores via pgvector
2. **Memória de Longo Prazo** — Padrões de prescrição e diagnóstico salvos
3. **Contexto Dinâmico** — Carrega apenas o histórico relevante para a consulta
4. **Aprendizado Contínuo** — Sistema aprende com os padrões da clínica

## Vet Copilot

O assistente principal do veterinário com acesso ao prontuário completo:

\`\`\`typescript
// Seleção inteligente de modelo por especialidade
const selectModel = (query: string): AIModel => {
  if (query.includes('cirurgia') || query.includes('anestesia'))
    return AI_MODELS.GPT_4O
  if (query.includes('exame') || query.includes('laboratório'))
    return AI_MODELS.GEMINI_2_5_FLASH
  if (query.includes('emergência') || query.includes('urgente'))
    return AI_MODELS.GEMINI_2_0_FLASH
  return AI_MODELS.DEEPSEEK_R1 // Default: raciocínio clínico
}
\`\`\`

## APIs Integradas

- **Google Gemini** — \`GEMINI_API_KEY\` — Modelos Gemini 1.5/2.0/2.5
- **DeepSeek** — \`DEEPSEEK_API_KEY\` — Modelos R1/V3
- **Kimi/Moonshot** — \`KIMI_API_KEY\` — Modelo alternativo
- **Supabase pgvector** — Armazenamento de embeddings

## Secretário IA

Automação que processa anotações rápidas do veterinário:

1. Veterinário fala/digita livremente
2. IA estrutura os dados nos campos corretos
3. Preview para revisão
4. Salvamento com um clique

## Segurança e Privacidade

- Dados clínicos nunca saem do Supabase do cliente
- Embeddings são gerados localmente quando possível
- API keys armazenadas em variáveis de ambiente (server-side only)
- RLS garante isolamento total por clínica

---

*Engenharia de ponta para a medicina veterinária do futuro*
`;
