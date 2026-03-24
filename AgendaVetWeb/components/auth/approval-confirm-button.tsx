'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ApprovalConfirmButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleApprove() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erro ao aprovar')
      setLoading(false)
      return
    }
    router.push('/aprovar/sucesso')
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button
        onClick={handleApprove}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {loading ? 'Aprovando...' : 'Aprovar Acesso'}
      </Button>
    </div>
  )
}
