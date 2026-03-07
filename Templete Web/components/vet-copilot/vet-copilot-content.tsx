'use client'

/**
 * VetCopilotContent - Componente principal do Assistente Clínico Veterinário
 * 
 * Interface de chat especializada com:
 * - Seleção de pet para contexto
 * - Sugestões contextuais clínicas
 * - Integração com tools do copilot
 */

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { usePets, useOwners } from '@/lib/data-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Bot, User, Stethoscope, FileText, Syringe, Pill, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

// Sugestões contextuais para veterinários
const CLINICAL_SUGGESTIONS = [
  { icon: FileText, label: 'Resumir histórico', prompt: 'Resuma o histórico clínico completo deste paciente' },
  { icon: Stethoscope, label: 'Diagnósticos diferenciais', prompt: 'Quais os principais diagnósticos diferenciais para os sintomas apresentados?' },
  { icon: Syringe, label: 'Vacinas pendentes', prompt: 'Quais vacinas estão pendentes ou próximas do vencimento?' },
  { icon: Pill, label: 'Calcular dose', prompt: 'Calcule a dose de [medicação] para este paciente' },
  { icon: AlertCircle, label: 'Interações', prompt: 'Verifique interações medicamentosas com as medicações atuais' },
]

// Helper para extrair texto das mensagens
function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts || !Array.isArray(message.parts)) return ''
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
}

interface VetCopilotContentProps {
  initialPetId?: string;
}

export function VetCopilotContent({ initialPetId }: VetCopilotContentProps) {
  const { pets } = usePets()
  const { owners } = useOwners()
  const [selectedPetId, setSelectedPetId] = useState<string | null>(initialPetId || null)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Configura chat com transport customizado
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/vet-copilot',
      body: {
        model: 'anthropic/claude-sonnet-4',
        temperature: 0.3,
        petId: selectedPetId,
      },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Limpa chat quando troca de pet
  useEffect(() => {
    setMessages([])
  }, [selectedPetId, setMessages])

  const selectedPet = pets.find(p => p.id === selectedPetId)
  const owner = selectedPet ? owners.find(o => o.id === selectedPet.ownerId) : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      sendMessage({ text: input })
      setInput('')
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const applySuggestion = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] p-3 md:p-6">
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="border-b py-2 md:py-3 px-3 md:px-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-primary">
                <Stethoscope className="size-5" />
                <span className="font-semibold">AgentVet Clinical Copilot</span>
              </div>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                Claude Sonnet 4
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedPetId || 'none'}
                onValueChange={(value) => setSelectedPetId(value === 'none' ? null : value)}
              >
                <SelectTrigger className="w-[200px] text-sm">
                  <SelectValue placeholder="Selecionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum paciente</SelectItem>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species === 'dog' ? 'Cão' : pet.species === 'cat' ? 'Gato' : pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8" 
                onClick={clearChat} 
                disabled={messages.length === 0}
              >
                <MessageSquare className="size-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
          {/* Contexto do paciente */}
          {selectedPet && (
            <div className="border-b bg-muted/50 px-3 md:px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Paciente:</span>
                <span className="text-primary">{selectedPet.name}</span>
                <span className="text-muted-foreground">|</span>
                <span>{selectedPet.name} ({selectedPet.species === 'dog' ? 'Cão' : selectedPet.species === 'cat' ? 'Gato' : selectedPet.species})</span>
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
                <h3 className="text-base md:text-lg font-medium">Assistente Clínico Veterinário</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  Apoio clínico baseado em evidências para auxiliar nas suas consultas.
                  Selecione um paciente para carregar o contexto automático.
                </p>
                
                {/* Disclaimer de segurança */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md">
                  <p className="text-xs text-amber-800">
                    <strong>⚠️ Aviso:</strong> Este assistente é uma ferramenta de apoio clínico. 
                    A decisão final sempre é do veterinário responsável.
                  </p>
                </div>

                {/* Sugestões contextuais */}
                <div className="mt-6">
                  <p className="text-xs text-muted-foreground mb-3">Sugestões rápidas:</p>
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
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:my-2 prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-background/50 prose-pre:text-xs">
                          <ReactMarkdown>{getMessageText(message)}</ReactMarkdown>
                        </div>
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

          {/* Input area */}
          <form onSubmit={handleSubmit} className="border-t p-3 md:p-4 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedPetId 
                ? "Pergunte sobre o paciente..." 
                : "Selecione um paciente primeiro"
              }
              className="min-h-[44px] max-h-24 md:max-h-32 resize-none text-sm md:text-base"
              rows={1}
              disabled={isLoading || !selectedPetId}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0" 
              disabled={isLoading || !input.trim() || !selectedPetId}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
