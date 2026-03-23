'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Building2,
  Users,
  Zap,
  Coins,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
  Shield,
  AlertTriangle,
} from 'lucide-react'

interface Client {
  id: string
  name: string
  slug: string
  plan: string
  customPrompt: string | null
  membersCount: number
  tokensToday: number
  costToday: number
  createdAt: string
}

function ClinicRow({ client }: { client: Client }) {
  const [expanded, setExpanded] = useState(false)
  const [prompt, setPrompt] = useState(client.customPrompt ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: client.id, prompt }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const formatTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

  return (
    <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <Building2 className="size-4 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{client.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{client.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <Badge variant="outline" className="text-[10px] uppercase hidden sm:flex">
            {client.plan}
          </Badge>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-mono text-muted-foreground">
              {formatTokens(client.tokensToday)} tokens
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              ${client.costToday.toFixed(3)} hoje
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" />
            {client.membersCount}
          </div>
          {client.customPrompt && (
            <Badge className="text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/20 hidden sm:flex">
              prompt
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/30 p-4 space-y-3 bg-muted/5">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="bg-background/80 rounded-lg p-2 border border-border/30">
              <p className="font-mono font-bold text-lg">{formatTokens(client.tokensToday)}</p>
              <p className="text-muted-foreground">tokens hoje</p>
            </div>
            <div className="bg-background/80 rounded-lg p-2 border border-border/30">
              <p className="font-mono font-bold text-lg">${client.costToday.toFixed(3)}</p>
              <p className="text-muted-foreground">custo hoje</p>
            </div>
            <div className="bg-background/80 rounded-lg p-2 border border-border/30">
              <p className="font-mono font-bold text-lg">{client.membersCount}</p>
              <p className="text-muted-foreground">membros</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Prompt customizado
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">{client.id.substring(0, 8)}…</p>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Deixe vazio para usar o prompt padrão do sistema..."
              className="min-h-[100px] text-xs bg-background/50 border-border/50 resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                Este prompt é adicionado ao contexto desta clínica em todas as interações de IA.
              </p>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className={`h-7 text-xs ${saved ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'} text-white border-0`}
              >
                {saving ? (
                  <RefreshCw className="size-3 mr-1 animate-spin" />
                ) : (
                  <Save className="size-3 mr-1" />
                )}
                {saved ? 'Salvo!' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [checkRes, clientsRes] = await Promise.all([
        fetch('/api/admin/check'),
        fetch('/api/admin/clients'),
      ])
      const checkData = await checkRes.json()
      setIsAdmin(checkData.isAdmin)

      if (checkData.isAdmin) {
        const clientsData = await clientsRes.json()
        setClients(clientsData.clients || [])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh] gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="size-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground text-center">
          Esta área é restrita ao administrador do sistema.
        </p>
      </div>
    )
  }

  const totalTokens = clients.reduce((s, c) => s + c.tokensToday, 0)
  const totalCost = clients.reduce((s, c) => s + c.costToday, 0)
  const totalMembers = clients.reduce((s, c) => s + c.membersCount, 0)
  const formatTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="size-5 text-emerald-500" />
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              Sistema
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Gestão de clínicas, prompts e uso de IA
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-border/50 bg-transparent hover:bg-muted/50"
        >
          <RefreshCw className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Clínicas', value: clients.length, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { title: 'Membros', value: totalMembers, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { title: 'Tokens Hoje', value: formatTokens(totalTokens), icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { title: 'Custo Hoje', value: `$${totalCost.toFixed(2)}`, icon: Coins, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((s) => (
          <Card key={s.title} className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                {s.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${s.bg}`}>
                <s.icon className={`size-4 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Clients list */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-border/30 mb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-5 text-emerald-500" />
            Clínicas ({clients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/50">
              <Building2 className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma clínica cadastrada ainda</p>
            </div>
          ) : (
            clients.map((client) => <ClinicRow key={client.id} client={client} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
