'use client'

import { useState } from 'react'
import { useAgentSettings } from '@/lib/data-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Bot,
  Building2,
  Bell,
  Shield,
  Database,
  ChevronRight,
} from 'lucide-react'
import { AgentSettingsDialog } from '@/components/assistant/agent-settings-dialog'

export function SettingsContent() {
  const { settings } = useAgentSettings()
  const [agentSettingsOpen, setAgentSettingsOpen] = useState(false)

  const settingsSections = [
    {
      title: 'Assistente IA',
      description: 'Configure o comportamento, modelo e prompt do sistema do chatbot IA',
      icon: Bot,
      badge: settings.model.split('/').pop(),
      onClick: () => setAgentSettingsOpen(true),
    },
    {
      title: 'Informações da Clínica',
      description: 'Atualize o nome, endereço e detalhes de contato da sua clínica',
      icon: Building2,
      badge: null,
      onClick: () => { },
      disabled: true,
    },
    {
      title: 'Notificações',
      description: 'Gerencie preferências de notificação por email e SMS',
      icon: Bell,
      badge: null,
      onClick: () => { },
      disabled: true,
    },
    {
      title: 'Segurança',
      description: 'Senha, autenticação de dois fatores e gerenciamento de sessão',
      icon: Shield,
      badge: null,
      onClick: () => { },
      disabled: true,
    },
    {
      title: 'Dados e Armazenamento',
      description: 'Backup, exportação e gerenciamento dos dados da sua clínica',
      icon: Database,
      badge: null,
      onClick: () => { },
      disabled: true,
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua clínica e aplicação</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Configurações do Aplicativo
          </CardTitle>
          <CardDescription>
            Configure suas preferências do aplicativo AgendaVet
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {settingsSections.map((section, index) => (
            <div key={section.title}>
              {index > 0 && <Separator />}
              <button
                type="button"
                onClick={section.onClick}
                disabled={section.disabled}
                className="flex items-center gap-4 w-full p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <section.icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{section.title}</h3>
                    {section.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {section.badge}
                      </Badge>
                    )}
                    {section.disabled && (
                      <Badge variant="outline" className="text-xs">
                        Em Breve
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sobre o AgendaVet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versão</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ambiente</span>
            <Badge variant="secondary">Desenvolvimento</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Armazenamento de Dados</span>
            <span className="font-medium">Em Memória (Demo)</span>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">
            AgendaVet é uma solução completa de gestão para clínicas veterinárias. Conecte uma integração com banco de dados
            para habilitar o armazenamento persistente de dados.
          </p>
        </CardContent>
      </Card>

      <AgentSettingsDialog open={agentSettingsOpen} onOpenChange={setAgentSettingsOpen} />
    </div>
  )
}
