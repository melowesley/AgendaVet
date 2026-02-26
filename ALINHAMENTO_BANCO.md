# Guia de Alinhamento do Banco de Dados — AgendaVet

Este documento descreve o estado atual do banco e o que você precisa conferir/ajustar manualmente no Supabase Dashboard para garantir sincronia com **Loveable**, **Cursor**, **Antigravity** e **Capacitor** (mobile).

---

## ✅ O que já foi feito automaticamente

1. **Função `has_role`** — Corrigida e aplicada via migration. A função agora usa `role::TEXT` para evitar erros de "operador não existe" no PostgreSQL.
2. **Admin em `user_roles`** — O usuário `e51f6817-4016-44d5-b5d8-af7cff89c4a5` já está com role `admin`.
3. **RLS (Row Level Security)** — Todas as tabelas principais (`profiles`, `pets`, `services`, `appointment_requests`, etc.) estão com RLS **enabled**.
4. **Estrutura do banco** — Todas as tabelas esperadas existem e estão alinhadas com o código.

---

## 📋 Checklist para você conferir no Supabase Dashboard

### 1. Função `has_role` (já aplicada)

Se você ainda tiver problemas de permissão, pode rodar o conteúdo do arquivo `PATCH_BANCO.sql` no **SQL Editor** do Supabase. A correção principal já foi aplicada via migration.

### 2. Atribuição de Admin

Se o banco foi recriado e você perdeu o cargo de admin, ou se estiver usando outro usuário:

1. Vá em **Authentication → Users** no Supabase Dashboard.
2. Copie o **UUID** do seu usuário.
3. No **SQL Editor**, execute:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_UUID_AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### 3. RLS (Segurança)

Todas as tabelas relevantes já estão com RLS habilitado. Para conferir:

- **Table Editor** → selecione `profiles` ou `pets` → aba **RLS** deve mostrar "RLS enabled".

### 4. Loveable Sync

O Loveable se sincroniza via **GitHub**. Se o repositório local estiver em dia com o `master` (ou a branch que o Loveable usa), ele já deve ver a versão mais recente. Certifique-se de que:

- O projeto Loveable está conectado ao mesmo repositório GitHub.
- A branch configurada no Loveable é a correta.

### 5. Variáveis de ambiente (Cursor / local / build)

Para o app funcionar localmente e no build (incluindo Capacitor):

- Crie/edite o arquivo `.env` na raiz do projeto com:

```
VITE_SUPABASE_URL=https://cahlaalebcwqgbbavrsf.supabase.co
VITE_SUPABASE_ANON_KEY=<sua anon key>
```

- A **anon key** está em **Settings → API** no dashboard do Supabase.

### 6. Capacitor (mobile)

O projeto já está configurado com Capacitor. Para gerar o APK:

```bash
npm run cap:sync
npx cap open android
```

No Android Studio, faça **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

---

## Resumo do estado atual

| Item              | Status |
|-------------------|--------|
| Função `has_role` | ✅ Corrigida |
| Admin em user_roles | ✅ Atribuído (UUID: e51f6817-...) |
| RLS nas tabelas   | ✅ Habilitado |
| Tabelas do schema | ✅ Todas presentes |
| Migrations        | ✅ Aplicadas |

---

## Se algo der errado

- **Erro de permissão ao acessar dados**: Verifique se o usuário está em `user_roles` com role `admin`.
- **Erro "operador não existe"**: A função `has_role` já foi corrigida. Se persistir, rode `PATCH_BANCO.sql` no SQL Editor.
- **Loveable desatualizado**: Faça push das alterações para o GitHub na branch que o Loveable monitora.
