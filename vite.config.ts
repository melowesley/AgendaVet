/**
 * vite.config.ts
 *
 * Configuração do Vite com suporte a PWA (Progressive Web App).
 *
 * PWA features habilitadas:
 * - Manifesto: nome, ícones, cores, orientação → instalável como app no celular
 * - Service Worker (Workbox, estratégia NetworkFirst):
 *   * Faz cache das principais rotas da SPA para uso offline
 *   * Cache de assets estáticos (JS, CSS, fonts) com CacheFirst
 *   * Cache de chamadas à API do Supabase com NetworkFirst (fallback ao cache)
 * - Registro automático do SW via 'autoUpdate'
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';


export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
