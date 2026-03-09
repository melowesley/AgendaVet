# AgentVet Clinical Copilot - Variáveis de Ambiente

Este arquivo documenta as variáveis necessárias para o funcionamento do Vet Copilot.
Copie estas variáveis para seu `.env.local`

## Variáveis Obrigatórias

### Supabase (já deve existir)
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

**Importante:** A `SUPABASE_SERVICE_ROLE_KEY` é necessária para as tools do copilot acessarem dados com privilégios elevados (bypass RLS).

### AI SDK / Modelos de IA

#### Opção 1: Anthropic (Claude) - Recomendado
```
ANTHROPIC_API_KEY=sk-ant-api03-sua-chave-aqui
```

#### Opção 2: OpenAI
```
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

#### Opção 3: Outros provedores (Google, Mistral, etc.)
```
GOOGLE_GENERATIVE_AI_API_KEY=sua-chave-gemini-aqui
MISTRAL_API_KEY=sua-chave-mistral-aqui
```

## Configuração no Copilot

O modelo padrão configurado em `/app/api/vet-copilot/route.ts` é:
```typescript
model: anthropic('claude-sonnet-4-20250514')
```

Para usar outro modelo, altere no arquivo ou adicione uma variável:
```
COPILOT_MODEL_PROVIDER=anthropic  # ou openai, google, etc.
COPILOT_MODEL_NAME=claude-sonnet-4-20250514
```

## Como obter as chaves

### Supabase Service Role Key
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em Project Settings → API
4. Copie a "service_role key" (não confunda com anon key!)

### Anthropic API Key
1. Acesse: https://console.anthropic.com
2. Crie uma conta ou faça login
3. Vá em API Keys → Create Key
4. Copie a chave gerada

### OpenAI API Key
1. Acesse: https://platform.openai.com
2. Vá em API Keys → Create new secret key
3. Copie a chave gerada

## Segurança

⚠️ **ATENÇÃO:**
- NUNCA commite o arquivo `.env.local`
- A SERVICE_ROLE_KEY tem acesso total ao banco - mantenha-a segura
- Use diferentes chaves para desenvolvimento e produção
- Configure limites de gastos na console do provedor de IA

## Testando a Configuração

Após configurar, teste o copilot:

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:3000/vet-copilot
# Selecione um paciente e envie uma mensagem
```

Se aparecer erro "Missing API key", verifique se a variável correta está definida.

## Troubleshooting

### Erro: "Missing API key"
- Verifique se a variável está no `.env.local`
- Reinicie o servidor Next.js após alterar o .env
- Confirme o nome da variável (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)

### Erro: "Cannot access Supabase"
- Verifique SUPABASE_SERVICE_ROLE_KEY
- Confirme se a URL está correta
- Verifique se o IP não está bloqueado no Supabase

### Erro: "Invalid API key"
- Verifique se copiou a chave completa
- Para Anthropic, a chave começa com `sk-ant-api03-`
- Para OpenAI, a chave começa com `sk-`
