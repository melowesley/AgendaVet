# Guia: Supabase (app no celular) + Link do APK

Este guia explica **passo a passo** como configurar o Supabase para o app funcionar no celular (Capacitor) e como gerar um **link** para as pessoas baixarem o APK.

---

## Parte 1 — Configurar o Supabase para o app no celular

Quando o AgendaVet roda **dentro do app Android** (Capacitor), o Supabase vê as requisições vindo de uma origem diferente da web. Por isso é preciso **autorizar essa origem** no painel do Supabase. Caso contrário, o login pode falhar ou ficar em “Entrando…” e depois voltar para a tela de login.

### Passo 1.1 — Entrar no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login.
2. Abra o **projeto** do AgendaVet (o que está no seu `.env` como `VITE_SUPABASE_URL`).

### Passo 1.2 — Abrir Authentication → URL Configuration

1. No menu lateral, clique em **Authentication**.
2. Clique em **URL Configuration** (ou “Configuração de URL”).

### Passo 1.3 — Adicionar a URL do app Capacitor

Na seção **Redirect URLs** (URLs de redirecionamento):

1. Clique em **Add URL** (ou no campo de adicionar URL).
2. Adicione **exatamente** esta URL (uma por linha se tiver várias):
   ```text
   capacitor://localhost
   ```
3. Se o Supabase tiver um campo **Site URL**, deixe o que você usa na web (ex.: `https://seu-dominio.com`). Não precisa trocar para `capacitor://localhost` ali.
4. Salve (botão **Save** ou **Salvar**).

**Por que isso?**  
No celular, o app abre como `capacitor://localhost`. O Supabase só aceita redirecionamentos e sessões de URLs que estejam na lista. Sem `capacitor://localhost`, o login no app pode não “grudar” e dar loop ou erro.

### Passo 1.4 — (Opcional) Conferir políticas e rede

- **RLS:** garanta que a tabela `user_roles` está acessível para o usuário autenticado (por exemplo, política que permite `SELECT` para o próprio `user_id`).
- Se o app só funcionar em Wi‑Fi, pode ser firewall ou rede do celular; teste em outra rede ou 4G.

Depois disso, faça um novo build do app, instale no celular e teste o login de novo.

---

## Parte 2 — Onde está o APK e como gerar um link

O APK é um **arquivo** no seu computador. Ele **não tem link** até você colocá-lo em algum lugar que gere uma URL de download.

### Passo 2.1 — Localizar o APK no PC

Depois de gerar o APK no Android Studio (Build → Generate Signed Bundle/APK → APK), o arquivo fica em:

```text
AgendaVet\android\app\build\outputs\apk\release\app-release.apk
```

Ou, a partir da pasta do projeto:

```text
android\app\build\outputs\apk\release\app-release.apk
```

Esse é o arquivo que você vai **enviar** para um serviço de nuvem para obter um link.

### Passo 2.2 — Gerar link com Google Drive (recomendado para teste)

1. Abra [https://drive.google.com](https://drive.google.com) e faça login.
2. Clique em **+ Novo** → **Upload de arquivo** (ou arraste o arquivo para a janela).
3. Selecione o `app-release.apk` na pasta acima.
4. Após o upload, clique com o botão direito no arquivo **app-release.apk** no Drive.
5. Clique em **Compartilhar** (ou **Share**).
6. Em “Acesso geral”, mude para **Qualquer pessoa com o link** (e pode deixar como **Visualizador**).
7. Clique em **Copiar link** e cole em um lugar seguro.

Esse link é o **link do APK**: quem abrir no celular (ou no PC) pode **baixar e instalar** o app.  
Exemplo de formato:  
`https://drive.google.com/file/d/XXXXX/view?usp=sharing`

**Para virar link de download direto (opcional):**  
Troque `view?usp=sharing` por `preview` ou use o link de download do Google Drive (em “Download” ao abrir o arquivo). Para testes, o link “view” já costuma abrir e oferecer “Baixar” no celular.

### Passo 2.3 — Alternativa: OneDrive

1. Acesse [https://onedrive.live.com](https://onedrive.live.com).
2. Faça upload do `app-release.apk`.
3. Clique com o botão direito no arquivo → **Compartilhar** → **Gerar link** (ou compartilhar com “Qualquer pessoa com o link”).
4. Copie o link e use como link do APK.

### Passo 2.4 — Enviar o link para outras pessoas

- **WhatsApp:** cole o link na conversa. No celular, ao tocar no link, o navegador (ou o próprio app) pode abrir e permitir baixar o APK.
- **E-mail:** cole o link no corpo do e-mail.
- **Mensagem:** qualquer app que permita enviar texto (SMS, Telegram, etc.).

Lembre às pessoas que, no Android, pode ser necessário permitir **“Instalar apps de fontes desconhecidas”** para o navegador ou para “Arquivos” antes de abrir o APK.

---

## Resumo rápido

| O que fazer | Onde / Como |
|-------------|-------------|
| Autorizar app no celular no Supabase | **Supabase** → Authentication → URL Configuration → Redirect URLs → adicionar `capacitor://localhost` → Save |
| Achar o APK no PC | Pasta `android\app\build\outputs\apk\release\app-release.apk` |
| Gerar link do APK | Fazer upload do `app-release.apk` no **Google Drive** (ou OneDrive) → Compartilhar → “Qualquer pessoa com o link” → Copiar link |
| Distribuir | Enviar o link por WhatsApp, e-mail, etc. |

Depois de configurar o Supabase e gerar o link, faça um novo build do app (`npm run build` → `npx cap sync android` → gerar APK de novo no Android Studio) e teste o login no celular. Se ainda der problema, confira no Supabase em **Authentication → Logs** se as tentativas de login estão chegando e se há algum erro.
