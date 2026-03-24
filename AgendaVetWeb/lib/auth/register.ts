// lib/auth/register.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service'
import { createApprovalToken } from './tokens'
import { sendApprovalEmail } from './email'

export async function registerVet(formData: {
  email: string
  password: string
  fullName: string
  idade: number
  genero: 'masculino' | 'feminino'
}) {
  const supabase = await createServerSupabaseClient()
  const service = createServiceSupabaseClient()

  // 1. Criar conta no Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  })
  if (authError || !authData.user) {
    throw new Error(authError?.message ?? 'Erro ao criar conta')
  }

  const userId = authData.user.id

  // 2. RPC atômica: profiles + user_roles
  const { error: rpcError } = await service.rpc('register_user_profile', {
    p_user_id:   userId,
    p_full_name: formData.fullName,
    p_role:      'vet',
    p_status:    'pending',
    p_idade:     formData.idade,
    p_genero:    formData.genero,
  })
  if (rpcError) {
    // Rollback: remover usuário do Auth
    await service.auth.admin.deleteUser(userId)
    throw new Error('Erro ao salvar perfil. Tente novamente.')
  }

  // 3. Gerar token de aprovação
  const token = await createApprovalToken(userId)

  // 4. Enviar email para o dono
  try {
    await sendApprovalEmail({
      ownerEmail:      process.env.OWNER_EMAIL!,
      secretarioNome:  formData.fullName,
      secretarioEmail: formData.email,
      approvalToken:   token,
      appUrl:          process.env.NEXT_PUBLIC_APP_URL!,
    })
  } catch {
    // Account created and pending — but email failed.
    // Don't rollback: the admin can still manually approve via Supabase.
    // Just surface a warning to the user.
    throw new Error('Cadastro criado, mas houve um problema ao enviar o email de aprovação. Entre em contato com o administrador.')
  }
}

export async function registerTutor(formData: {
  email: string
  password: string
  fullName: string
}) {
  const supabase = await createServerSupabaseClient()
  const service = createServiceSupabaseClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  })
  if (authError || !authData.user) {
    throw new Error(authError?.message ?? 'Erro ao criar conta')
  }

  const userId = authData.user.id

  const { error: rpcError } = await service.rpc('register_user_profile', {
    p_user_id:   userId,
    p_full_name: formData.fullName,
    p_role:      'tutor',
    p_status:    'active',
  })
  if (rpcError) {
    await service.auth.admin.deleteUser(userId)
    throw new Error('Erro ao salvar perfil. Tente novamente.')
  }
}
