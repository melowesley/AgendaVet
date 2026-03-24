// lib/auth/tokens.ts
import { createServiceSupabaseClient } from '@/lib/supabase/service'

export function generateToken(): string {
  return crypto.randomUUID() + '-' + crypto.randomUUID()
}

export async function createApprovalToken(userId: string): Promise<string> {
  const supabase = createServiceSupabaseClient()
  const token = generateToken()

  // Invalidar tokens anteriores não usados
  await supabase
    .from('approval_tokens')
    .update({ used: true })
    .eq('user_id', userId)
    .eq('used', false)

  const { error } = await supabase.from('approval_tokens').insert({
    user_id: userId,
    token,
  })

  if (error) throw new Error('Erro ao criar token de aprovação')
  return token
}

export async function validateApprovalToken(token: string) {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from('approval_tokens')
    .select('id, user_id, expires_at, used')
    .eq('token', token)
    .single()

  if (error || !data) return { valid: false, reason: 'Token não encontrado' }
  if (data.used) return { valid: false, reason: 'Token já utilizado' }
  if (new Date(data.expires_at) < new Date()) return { valid: false, reason: 'Token expirado' }

  return { valid: true, data }
}

export async function consumeApprovalToken(token: string, userId: string) {
  const supabase = createServiceSupabaseClient()

  const { error: tokenError } = await supabase
    .from('approval_tokens')
    .update({ used: true })
    .eq('token', token)

  if (tokenError) throw new Error('Erro ao invalidar token')

  const { error: roleError } = await supabase
    .from('user_roles')
    .update({ status: 'active' })
    .eq('user_id', userId)

  if (roleError) throw new Error('Erro ao ativar usuário')

  const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { status: 'active' },
  })

  if (metaError) throw new Error('Erro ao atualizar metadata do usuário')
}
