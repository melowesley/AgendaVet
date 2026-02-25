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

The app requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in a `.env` file at the project root. Without real credentials, the landing page still works (mock data), but auth and data features will fail. The `.env` file is gitignored.

### Gotchas

- The build emits a CSS warning about `@import` order in `src/index.css` (Google Fonts `@import` appears after `@tailwind` directives). This is cosmetic and does not break the build or dev server.
- ESLint exits with code 1 due to one pre-existing `@typescript-eslint/no-explicit-any` error in `src/components/admin/InternacaoDialog.tsx`. The remaining 23 issues are warnings (react-hooks/exhaustive-deps, react-refresh). These are all pre-existing in the codebase.
- The project has both `package-lock.json` (npm) and `bun.lockb` (bun). Use **npm** as the primary package manager.
