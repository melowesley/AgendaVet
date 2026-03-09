# Chaves de API Necessárias para AgendaVet

## 🔑 Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e preencha com suas chaves:

```bash
cp .env.example .env.local
```

### 1. Supabase (Obrigatório)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Modelos de IA (Escolha pelo menos um)

#### Anthropic Claude (Recomendado)
- Vá para: https://console.anthropic.com/
- Crie uma conta e obtenha sua API Key
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

#### Google Gemini (Para modo clínico)
- Vá para: https://makersuite.google.com/app/apikey
- Crie uma API Key
```env
GOOGLE_API_KEY=AIza...
```

#### OpenAI
- Vá para: https://platform.openai.com/api-keys
- Crie uma API Key
```env
OPENAI_API_KEY=sk-proj-...
```

#### xAI Grok
- Vá para: https://console.x.ai/
- Crie uma API Key
```env
XAI_API_KEY=xai-...
```

#### DeepSeek (O que você pediu)
- Vá para: https://platform.deepseek.com/api_keys
- Crie uma API Key
```env
DEEPSEEK_API_KEY=sk-...
```

## 📋 Modelos Disponíveis

### Anthropic
- `anthropic/claude-opus-4.5` (Recomendado)
- `anthropic/claude-sonnet-4`
- `anthropic/claude-3-5-haiku`

### OpenAI
- `openai/gpt-4o`
- `openai/gpt-4o-mini`

### xAI
- `xai/grok-3`

### DeepSeek
- `deepseek/deepseek-chat`
- `deepseek/deepseek-coder`

### Google Gemini
- `gemini-1.5-pro` (Usado no modo clínico)

## 🚀 Como Usar

1. Preencha o `.env.local` com as chaves desejadas
2. Reinicie o servidor de desenvolvimento:
```bash
npm run dev
```
3. Acesse `/assistant` para configurar o modelo desejado
4. Use o chat para testar

## 🔧 Modos do Chat

### Modo Admin
- Usa qualquer modelo selecionado nas configurações
- Ideal para tarefas administrativas gerais
- Suporta todos os provedores

### Modo Clínico
- Usa Google Gemini por padrão
- Inclui ferramentas veterinárias
- Requer `GOOGLE_API_KEY`

## ⚠️ Importante

- Nunca compartilhe suas chaves de API
- Adicione `.env.local` ao `.gitignore`
- Em produção, use variáveis de ambiente do seu provedor de hosting
- Chaves do Supabase são obrigatórias para o funcionamento do app

## 🐛 Solução de Problemas

Se o chat não funcionar:
1. Verifique se as chaves estão corretas no `.env.local`
2. Confirme se o servidor foi reiniciado após as alterações
3. Verifique os logs do console para erros
4. Teste a API key diretamente com curl se necessário
