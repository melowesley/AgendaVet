# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**VetAgenda** is a veterinary clinic management SPA built with React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui. The backend is Supabase (cloud-hosted BaaS — auth, PostgreSQL, edge functions). The landing page (`/`) renders a demo schedule with mock data and works without Supabase credentials.

### Commands

All standard commands are in `package.json`:

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 8080) |
| Lint | `npm run lint` |
| Test | `npm run test` |
| Build | `npm run build` |

### Supabase environment

The app requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in a `.env` file at the project root. Without real credentials, auth and data features will fail. The `.env` file is gitignored.

### Gotchas

- **Cursor secrets override `.env`**: If `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set as Cursor secrets, they are injected as system environment variables in a redacted format (`sb_publishable_...`, `sb_secret_...`) that is NOT valid for Supabase. Vite prioritizes system env vars over `.env` files. **Workaround**: Start the dev server with explicit correct values: `VITE_SUPABASE_URL="https://..." VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..." npm run dev`, or `unset` the corrupted vars before starting.
- **Browser Service Worker caching**: The app registers a Service Worker that can cache error pages. If the app shows "Erro ao carregar" after fixing env vars, clear all browser data (`chrome://settings/clearBrowserData` → All time) and unregister service workers at `chrome://serviceworker-internals/`.
- The build emits a CSS warning about `@import` order in `src/index.css` (Google Fonts `@import` appears after `@tailwind` directives). This is cosmetic and does not break the build or dev server.
- ESLint exits with code 1 due to one pre-existing `@typescript-eslint/no-explicit-any` error in `src/components/admin/InternacaoDialog.tsx`. The remaining 23 issues are warnings (react-hooks/exhaustive-deps, react-refresh). These are all pre-existing in the codebase.
- The project has both `package-lock.json` (npm) and `bun.lockb` (bun). Use **npm** as the primary package manager.
