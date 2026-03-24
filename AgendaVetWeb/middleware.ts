// middleware.ts — ponto de entrada obrigatório para Next.js
// Delega toda a lógica para proxy.ts (separado para evitar duplicação)
import { proxy, config } from './proxy'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return proxy(request)
}

export { config }
