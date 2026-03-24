'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registerVet } from '@/lib/auth/register'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PawPrint } from 'lucide-react'

function VetLoginPageInner() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const statusParam = searchParams.get('status')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regIdade, setRegIdade] = useState('')
  const [regGenero, setRegGenero] = useState<'masculino' | 'feminino' | ''>('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    await supabase.auth.refreshSession()
    const { data: { session } } = await supabase.auth.getSession()
    const appMeta = session?.user?.app_metadata as { role?: string; status?: string } | undefined
    if (appMeta?.status === 'pending') {
      window.location.href = '/login/vet?status=pending'
    } else if (appMeta?.status === 'rejected') {
      window.location.href = '/login/vet?status=rejected'
    } else {
      window.location.href = '/vet/dashboard'
    }
    setLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!regGenero) { setError('Selecione o gênero'); return }
    setLoading(true)
    setError(null)
    try {
      await registerVet({
        email: regEmail,
        password: regPassword,
        fullName: regName,
        idade: parseInt(regIdade),
        genero: regGenero,
      })
      setSuccess('Cadastro enviado! Aguarde a aprovação por email.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefreshStatus() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.refreshSession()
    const { data: { session } } = await supabase.auth.getSession()
    const appMeta = session?.user?.app_metadata as { role?: string; status?: string } | undefined
    if (appMeta?.status === 'active') {
      window.location.href = '/vet/dashboard'
    } else {
      setError('Sua conta ainda não foi aprovada.')
    }
    setLoading(false)
  }

  async function handleResendToken() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Sessão expirada. Faça login novamente.'); setLoading(false); return }
      const res = await fetch('/api/resend-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      })
      if (!res.ok) throw new Error('Erro ao reenviar email')
      setSuccess('Email reenviado! Verifique a caixa de entrada do administrador.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar')
    } finally {
      setLoading(false)
    }
  }

  if (statusParam === 'pending' || success) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Aguardando aprovação</CardTitle>
            <CardDescription>
              {success ?? 'Seu cadastro está sendo analisado. Você receberá acesso quando for aprovado.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleRefreshStatus} disabled={loading} className="w-full">
              {loading ? 'Verificando...' : 'Verificar status'}
            </Button>
            <Button onClick={handleResendToken} disabled={loading} variant="outline" className="w-full">
              Reenviar email de aprovação
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  if (statusParam === 'rejected') {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-500">Acesso negado</CardTitle>
            <CardDescription>Entre em contato com o administrador do sistema.</CardDescription>
          </CardHeader>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle>{mode === 'login' ? 'Acesso — Secretário' : 'Cadastro — Secretário'}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Não tem conta?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-emerald-600 hover:underline">
                  Cadastrar
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Senha</Label>
                <Input id="reg-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idade">Idade</Label>
                <Input id="idade" type="number" min={16} max={100} value={regIdade} onChange={e => setRegIdade(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <div className="flex gap-3">
                  {(['masculino', 'feminino'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setRegGenero(g)}
                      className={`flex-1 py-2 rounded-md border text-sm capitalize transition-colors ${regGenero === g ? 'bg-emerald-600 text-white border-emerald-600' : 'border-input hover:bg-accent'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? 'Enviando...' : 'Enviar cadastro'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-emerald-600 hover:underline">
                  Entrar
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <PawPrint className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-xl">AgendaVet</span>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function VetLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <VetLoginPageInner />
    </Suspense>
  )
}
