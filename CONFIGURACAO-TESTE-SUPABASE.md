# Configuração do Supabase para Ambiente de TESTE

Este guia lista as configurações necessárias no **Supabase Dashboard** para o AgendaVet funcionar corretamente em ambiente de desenvolvimento/teste (antes do lançamento).

---

## 1. Desabilitar confirmação de email (Auth)

Por padrão, o Supabase exige que o usuário confirme o email antes de poder fazer login. Para testes, desabilite:

1. Acesse **Authentication** → **Providers** → **Email**
2. Desative **Confirm email** (ou "Confirmar email")
3. Salve

Assim, novos usuários podem fazer login imediatamente após o cadastro, sem precisar clicar no link de confirmação.

---

## 2. Redirect URLs (para app mobile)

Se você usa o app no celular (Capacitor/Android):

1. Acesse **Authentication** → **URL Configuration**
2. Em **Redirect URLs**, adicione: `capacitor://localhost`
3. Salve

---

## 3. Site URL (opcional para dev)

Para desenvolvimento local:

- **Site URL**: pode deixar `http://localhost:8080` ou a URL que você usa
- O Supabase aceita múltiplas URLs na lista de Redirect URLs

---

## 4. Variáveis de ambiente (.env)

Certifique-se de que o arquivo `.env` na raiz do projeto contém:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

Os valores estão em **Settings** → **API** no dashboard do Supabase.

---

## 5. Migrations aplicadas

A migration `setup_test_env_auto_user_role` foi aplicada e faz:

- Todo novo usuário recebe automaticamente a role `user` ao se cadastrar
- Usuários existentes sem role recebem a role `user`

Isso garante que tutores possam acessar pets, appointment_requests e outras tabelas com as políticas RLS existentes.

---

## Resumo

| Configuração | Onde | Valor |
|-------------|------|-------|
| Confirm email | Auth → Providers → Email | **OFF** (para teste) |
| Redirect URL (mobile) | Auth → URL Configuration | `capacitor://localhost` |
| .env | Raiz do projeto | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
