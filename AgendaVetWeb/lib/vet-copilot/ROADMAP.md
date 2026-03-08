# AgentVet Clinical Copilot - Roadmap Técnico

## Visão Geral

Este documento descreve o roadmap de evolução do **AgentVet Clinical Copilot**, dividido em fases incrementais que agregam valor ao sistema de gestão veterinária.

---

## FASE 1 - MVP (Concluído) ✅

**Objetivo:** Lançar assistente clínico básico com integração ao sistema

### Funcionalidades Implementadas
- [x] System prompt especializado para medicina veterinária
- [x] 7 tools para acesso a dados do sistema
  - `get_pet_info` - Dados do paciente
  - `get_medical_history` - Histórico completo
  - `get_vaccination_status` - Status vacinal
  - `get_current_medications` - Medicações atuais
  - `get_recent_exams` - Exames recentes
  - `calculate_medication_dosage` - Calculadora de doses
  - `search_clinical_knowledge` - Busca em diretrizes
- [x] Endpoint API `/api/vet-copilot` com streaming e tools
- [x] Interface de chat com contexto de paciente
- [x] Seleção de pet com carregamento automático de contexto
- [x] Sugestões contextuais clínicas
- [x] Disclaimer de segurança obrigatório
- [x] Navegação no sidebar

### Entregáveis
- `/lib/vet-copilot/system-prompt.ts` - Prompt do agente
- `/lib/vet-copilot/tools.ts` - Tools para acesso a dados
- `/lib/vet-copilot/types.ts` - Tipagens
- `/app/api/vet-copilot/route.ts` - Endpoint da API
- `/components/vet-copilot/vet-copilot-content.tsx` - Interface
- `/app/vet-copilot/page.tsx` - Página do copilot

### Tempo Estimado: 2-3 dias ✅

---

## FASE 2 - RAG e Base de Conhecimento (Q2 2024)

**Objetivo:** Integrar base de conhecimento veterinário com busca semântica

### Funcionalidades Planejadas
- [ ] Implementar sistema de embeddings
  - [ ] Configurar vector store (Supabase pgvector)
  - [ ] Pipeline de chunking de documentos
  - [ ] Geração de embeddings via API
- [ ] Integrar diretrizes WSAVA/AAHA
  - [ ] Protocolos de vacinação
  - [ ] Diretrizes terapêuticas
  - [ ] Protocolos de emergência
- [ ] Adicionar tool `search_veterinary_literature`
- [ ] Citar fontes nas respostas
- [ ] Nível de evidência (alto/médio/baixo)

### Componentes Técnicos
- Novo schema no Supabase para vetores
- Pipeline de ingestão de documentos
- Serviço de embeddings (OpenAI/Claude)
- Tool de RAG no copilot

### Dependências
- Acesso a diretrizes WSAVA/AAHA em formato digital
- Serviço de embeddings com custo controlado

### Tempo Estimado: 2-3 semanas

---

## FASE 3 - Assistência Diagnóstica Avançada (Q3 2024)

**Objetivo:** Sugerir diagnósticos diferenciais com análise probabilística

### Funcionalidades Planejadas
- [ ] Sistema de diagnósticos diferenciais
  - [ ] Matriz de probabilidade por sintomas
  - [ ] Árvore de decisão clínica
  - [ ] Exames sugeridos por diagnóstico
- [ ] Análise de resultados de exames
  - [ ] Interpretação de hemograma
  - [ ] Interpretação de bioquímica
  - [ ] Interpretação de urina
  - [ ] Alertas de valores críticos
- [ ] Recomendação de investigação
  - [ ] Ordem de prioridade de exames
  - [ ] Justificativa clínica
  - [ ] Estimativa de custo

### Componentes Técnicos
- Banco de dados de diagnósticos veterinários
- Regras de interpretação laboratorial
- Algoritmos de priorização

### Dependências
- FASE 2 (RAG) concluída
- Base de dados de referência laboratorial

### Tempo Estimado: 3-4 semanas

---

## FASE 4 - Geração de Documentos (Q4 2024)

**Objetivo:** Automatizar geração de laudos e documentos clínicos

### Funcionalidades Planejadas
- [ ] Geração de laudos de exames
  - [ ] Templates por tipo de exame
  - [ ] Interpretação automática
  - [ ] Sugestão de conclusão
- [ ] Geração de receituários
  - [ ] Formatação padrão veterinária
  - [ ] Instruções de administração
  - [ ] Alertas de segurança
- [ ] Geração de anamnese estruturada
  - [ ] Perguntas guiadas por espécie
  - [ ] Formatação SOAP
- [ ] Sumário de alta
  - [ ] Instruções para tutor
  - [ ] Sinais de alerta
  - [ ] Retorno agendado

### Componentes Técnicos
- Engine de templates
- Parser de resultados laboratoriais
- Formatter de documentos

### Dependências
- FASE 2 e 3 concluídas
- Templates de documentos da clínica

### Tempo Estimado: 2-3 semanas

---

## FASE 5 - Análise de Imagens (Q1 2025)

**Objetivo:** Suporte a análise de imagens médicas (raio-x, ultrasom, etc.)

### Funcionalidades Planejadas
- [ ] Upload de imagens médicas
  - [ ] Raio-x
  - [ ] Ultrassonografia
  - [ ] Fotos de lesões
  - [ ] Endoscopia
- [ ] Análise assistida por IA
  - [ ] Detecção de anomalias
  - [ ] Sugestão de achados
  - [ ] Medidas estruturais
- [ ] Comparação temporal
  - [ ] Evolução de lesões
  - [ ] Acompanhamento de tratamento

### Componentes Técnicos
- Serviço de storage de imagens
- Pipeline de análise de imagens (Vision API)
- Sistema de comparação

### Dependências
- Integração com modelo multimodal (Claude/GPT-4 Vision)
- Storage para imagens médicas

### Tempo Estimado: 4-6 semanas

---

## FASE 6 - Predição e Alertas (Q2 2025)

**Objetivo:** Sistema proativo de alertas e predições clínicas

### Funcionalidades Planejadas
- [ ] Alertas de interações medicamentosas
  - [ ] Verificação em tempo real
  - [ ] Alertas de contra-indicações
  - [ ] Ajuste de doses por interação
- [ ] Predição de riscos
  - [ ] Risco anestésico
  - [ ] Risco cirúrgico
  - [ ] Prognóstico estimado
- [ ] Lembretes proativos
  - [ ] Vacinas próximas do vencimento
  - [ ] Retornos agendados
  - [ ] Acompanhamentos pendentes

### Componentes Técnicos
- Sistema de regras clínicas
- Algoritmos de scoring
- Motor de alertas

### Dependências
- FASE 3 concluída
- Base de dados de interações medicamentosas

### Tempo Estimado: 3-4 semanas

---

## FASE 7 - Integrações Externas (Q3 2025)

**Objetivo:** Conectar com serviços externos do ecossistema veterinário

### Funcionalidades Planejadas
- [ ] Integração com laboratórios
  - [ ] Recebimento automático de resultados
  - [ ] Interpretação automática
- [ ] Integração com imagem
  - [ ] Laudos de radiografia
  - [ ] Laudos de ultrassom
- [ ] Integração com telemedicina
  - [ ] Registro de consultas remotas
  - [ ] Compartilhamento de laudos

### Componentes Técnicos
- APIs de integração
- Webhooks
- Parsers específicos

### Dependências
- Parcerias com laboratórios
- APIs disponíveis

### Tempo Estimado: 4-6 semanas

---

## FASE 8 - Personalização Avançada (Q4 2025)

**Objetivo:** Adaptar o copilot ao perfil da clínica e do veterinário

### Funcionalidades Planejadas
- [ ] Perfis de especialidade
  - [ ] Clínica geral
  - [ ] Cirurgia
  - [ ] Dermatologia
  - [ ] Cardiologia
  - [ ] Oncologia
- [ ] Templates personalizáveis
  - [ ] Laudos da clínica
  - [ ] Receituários
  - [ ] Anamnese
- [ ] Preferências do veterinário
  - [ ] Modelo de IA preferido
  - [ ] Nível de detalhe
  - [ ] Idioma (pt/en/es)

### Componentes Técnicos
- Sistema de templates
- Preferências por usuário
- Especialidades configuráveis

### Dependências
- Sistema de usuários robusto
- Interface de configuração

### Tempo Estimado: 3-4 semanas

---

## Métricas de Sucesso

### Técnicas
- Tempo médio de resposta < 3 segundos
- Taxa de erro < 1%
- Uptime > 99.5%

### Adoção
- 80% dos veterinários usam semanalmente
- 50% usam em > 50% das consultas
- NPS > 40

### Impacto Clínico
- Redução de erros de medicação
- Melhoria na completude de anamnese
- Satisfação do tutor

---

## Considerações de Custo

### FASE 1 (MVP)
- Tokens de IA: ~$50-100/mês
- Infraestrutura existente

### FASE 2 (RAG)
- Tokens de IA: +$100-200/mês
- Embeddings: ~$50/mês
- Storage vetorial: ~$30/mês

### FASE 5+ (Multimodal)
- Tokens de IA: +$200-500/mês
- Storage de imagens: ~$50/mês
- Processamento de imagens: ~$100/mês

---

## Notas de Implementação

1. **Priorizar segurança** - Todas as fases devem manter disclaimer claro
2. **Feedback loop** - Coletar feedback dos veterinários em cada fase
3. **Compliance** - Manter conformidade com LGPD e CFMV
4. **Documentação** - Atualizar ARCHITECTURE.md a cada fase
5. **Testes** - Testes clínicos com veterinários antes de cada release

---

**Última atualização:** Março 2026  
**Próxima revisão:** Após conclusão da FASE 2
