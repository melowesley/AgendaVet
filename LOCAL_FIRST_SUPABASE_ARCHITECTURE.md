# AgendaVet — Arquitetura Local-First com Supabase

## Objetivo

Permitir uso offline com leitura e escrita local, mantendo o Supabase como fonte de verdade quando online.

## Escopo implementado

- **Dados locais (IndexedDB)**:
  - lista de pets do tutor;
  - solicitações de agendamento do tutor;
  - caches de leitura para:
    - lista de pets do admin;
    - solicitações de agendamento do admin;
    - timeline/prontuário de pets já acessados.
- **Supabase**:
  - autenticação continua sendo feita via `supabase.auth`;
  - sincronização push/pull dos dados do tutor (`pets`, `appointment_requests`) ao logar, reconectar e sincronizar manualmente.

## Modelo de dados local

Persistência local em `IndexedDB` (com fallback em memória):

- `users[user_id].pets[]`
- `users[user_id].appointments[]`
- `users[user_id].last_synced_at`
- `queue[]` (operações offline pendentes/falhas)
- `resources[]` (cache de leituras administrativas e prontuários)

Campos adicionais locais:

- `sync_state` em pets/agendamentos: `synced | pending | failed`
- fila offline com:
  - `type` (`create_pet`, `create_appointment_request`);
  - `attempts`, `last_error`, `status`;
  - payload completo da operação.

## Estratégia de sincronização

### 1) Push (primeiro)

Antes de fazer pull, o app envia pendências da fila:

- processa em ordem de criação;
- tenta inserir no Supabase;
- em sucesso:
  - remove da fila;
  - marca item local como `synced`;
- em erro:
  - incrementa tentativas;
  - marca `failed`;
  - mantém para retry.

### 2) Pull (depois)

Após push:

- busca `pets` e `appointment_requests` do usuário no Supabase;
- grava no cache local como `synced`;
- preserva localmente itens ainda não sincronizados (`pending`/`failed`) que não existam no servidor.

## Conflitos

Política aplicada:

- **Supabase é a fonte de verdade** para dados sincronizados.
- **Itens locais pendentes/falhos** são preservados no cliente até sucesso no push.
- Para evitar duplicação em retries de criação, o cliente gera o `id` da linha antes do envio e envia esse `id` ao Supabase.

## Fila offline e retry

- Escritas offline são enfileiradas automaticamente.
- Retry automático:
  - ao voltar conexão (`window.online`);
  - no login/refresh de sessão.
- Retry manual:
  - botão **Sincronizar agora** no portal do cliente.

## UX sem conexão

- Indicador visual de **Offline** nos layouts Admin/Cliente.
- Banner informando uso de cache local.
- Portal do cliente mostra:
  - quantidade de pendências;
  - horário da última sincronização;
  - ação de sincronização manual.
- Cadastro de pet e solicitação de consulta:
  - funcionam offline (salvam local + fila);
  - exibem status de sincronização (`Pend. sync` / `Falha no sync`).
