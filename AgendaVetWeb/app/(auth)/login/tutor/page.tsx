'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { registerTutor } from '@/lib/auth/register'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PawPrint } from 'lucide-react'

export default function TutorLoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regName, setRegName] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (error) { setError(error.message); setLoading(false); return }
    window.location.href = '/tutor/dashboard'
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await registerTutor({ email: regEmail, password: regPassword, fullName: regName })
      window.location.href = '/tutor/dashboard'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <PawPrint className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-xl">AgendaVet</span>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{mode === 'login' ? 'Acesso — Tutor' : 'Cadastro — Tutor'}</CardTitle>
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
                  <button type="button" onClick={() => setMode('register')} className="text-emerald-600 hover:underline">Cadastrar</button>
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
                <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {loading ? 'Cadastrando...' : 'Criar conta'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-emerald-600 hover:underline">Entrar</button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
