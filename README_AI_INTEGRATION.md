# Integração de IA AgendaVet

Documentação das funcionalidades de Inteligência Artificial para o ecossistema AgendaVet.

## 🚀 Arquitetura
A integração utiliza um sistema dual-model:
- **Gemini (Google)**: Utilizado para respostas rápidas e interação geral.
- **DeepSeek (R1/Chat)**: Utilizado para raciocínio clínico complexo e diagnósticos diferenciais.

## 📁 Estrutura de Arquivos (App Vet)
- `lib/ai.ts`: Ponto de entrada principal.
- `lib/ai/`: Módulos especializados (Sintomas, Diagnóstico, Exames, Tratamento).
- `lib/prompts/`: Templates de prompts otimizados para medicina veterinária.
- `lib/analytics/`: Monitoramento de uso e performance.
- `lib/optimization/`: Gerenciamento de tokens, cache e rate limiting.

## 🔐 Segurança
As chaves de API são gerenciadas via variáveis de ambiente (`.env`).
- `EXPO_PUBLIC_GEMINI_API_KEY`
- `EXPO_PUBLIC_DEEPSEEK_API_KEY`

## 📊 Monitoramento
Todos os logs de uso são enviados para a tabela `ai_usage_logs` no Supabase para acompanhamento de custos e qualidade.

## 🧪 Testes
Os scripts de teste estão localizados na pasta `/tests` na raiz do projeto.
