# Como gerar o app do AgendaVet (Android e iOS)

O projeto está configurado com **Capacitor**. Siga os passos abaixo **no seu computador** para gerar o **APK (Android)** ou o **app para iPhone/iPad (iOS)**.

---

## Comandos comuns (na pasta do projeto)

| O que fazer | Comando |
|-------------|---------|
| Instalar dependências (1ª vez) | `npm install` |
| Criar projeto Android (1ª vez) | `npx cap add android` |
| Criar projeto iOS (1ª vez) | `npx cap add ios` |
| Atualizar app após mudar o site | `npm run cap:sync` |
| Abrir no Android Studio | `npm run android` |
| Abrir no Xcode (só no Mac) | `npm run ios` |

O **`npm run cap:sync`** faz o build do site e sincroniza **Android e iOS** de uma vez.

---

# Android (APK)

## Pré-requisitos Android

1. **Node.js** (já deve estar instalado).
2. **Android Studio** — https://developer.android.com/studio (instale o Android SDK na primeira abertura).
3. **JDK 17** — o Android Studio costuma trazer um; se der erro de Java, instale o [JDK 17](https://adoptium.net/).

---

## Passo 1: Instalar dependências

No terminal, na pasta do projeto (onde está o `package.json`):

```bash
npm install
```

Isso instala o Capacitor e o restante das dependências.

---

## Passo 2: Criar a pasta do projeto Android (só uma vez)

Ainda na pasta do projeto:

```bash
npx cap add android
```

Isso cria a pasta **`android/`** com o projeto Android. Se a pasta já existir, pule para o passo 3.

---

## Passo 3: Build do site e sincronizar com o Android

Sempre que você alterar o código do site e quiser refletir no app:

```bash
npm run cap:sync
```

Esse comando:

1. Gera o build web (`npm run build` → pasta `dist/`).
2. Copia o conteúdo de `dist/` para os projetos Android e iOS e atualiza a config.

---

## Passo 4: Abrir no Android Studio e gerar o APK

1. Abra o **Android Studio**.
2. **File → Open** e selecione a pasta **`android`** que está dentro do projeto AgendaVet (caminho completo: `...\AgendaVet\android`).
3. Espere o Gradle terminar de sincronizar (barra de progresso em baixo).
4. No menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.  
   - Para testar no celular: use o APK de **debug** (já gerado em `android/app/build/outputs/apk/debug/`).  
   - Para distribuir: **Build → Generate Signed Bundle / APK** e crie um APK **release** (é preciso criar uma chave de assinatura; o próprio Android Studio guia).
5. O APK ficará em algo como:  
   `android\app\build\outputs\apk\debug\app-debug.apk`  
   Copie esse arquivo para o celular e instale (pode ser por cabo, e-mail, Drive, etc.).

---

## Testar no celular Android sem gerar APK

Com o celular conectado por USB (e **depuração USB** ativada nas opções de desenvolvedor):

1. Rode `npm run cap:sync`.
2. No Android Studio, com o projeto `android` aberto, clique no botão **Run** (ícone de play) e escolha seu aparelho.  
O app será instalado e aberto no celular.

---

## Observações

- O app é um **WebView**: ele abre a mesma interface web que você vê no navegador, empacotada como app.
- A **URL** do Supabase e do backend continua a mesma; o app usa a internet normalmente.
- Se mudar algo no código (React/Vite), rode de novo **`npm run cap:sync`** e depois **Build APK** (ou Run) no Android Studio.

---

# iOS (iPhone / iPad)

## Pré-requisitos iOS

- **Mac** com **macOS** (o build para iOS só roda em Mac, pois usa o Xcode).
- **Xcode** — instale pela App Store: https://apps.apple.com/app/xcode/id497799835  
  - Abra o Xcode uma vez e aceite instalar os componentes extras (Command Line Tools, etc.).
- **Conta Apple Developer** (gratuita serve para testar no seu próprio iPhone; para publicar na App Store é paga).

---

## Passo 1: Instalar dependências e criar o projeto iOS (só uma vez)

Na pasta do projeto:

```bash
npm install
npx cap add ios
```

Isso cria a pasta **`ios/`** com o projeto Xcode.

---

## Passo 2: Sincronizar o site com o app

Sempre que alterar o código do site:

```bash
npm run cap:sync
```

---

## Passo 3: Abrir no Xcode e rodar no iPhone/iPad

1. Abra o Xcode: **File → Open** e selecione a pasta **`ios/App`** (ou a pasta **`ios`**) dentro do projeto AgendaVet.
2. No topo do Xcode, escolha o **destino** (por exemplo: “App” ou um simulador como “iPhone 15”).
3. Para testar no **simulador**: escolha um iPhone/iPad na lista e clique no botão **Run** (▶).
4. Para testar no **celular físico**:
   - Conecte o iPhone/iPad por cabo.
   - Selecione seu aparelho na lista de destinos.
   - Na primeira vez, em **Signing & Capabilities**, escolha seu **Team** (sua conta Apple) para que o Xcode assine o app.
   - Clique em **Run**; pode ser necessário em **Ajustes → Geral → VPN e gestão do dispositivo** confiar no desenvolvedor no iPhone.

---

## Gerar IPA para distribuição (TestFlight / App Store)

- No Xcode: **Product → Archive**. Depois use **Distribute App** para enviar ao TestFlight ou à App Store (exige conta Apple Developer paga).
- Para instalar só no seu iPhone sem App Store: use **Run** com o aparelho conectado (e assinatura com sua conta Apple).

---

## Observações iOS

- O projeto iOS **só pode ser aberto e buildado em um Mac** (Xcode não existe para Windows).
- O app é um **WebView**: mesma interface web do AgendaVet, empacotada como app nativo.
- Se mudar o código (React/Vite), rode **`npm run cap:sync`** e depois abra de novo o Xcode (ou rode de novo pelo Xcode).
