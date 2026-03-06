# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. **Acessar pelo Expo Go (celular em outra rede)** — usar túnel ngrok. **Entre na pasta do app** e rode:

   ```bash
   cd AgendaVet-Tutor-App
   npx expo start --tunnel
   ```

   Com cache limpo: `npx expo start -c --tunnel`

   No terminal aparecerá um **QR code** e uma URL `exp://...`. Abra o **Expo Go** no celular e escaneie o QR code.

   **Se aparecer "ngrok tunnel took too long to connect":**
   - **Opção A (recomendada):** Crie uma conta grátis em [ngrok.com](https://ngrok.com), pegue seu **authtoken** em [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) e adicione no `.env`:
     ```env
     NGROK_AUTHTOKEN=seu_token_aqui
     ```
     Depois rode de novo: `npx expo start --tunnel`.
   - **Opção B:** Tente mais uma ou duas vezes (às vezes conecta na segunda).
   - **Opção C:** Use na mesma rede sem túnel: `npx expo start` e conecte o celular no mesmo Wi‑Fi; no Expo Go, use a URL da LAN.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
