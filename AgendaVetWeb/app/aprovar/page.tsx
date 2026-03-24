import { createServiceSupabaseClient } from '@/lib/supabase/service'
import { validateApprovalToken } from '@/lib/auth/tokens'
import { ApprovalConfirmButton } from '@/components/auth/approval-confirm-button'
import { PawPrint } from 'lucide-react'

interface Props {
  searchParams: { token?: string }
}

export default async function AprovarPage({ searchParams }: Props) {
  const token = searchParams.token

  if (!token) {
    return <AprovarLayout><p className="text-red-500">Link inválido.</p></AprovarLayout>
  }

  const validation = await validateApprovalToken(token)

  if (!validation.valid) {
    return (
      <AprovarLayout>
        <p className="text-red-500 font-medium">{validation.reason}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Solicite ao secretário que reenvie o pedido de aprovação.
        </p>
      </AprovarLayout>
    )
  }

  const supabase = createServiceSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', validation.data!.user_id)
    .single()

  const { data: authUser } = await supabase.auth.admin.getUserById(
    validation.data!.user_id
  )

  return (
    <AprovarLayout>
      <h2 className="text-xl font-semibold mb-4">Aprovar acesso ao sistema</h2>
      <div className="space-y-2 mb-6 text-sm">
        <p><span className="font-medium">Nome:</span> {profile?.full_name ?? '—'}</p>
        <p><span className="font-medium">Email:</span> {authUser.user?.email ?? '—'}</p>
      </div>
      <ApprovalConfirmButton token={token} />
    </AprovarLayout>
  )
}

function AprovarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow p-8">
        <div className="flex items-center gap-2 mb-6">
          <PawPrint className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-lg">AgendaVet</span>
        </div>
        {children}
      </div>
    </div>
  )
}
