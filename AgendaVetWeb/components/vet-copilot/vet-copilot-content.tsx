'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { usePets, useOwners } from '@/lib/data-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { MessageSquare, Send, Bot, User, Stethoscope, FileText, Syringe, Pill, AlertCircle, Loader2, PanelLeftOpen, Plus, Brain, Camera, Zap, BookOpen, Heart, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { ConversationSidebar } from './conversation-sidebar'
import { VetAIFeedbackWidget } from '@/components/vetai/FeedbackWidget'
import { AI_MODELS } from '@agendavet/shared/constants'

const CLINICAL_SUGGESTIONS = [
  { icon: FileText, label: 'Resumir historico', prompt: 'Resuma o historico clinico completo deste paciente' },
  { icon: Stethoscope, label: 'Diagnosticos diferenciais', prompt: 'Quais os principais diagnosticos diferenciais para os sintomas apresentados?' },
  { icon: Syringe, label: 'Vacinas pendentes', prompt: 'Quais vacinas estao pendentes ou proximas do vencimento?' },
  { icon: Pill, label: 'Calcular dose', prompt: 'Calcule a dose de [medicacao] para este paciente' },
  { icon: AlertCircle, label: 'Interacoes', prompt: 'Verifique interacoes medicamentosas com as medicacoes atuais' },
]

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts || !Array.isArray(message.parts)) return ''
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
}

interface VetCopilotContentProps {
  initialPetId?: string
}

export function VetCopilotContent({ initialPetId }: VetCopilotContentProps) {
  const { pets } = usePets()
  const { owners } = useOwners()
  const [selectedPetId, setSelectedPetId] = useState<string | null>(initialPetId || null)
  const [selectedModel, setSelectedModel] = useState<string>('auto')
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCostWarning, setShowCostWarning] = useState(false)
  const [pendingModel, setPendingModel] = useState<string | null>(null)
  const [interactionIds, setInteractionIds] = useState<Record<string, string>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastUserMessageRef = useRef<string>('')

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/vet-copilot',
      body: {
        petId: selectedPetId,
        conversationId,
        model: selectedModel === 'auto' ? undefined : selectedModel,
      },
    }),
    onFinish: async ({ message }) => {
      const responseText = getMessageText(message as any)
      if (!responseText || !lastUserMessageRef.current) return

      try {
        const res = await fetch('/api/vetai/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queryText: lastUserMessageRef.current,
            queryType: 'duvida_geral',
            patientContext: selectedPetId ? { petId: selectedPetId } : {},
            suggestions: [{ text: responseText }],
            modelVersion: selectedModel === 'auto' ? 'auto' : selectedModel,
            sessionId: conversationId,
          }),
        })
        if (res.ok) {
          const { id } = await res.json()
          setInteractionIds((prev) => ({ ...prev, [message.id]: id }))
        }
      } catch {
        // fail silently — logging is best-effort
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const handleModelChange = (model: string) => {
    const premiumModels = ['claude-sonnet', 'gpt-4o', 'gemini-2.5-pro', 'gemini-1.5-pro']

    if (premiumModels.includes(model)) {
      setPendingModel(model)
      setShowCostWarning(true)
    } else {
      setSelectedModel(model)
    }
  }

  const confirmPremiumModel = () => {
    if (pendingModel) {
      setSelectedModel(pendingModel)
      setPendingModel(null)
      setShowCostWarning(false)
    }
  }

  const cancelPremiumModel = () => {
    setPendingModel(null)
    setShowCostWarning(false)
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/vet-copilot/conversations?conversationId=${convId}`)
      if (!res.ok) return
      const data = await res.json()
      const loaded = (data.messages || []).map((m: any, i: number) => ({
        id: m.id || `msg-${i}`,
        role: m.role,
        parts: [{ type: 'text' as const, text: m.content }],
      }))
      setMessages(loaded)
      setConversationId(convId)
      setSidebarOpen(false)
    } catch {
      // silently fail
    }
  }, [setMessages])

  const startNewConversation = useCallback(() => {
    setConversationId(null)
    setMessages([])
    setInteractionIds({})
    setSidebarOpen(false)
  }, [setMessages])

  useEffect(() => {
    setConversationId(null)
    setMessages([])
    setInteractionIds({})
  }, [selectedPetId, setMessages])

  const selectedPet = pets.find(p => p.id === selectedPetId)
  const owner = selectedPet ? owners.find(o => o.id === selectedPet.ownerId) : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    lastUserMessageRef.current = input
    sendMessage({ text: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      lastUserMessageRef.current = input
      sendMessage({ text: input })
      setInput('')
    }
  }

  const applySuggestion = (prompt: string) => {
    setInput(prompt)
  }

  const sidebarContent = (
    <ConversationSidebar
      activeId={conversationId}
      petId={selectedPetId}
      onSelect={loadConversation}
      onNew={startNewConversation}
    />
  )

  return (
    <div className="flex h-[calc(100vh-3.5rem)] p-3 md:p-6 gap-3">
      {/* Sidebar desktop */}
      <Card className="hidden lg:flex w-72 flex-col min-h-0 overflow-hidden">
        {sidebarContent}
      </Card>

      {/* Chat principal */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="border-b py-2 md:py-3 px-3 md:px-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Sidebar toggle mobile */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 lg:hidden">
                    <PanelLeftOpen className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  {sidebarContent}
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 text-primary">
                <Stethoscope className="size-5" />
                <span className="font-semibold hidden sm:inline">Vet AI</span>
              </div>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                AI
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedPetId || 'none'}
                onValueChange={(value) => setSelectedPetId(value === 'none' ? null : value)}
              >
                <SelectTrigger className="w-[160px] md:w-[200px] text-sm">
                  <SelectValue placeholder="Selecionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum paciente</SelectItem>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species === 'dog' ? 'Cao' : pet.species === 'cat' ? 'Gato' : pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedModel}
                onValueChange={handleModelChange}
              >
                <SelectTrigger className="w-[140px] md:w-[160px] text-sm">
                  <SelectValue placeholder="Modelo AI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <span>🔄 Automático</span>
                        <Badge variant="outline" className="text-xs">Grátis</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Seleção inteligente baseada na tarefa</span>
                    </div>
                  </SelectItem>

                  {/* Modelos Gratuitos */}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Modelos Gratuitos</div>

                  <SelectItem value="deepseek-r1">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <Brain className="size-4" />
                        <span>DeepSeek R1</span>
                        <Badge variant="secondary" className="text-xs">Grátis</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Raciocínio Clínico - Diagnóstico diferencial</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="gemini-2.0-flash">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <Zap className="size-4" />
                        <span>Gemini 2.0 Flash</span>
                        <Badge variant="secondary" className="text-xs">Grátis</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Emergências - Triagem rápida</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="gemini-2.5-flash">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <Activity className="size-4" />
                        <span>Gemini 2.5 Flash</span>
                        <Badge variant="secondary" className="text-xs">Grátis</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Análise Laboratorial - Exames</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="gemini-1.5-flash">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <Heart className="size-4" />
                        <span>Gemini 1.5 Flash</span>
                        <Badge variant="secondary" className="text-xs">Grátis</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Medicina Preventiva - Wellness</span>
                    </div>
                  </SelectItem>

                  {/* Modelos Premium */}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Modelos Premium</div>

                  <SelectItem value="gemini-2.5-pro">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4" />
                        <span>Gemini 2.5 Pro</span>
                        <Badge variant="destructive" className="text-xs">$</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Pesquisa - Literatura científica</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="gemini-1.5-pro">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="size-4" />
                        <span>Gemini 1.5 Pro</span>
                        <Badge variant="destructive" className="text-xs">$</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Terapia Intensiva - UTI</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="claude-sonnet">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <Camera className="size-4" />
                        <span>Claude Sonnet</span>
                        <Badge variant="destructive" className="text-xs">$</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Análise de Imagens - Radiografias</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="gpt-4o">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="size-4" />
                        <span>GPT-4o</span>
                        <Badge variant="destructive" className="text-xs">$</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Planejamento Cirúrgico</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={startNewConversation}
                title="Nova conversa"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
          {selectedPet && (
            <div className="border-b bg-muted/50 px-3 md:px-4 py-2">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="font-medium">Paciente:</span>
                <span className="text-primary">{selectedPet.name}</span>
                <span className="text-muted-foreground">|</span>
                <span>{selectedPet.species === 'dog' ? 'Cao' : selectedPet.species === 'cat' ? 'Gato' : selectedPet.species}</span>
                {selectedPet.weight > 0 && (
                  <>
                    <span className="text-muted-foreground">|</span>
                    <span>{selectedPet.weight} kg</span>
                  </>
                )}
                {owner && (
                  <>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">Tutor: {owner.firstName} {owner.lastName}</span>
                  </>
                )}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 md:py-12 px-2">
                <div className="size-12 md:size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Stethoscope className="size-6 md:size-8 text-primary" />
                </div>
                <h3 className="text-base md:text-lg font-medium">Assistente Clinico Veterinario</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  Apoio clinico baseado em evidencias para auxiliar nas suas consultas.
                  Selecione um paciente para carregar o contexto automatico.
                </p>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md">
                  <p className="text-xs text-amber-800">
                    <strong>Aviso:</strong> Este assistente e uma ferramenta de apoio clinico.
                    A decisao final sempre e do veterinario responsavel.
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-muted-foreground mb-3">Sugestoes rapidas:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {CLINICAL_SUGGESTIONS.map((suggestion) => (
                      <Button
                        key={suggestion.label}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-transparent"
                        onClick={() => applySuggestion(suggestion.prompt)}
                        disabled={!selectedPetId}
                      >
                        <suggestion.icon className="size-3 mr-1" />
                        {suggestion.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-2 md:gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex size-7 md:size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="size-3.5 md:size-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 md:px-4 max-w-[85%] md:max-w-[75%]',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap break-words">{getMessageText(message)}</p>
                      ) : (
                        <>
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:my-2 prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-background/50 prose-pre:text-xs">
                            <ReactMarkdown>{getMessageText(message)}</ReactMarkdown>
                          </div>
                          {interactionIds[message.id] && (
                            <VetAIFeedbackWidget interactionId={interactionIds[message.id]} />
                          )}
                        </>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="flex size-7 md:size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <User className="size-3.5 md:size-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 md:gap-3">
                    <div className="flex size-7 md:size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="size-3.5 md:size-4" />
                    </div>
                    <div className="rounded-lg px-3 py-2 md:px-4 bg-muted">
                      <Loader2 className="size-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSubmit} className="border-t p-3 md:p-4 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedPetId
                ? 'Pergunte sobre o paciente...'
                : 'Pergunte qualquer coisa sobre medicina veterinaria...'
              }
              className="min-h-[44px] max-h-24 md:max-h-32 resize-none text-sm md:text-base"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showCostWarning} onOpenChange={setShowCostWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Modelo Premium Selecionado</AlertDialogTitle>
            <AlertDialogDescription>
              Você selecionou um modelo que consome créditos pagos.
              Este modelo será cobrado por uso real, independente de ser usado como primário ou fallback.
              <br /><br />
              <strong>Modelo selecionado:</strong> {
                pendingModel === 'claude-sonnet' ? 'Claude Sonnet (Anthropic) - Análise de Imagens' :
                  pendingModel === 'gpt-4o' ? 'GPT-4o (OpenAI) - Planejamento Cirúrgico' :
                    pendingModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro (Google) - Pesquisa Veterinária' :
                      pendingModel === 'gemini-1.5-pro' ? 'Gemini 1.5 Pro (Google) - Terapia Intensiva' :
                        'Modelo Premium'
              }
              <br />
              <strong>Custo aproximado:</strong> {
                pendingModel === 'claude-sonnet' ? '$0.003/1k input + $0.015/1k output' :
                  pendingModel === 'gpt-4o' ? '$0.0025/1k input + $0.01/1k output' :
                    pendingModel === 'gemini-2.5-pro' ? '$0.00125/1k input + $0.005/1k output' :
                      pendingModel === 'gemini-1.5-pro' ? '$0.00125/1k input + $0.005/1k output' :
                        'Custo premium'
              }
              <br /><br />
              Deseja continuar mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPremiumModel}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPremiumModel}>
              Confirmar e Usar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
