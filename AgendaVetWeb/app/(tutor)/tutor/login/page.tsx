'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { registerTutor } from '@/lib/auth/register'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HeartPulse, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TutorLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.replace('/tutor/dashboard')
    }
    check()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(
        error.message.includes('Invalid login credentials')
          ? 'E-mail ou senha incorretos. Verifique seus dados.'
          : error.message
      )
      setLoading(false)
      return
    }
    router.replace('/tutor/dashboard')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await registerTutor({ email, password, fullName: name })
      router.replace('/tutor/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/tutor/login`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess('Link de redefinição enviado! Verifique seu e-mail.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Lado esquerdo — branding (visível em telas maiores) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-background border-r border-border/30 p-12">
        <div className="max-w-sm text-center space-y-6">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <HeartPulse className="size-10" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              AgendaVet
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Área do Tutor</p>
          </div>
          <div className="space-y-3 text-left">
            {[
              'Gerencie seus pets em um só lugar',
              'Agende consultas com facilidade',
              'Acompanhe o histórico e finanças',
              'Chat IA para dúvidas sobre saúde',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">

          {/* Logo mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
              <HeartPulse className="size-5" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">AgendaVet</p>
              <p className="text-xs text-muted-foreground">Área do Tutor</p>
            </div>
          </div>

          {/* Título */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {mode === 'login' && 'Bem-vindo de volta'}
              {mode === 'register' && 'Criar sua conta'}
              {mode === 'forgot' && 'Redefinir senha'}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === 'login' && 'Entre com seu e-mail e senha'}
              {mode === 'register' && 'Cadastre-se para acessar a área do tutor'}
              {mode === 'forgot' && 'Enviaremos um link para seu e-mail'}
            </p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}

          {/* Formulário de login */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="mt-1 bg-muted/30 border-border/50 focus-visible:ring-emerald-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-emerald-500 hover:underline"
                  >
                    Esqueci a senha
                  </button>
                </div>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="bg-muted/30 border-border/50 focus-visible:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium h-11"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Não tem conta?{' '}
                <button type="button" onClick={() => { setMode('register'); setError(null) }} className="text-emerald-500 hover:underline font-medium">
                  Cadastre-se grátis
                </button>
              </p>
            </form>
          )}

          {/* Formulário de registro */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="mt-1 bg-muted/30 border-border/50 focus-visible:ring-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="reg-email">E-mail</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-1 bg-muted/30 border-border/50 focus-visible:ring-emerald-500"
                />
              </div>
              <div>
                <Label htmlFor="reg-password">Senha</Label>
                <div className="relative mt-1">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="bg-muted/30 border-border/50 focus-visible:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium h-11"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(null) }} className="text-emerald-500 hover:underline font-medium">
                  Entrar
                </button>
              </p>
            </form>
          )}

          {/* Recuperar senha */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">E-mail</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-1 bg-muted/30 border-border/50 focus-visible:ring-emerald-500"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium h-11"
              >
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </Button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mx-auto"
              >
                <ArrowLeft className="size-3.5" />
                Voltar para o login
              </button>
            </form>
          )}

          {/* Link para portal vet */}
          <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border/30">
            É veterinário?{' '}
            <Link href="/vet/dashboard" className="text-emerald-500 hover:underline">
              Acesse o portal da clínica
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
