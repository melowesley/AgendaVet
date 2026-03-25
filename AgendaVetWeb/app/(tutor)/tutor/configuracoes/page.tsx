'use client'

import { useEffect, useState } from 'react'
import { TutorLayout } from '@/components/tutor/tutor-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { Settings, Bell, Shield, LogOut, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

export default function TutorConfiguracoesPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/tutor/login'); return }
      setLoading(false)
    }
    init()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/tutor/login')
  }

  const handleChangePassword = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user.email) return

    await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: `${window.location.origin}/tutor/configuracoes`,
    })
    alert('Link de redefinição de senha enviado para seu e-mail!')
  }

  return (
    <TutorLayout breadcrumbs={[{ label: 'Configurações' }]}>
      <div className="p-4 md:p-6 space-y-5 max-w-2xl">

        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie as preferências da sua conta</p>
        </div>

        {/* Aparência */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="size-4 text-emerald-500" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Modo Escuro</Label>
                <p className="text-xs text-muted-foreground">Usar tema escuro na interface</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={v => setTheme(v ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="size-4 text-emerald-500" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Notificações por e-mail</Label>
                <p className="text-xs text-muted-foreground">Receber lembretes de agendamentos por e-mail</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Confirmações de agendamento</Label>
                <p className="text-xs text-muted-foreground">Receber confirmação quando o agendamento for aprovado</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-emerald-500" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5"
              onClick={handleChangePassword}
            >
              Alterar Senha
            </Button>
            <p className="text-xs text-muted-foreground">Um link de redefinição será enviado para seu e-mail</p>
          </CardContent>
        </Card>

        {/* Sair */}
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-500">
              <AlertTriangle className="size-4" />
              Encerrar Sessão
            </CardTitle>
            <CardDescription>Você será desconectado da sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleLogout}
            >
              <LogOut className="size-4 mr-2" />
              Sair da Conta
            </Button>
          </CardContent>
        </Card>

      </div>
    </TutorLayout>
  )
}
