# Guia de Configuração do Supabase para AgendaVet

Este guia irá ajudá-lo a configurar corretamente o Supabase para armazenar os dados da sua aplicação AgendaVet.

## 🚀 Passos Iniciais

### 1. Criar Projeto Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Configure:
   - **Organization**: Sua organização
   - **Project Name**: AgendaVet (ou outro nome de sua preferência)
   - **Database Password**: Crie uma senha forte e anote-a
   - **Region**: Escolha a região mais próxima dos seus usuários
5. Aguarde a criação do projeto (pode levar alguns minutos)

### 2. Configurar Variáveis de Ambiente

No seu projeto AgendaVetWeb, crie ou edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Para obter essas chaves:

1. No dashboard do Supabase, vá para **Project Settings** > **API**
2. Copie os valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Executar Migrações do Banco de Dados

No SQL Editor do Supabase, execute os seguintes scripts em ordem:

#### Script 1: Setup Completo (se necessário)
```sql
-- Execute apenas se as tabelas não existirem
-- Use o arquivo: supabase/migrations/20260225100000_setup_completo_fresh.sql
```

#### Script 2: Adicionar CRMV aos Perfis
```sql
-- Use o arquivo: supabase/migrations/20260307100000_add_crmv_to_profiles.sql
```

#### Script 3: Módulo AI Copilot
```sql
-- Use o arquivo: supabase/migrations/20260307200000_ai_copilot_module.sql
```

### 4. Configurar Row Level Security (RLS)

O sistema já vem com políticas RLS configuradas, mas verifique se estão ativas:

```sql
-- Verificar se RLS está ativado nas tabelas principais
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pets', 'appointment_requests', 'user_roles');
```

### 5. Inserir Dados Iniciais

Execute o script `insert_admin.sql` para criar um usuário administrador:

```sql
-- Use o arquivo: supabase/insert_admin.sql
```

### 6. Configurar Autenticação

1. No dashboard Supabase, vá para **Authentication** > **Settings**
2. Configure os provedores de autenticação desejados:
   - Email/Senha (já ativado por padrão)
   - Google, Facebook, etc. (opcional)
3. Em **Site URL**, adicione: `http://localhost:3000` (desenvolvimento)
4. Em **Redirect URLs**, adicione:
   - `http://localhost:3000/auth/callback`
   - `https://seu-dominio.com/auth/callback` (produção)

## 🔧 Verificação e Testes

### Testar Conexão com o Supabase

Crie um arquivo de teste:

```javascript
// test-supabase-connection.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count')
    if (error) throw error
    console.log('✅ Conexão bem-sucedida!')
    console.log('Número de perfis:', data[0].count)
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message)
  }
}

testConnection()
```

Execute: `node test-supabase-connection.js`

### Verificar Tabelas

```sql
-- Listar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 🐛 Solução de Problemas Comuns

### Problema: "API keys não retornam dados"

**Possíveis causas e soluções:**

1. **RLS bloqueando acesso**
   ```sql
   -- Verificar políticas RLS
   SELECT * FROM pg_policies WHERE tablename = 'appointment_requests';
   ```

2. **Usuário não autenticado**
   - Verifique se o usuário está autenticado
   - Use `supabase.auth.getUser()` para verificar

3. **Permissões insuficientes**
   - Verifique se o usuário tem as roles necessárias
   - Use `public.has_role(user_id, 'admin')` para verificar

4. **URL ou chaves incorretas**
   - Verifique o arquivo `.env.local`
   - Confirme se as chaves estão corretas

### Problema: "Erro ao criar agendamento"

**Soluções:**

1. Verifique se a tabela `appointment_requests` existe
2. Confirme se as colunas necessárias existem
3. Verifique as políticas RLS para inserção

### Problema: "Dados não aparecem no calendário"

**Soluções:**

1. Verifique se há dados na tabela `appointment_requests`
2. Confirme se as datas estão no formato correto (YYYY-MM-DD)
3. Verifique o mapeamento no `data-store.ts`

## 📊 Estrutura das Tabelas Principais

### profiles
- `id` (UUID)
- `user_id` (UUID, referencia auth.users)
- `full_name` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### pets
- `id` (UUID)
- `name` (TEXT)
- `type` (TEXT) - species do pet
- `breed` (TEXT)
- `age` (TEXT)
- `weight` (TEXT)
- `user_id` (UUID)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)

### appointment_requests
- `id` (UUID)
- `user_id` (UUID)
- `pet_id` (UUID)
- `preferred_date` (DATE)
- `preferred_time` (TIME)
- `scheduled_date` (DATE)
- `scheduled_time` (TIME)
- `reason` (TEXT)
- `status` (TEXT)
- `notes` (TEXT)
- `veterinarian` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## 🔄 Backup e Restauração

### Backup
```sql
-- Exportar dados
pg_dump -h your-project.supabase.co -U postgres -d postgres > backup.sql
```

### Restauração
```sql
-- Importar dados
psql -h your-project.supabase.co -U postgres -d postgres < backup.sql
```

## 📱 Teste no Aplicativo

1. Inicie o aplicativo: `npm run dev`
2. Acesse `http://localhost:3000`
3. Faça login com um usuário criado
4. Teste as funcionalidades:
   - Criar pets
   - Criar agendamentos
   - Visualizar calendário
   - Gerenciar agendamentos

## 🚀 Deploy em Produção

1. Atualize as variáveis de ambiente no seu serviço de hosting
2. Configure as URLs de redirecionamento no Supabase
3. Ative o RLS em todas as tabelas
4. Monitore os logs para identificar problemas

## 📞 Suporte

Se você continuar enfrentando problemas:

1. Verifique os logs do Supabase em **Project Settings** > **Logs**
2. Use o console do navegador para identificar erros de JavaScript
3. Verifique a rede para ver se as requisições estão sendo enviadas corretamente

---

**Importante**: Mantenha suas chaves do Supabase seguras e nunca as exponha publicamente no código do cliente. Use variáveis de ambiente para armazená-las com segurança.
