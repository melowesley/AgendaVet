# Checklist Android + Supabase — AgendaVet

## Diagnóstico provável dos erros

| Sintoma | Causa provável | Solução aplicada |
|---------|----------------|------------------|
| Login inconsistente no Android | 1) Variável `VITE_SUPABASE_ANON_KEY` não definida (`.env` usava `VITE_SUPABASE_PUBLISHABLE_KEY`) | Client aceita ambas as variáveis; `.env` corrigido |
| | 2) Storage do WebView diferente do browser | `storage: window.localStorage` explícito |
| Sessão não persiste após login | Capacitor/WebView pode limpar storage em certas condições | `persistSession: true`, `autoRefreshToken: true`, storage explícito |
| Formulários não carregam | Erros silenciosos nas queries (sem tratamento de `error`) | `logSupabaseError`, try/catch, loading e fallback visual |
| Erro ao buscar dados do banco | RLS bloqueando (auth.uid() null ou policy restritiva) | Verificar policies; ver `RLS_DEBUG_POLICIES.sql` para teste |
| Falha silenciosa | Erros não logados no console | Logger global `supabaseLogger` |

---

## Checklist final para Android

### 1. Variáveis de ambiente
- [ ] `.env` contém `VITE_SUPABASE_URL` (sem localhost em produção)
- [ ] `.env` contém `VITE_SUPABASE_ANON_KEY` ou `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Valores obtidos em **Supabase Dashboard → Settings → API**

### 2. Build e sync
```bash
npm run build
npx cap sync android
```
- [ ] Build conclui sem erros
- [ ] `android/app/src/main/assets/public` contém os arquivos atualizados
- [ ] Versão do app incrementada em `android/app/build.gradle` (opcional)

### 3. Debug no dispositivo
- [ ] Conectar Android via USB
- [ ] Ativar **Depuração USB** no dispositivo
- [ ] Abrir `chrome://inspect` no Chrome (desktop)
- [ ] Selecionar o WebView do AgendaVet e inspecionar
- [ ] Verificar console para `[Supabase Error]` e `[Supabase Warn]`

### 4. Testes de sessão
- [ ] Login com email/senha válidos
- [ ] Verificar se redireciona para `/cliente` ou `/admin`
- [ ] Fechar o app (não matar) e reabrir — sessão deve persistir
- [ ] Se sessão não persistir: conferir se `localStorage` está disponível no WebView

### 5. Políticas RLS
- [ ] Executar `FIX_POLICIES.sql` no SQL Editor do Supabase
- [ ] Se ainda falhar: usar policy temporária em `supabase/migrations/20260225000000_android_rls_debug_policies.sql` para isolar problema de RLS

### 6. Formulários
- [ ] Abrir um pet no admin e abrir diálogo de Exames
- [ ] Verificar se carrega "Carregando exames..." e depois lista ou mensagem de erro
- [ ] Em caso de erro: botão "Tentar novamente" deve recarregar

---

## Arquivos modificados/criados

| Arquivo | Alteração |
|---------|-----------|
| `src/integrations/supabase/client.ts` | Suporte a ambas variáveis de key, `window.localStorage`, logger, fetch intercept |
| `src/lib/supabaseLogger.ts` | Logger global para erros Supabase |
| `.env` | `VITE_SUPABASE_ANON_KEY` (antes: `VITE_SUPABASE_PUBLISHABLE_KEY`) |
| `src/components/admin/ExameDialog.tsx` | try/catch, loading, fallback, `logSupabaseError` |
| `src/hooks/useRequireSession.ts` | Hook para verificação de sessão com `getSession()` |
| `supabase/migrations/20260225000000_android_rls_debug_policies.sql` | Exemplo de policy para debug RLS |

---

## Exemplo de policy SQL (temporária para teste)

Se suspeitar que RLS está bloqueando, execute no **SQL Editor** do Supabase:

```sql
-- Permite SELECT para qualquer usuário autenticado (apenas para debug)
DROP POLICY IF EXISTS "Users can view their pet exams" ON public.pet_exams;
CREATE POLICY "DEBUG: authenticated select pet_exams"
  ON public.pet_exams FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

**Reverter** executando `FIX_POLICIES.sql`.

---

## Comandos úteis

```bash
# Build + sync
npm run build && npx cap sync android

# Abrir projeto Android
npx cap open android

# Ver logs no dispositivo (Android)
adb logcat | grep -i capacitor
```
