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
import { VitePWA } from 'vite-plugin-pwa';

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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'placeholder.svg'],
      manifest: {
        name: 'AgendaVet',
        short_name: 'AgendaVet',
        description: 'Sistema veterinário de gestão de fichas e histórico de pets',
        theme_color: '#4A9FD8',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'placeholder.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'placeholder.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        categories: ['medical', 'health', 'utilities'],
        lang: 'pt-BR',
      },
      workbox: {
        // Estratégia para navegação (SPA): sempre tenta rede, fallback ao cache
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/],

        // Cache de assets estáticos (JS, CSS, fontes, imagens)
        runtimeCaching: [
          {
            // Assets da aplicação (JS, CSS, SVG)
            urlPattern: /\.(?:js|css|woff2?|ttf|svg|png|jpg|jpeg|webp|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
            },
          },
          {
            // Chamadas à API do Supabase — NetworkFirst para dados sempre frescos
            // com fallback ao cache quando offline
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],

        // Pré-cache dos recursos críticos da SPA
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
      },
      devOptions: {
        // Ativa o SW em desenvolvimento para testar offline
        enabled: mode === 'development',
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
