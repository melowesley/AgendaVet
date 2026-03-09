# Restaurar o banco do Supabase do zero

Use este guia quando as tabelas foram excluídas ou o banco está vazio e precisa ser recriado.

## Passo a passo

### 1. Acesse o SQL Editor do Supabase

1. Vá em [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### 2. Execute a migration completa

1. Clique em **New query**
2. Copie todo o conteúdo do arquivo:
   ```
   supabase/migrations/20260225100000_setup_completo_fresh.sql
   ```
3. Cole no editor e clique em **Run** (ou Ctrl+Enter)

### 3. Verifique se deu certo

No **Table Editor**, confira se as tabelas foram criadas:

- `profiles` (com coluna `address`)
- `user_roles`
- `pets`
- `services` (com 8 serviços pré-cadastrados)
- `appointment_requests`
- `anamnesis`
- `pet_admin_history`
- `pet_services`
- `pet_weight_records`, `pet_pathologies`, `pet_documents`, `pet_exams`
- `pet_photos`, `pet_vaccines`, `pet_prescriptions`, `pet_observations`
- `pet_videos`, `pet_hospitalizations`, `mortes`
- `audit_logs`

### 4. Crie o primeiro usuário admin

1. Vá em **Authentication** → **Users**
2. Crie um usuário (ou use o cadastro do app)
3. Copie o **UUID** do usuário
4. No **SQL Editor**, rode:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('COLE_O_UUID_AQUI', 'admin');
```

### 5. Configure o .env

Garanta que o `.env` está correto:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

Os valores estão em **Settings** → **API** no dashboard do Supabase.

---

## O que a migration faz

- Cria todas as tabelas necessárias
- Configura RLS (Row Level Security) e políticas de acesso
- Cria o trigger para perfis automáticos ao cadastrar usuário
- Insere os 8 serviços padrão (Consulta, Vacinação, etc.)
- Inclui a coluna `address` em `profiles`
- Cria a tabela `pet_services` para serviços prestados no prontuário

## Problemas comuns

**Erro "relation already exists"**  
A migration usa `IF NOT EXISTS`, então é segura rodar mais de uma vez. Se alguma tabela já existir, ela será mantida.

**Erro ao criar admin**  
Confirme que o UUID está correto (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

**Serviços não aparecem**  
A migration só insere os serviços se a tabela `services` estiver vazia. Se já houver dados, nada é inserido.
