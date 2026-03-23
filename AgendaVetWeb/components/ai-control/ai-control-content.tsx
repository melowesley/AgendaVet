'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Bot,
  Activity,
  Coins,
  Zap,
  Send,
  RefreshCw,
  Circle,
  AlertCircle,
  BarChart2,
} from 'lucide-react'

interface Metrics {
  totalAgents: number
  activeAgents: number
  tokensToday: number
  estimatedCost: number
  source: string
}

interface Agent {
  id: string
  userId: string
  status: 'online' | 'offline'
  tokensToday: number
  model: string
  lastSeen: string
}

export function AiControlContent() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [prompt, setPrompt] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [deployMsg, setDeployMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [metricsRes, agentsRes] = await Promise.all([
        fetch('/api/ai-control/metrics'),
        fetch('/api/ai-control/agents'),
      ])
      const metricsData = await metricsRes.json()
      const agentsData = await agentsRes.json()
      setMetrics(metricsData)
      setAgents(agentsData.agents || [])
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

  const handleDeploy = async () => {
    if (!prompt.trim()) return
    setDeploying(true)
    setDeployMsg(null)
    try {
      const res = await fetch('/api/ai-control/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (res.ok) {
        setDeployMsg(data.message || 'Prompt enviado com sucesso')
        setPrompt('')
      } else {
        setDeployMsg(data.error || 'Erro ao enviar prompt')
      }
    } catch {
      setDeployMsg('Erro de conexão')
    } finally {
      setDeploying(false)
    }
  }

  const formatTokens = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Agentes Totais',
      value: metrics?.totalAgents ?? 0,
      icon: Bot,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Agentes Ativos',
      value: metrics?.activeAgents ?? 0,
      icon: Activity,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Tokens Hoje',
      value: formatTokens(metrics?.tokensToday ?? 0),
      icon: Zap,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      title: 'Custo Estimado',
      value: `$${(metrics?.estimatedCost ?? 0).toFixed(2)}`,
      icon: Coins,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Control Tower</h1>
          <p className="text-muted-foreground text-sm">
            Monitore e controle os agentes de IA do AgendaVet
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

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{stat.value}</div>
              {metrics?.source === 'mock' && (
                <p className="text-[10px] text-muted-foreground mt-1">Sem dados hoje</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Agents List */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/30 mb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BarChart2 className="size-5 text-emerald-500" />
              Agentes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/50">
                <AlertCircle className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum agente ativo hoje
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Os agentes aparecem após interações com IA
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Bot className="size-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-mono">
                          {agent.userId.substring(0, 8)}…
                        </p>
                        <p className="text-xs text-muted-foreground">{agent.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-mono font-medium">
                          {formatTokens(agent.tokensToday)} tokens
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-500/50 text-emerald-500 bg-emerald-500/5 gap-1"
                      >
                        <Circle className="size-1.5 fill-emerald-500" />
                        online
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prompt Deploy */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/30 mb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Send className="size-5 text-emerald-500" />
              Deploy de Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Atualize o contexto ou instrução enviada a todos os agentes de IA.
            </p>
            <Textarea
              placeholder="Digite o novo prompt ou instrução para os agentes..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[140px] bg-background/50 border-border/50 resize-none text-sm"
            />
            {deployMsg && (
              <div
                className={`text-sm px-3 py-2 rounded-lg ${
                  deployMsg.includes('Erro') || deployMsg.includes('rro')
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {deployMsg}
              </div>
            )}
            <Button
              onClick={handleDeploy}
              disabled={deploying || !prompt.trim()}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              {deploying ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Enviar para todos os agentes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
