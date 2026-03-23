/**
 * Admin utilities — verifica se o usuário atual é o administrador do sistema.
 * O admin é identificado pelo ADMIN_EMAIL no .env (server-side only).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

/** Retorna true se o usuário autenticado for o admin do sistema. */
export async function isAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return false

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.email === adminEmail
  } catch {
    return false
  }
}

/** Retorna o usuário admin ou lança 401. */
export async function requireAdmin() {
  const adminOk = await isAdmin()
  if (!adminOk) {
    return Response.json({ error: 'Acesso negado' }, { status: 403 })
  }
  return null
}
