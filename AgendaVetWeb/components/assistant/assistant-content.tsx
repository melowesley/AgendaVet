'use client'

import React from "react"

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useAgentSettings, usePets, useOwners, useAppointments } from '@/lib/data-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Send, Bot, User, Settings, Loader2, Stethoscope, Brain } from 'lucide-react'
import { AgentSettingsDialog } from './agent-settings-dialog'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Helper to extract text from UIMessage parts
function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts || !Array.isArray(message.parts)) return ''
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
}

export function AssistantContent() {
  const { settings } = useAgentSettings()
  const { pets } = usePets()
  const { owners } = useOwners()
  const { appointments } = useAppointments()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [clinicalMode, setClinicalMode] = useState(false)
  const [selectedPetId, setSelectedPetId] = useState<string>('none')
  const [brainModel, setBrainModel] = useState<'gemini' | 'deepseek' | 'kimi' | 'kimi-brain' | 'kimi-saas'>('gemini')
  const [kimiBrainMode, setKimiBrainMode] = useState(false)
  const [kimiSaasMode, setKimiSaasMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Carrega a preferência do modelo do localStorage ao montar
  useEffect(() => {
    const savedModel = localStorage.getItem('agendavet-brain-model')
    if (savedModel === 'gemini' || savedModel === 'deepseek' || savedModel === 'kimi' || savedModel === 'kimi-brain' || savedModel === 'kimi-saas') {
      setBrainModel(savedModel as 'gemini' | 'deepseek' | 'kimi' | 'kimi-brain' | 'kimi-saas')
      if (savedModel === 'kimi-brain') {
        setKimiBrainMode(true)
      } else if (savedModel === 'kimi-saas') {
        setKimiSaasMode(true)
      }
    }
  }, [])

  // Salva a preferência sempre que mudar
  const handleModelChange = (model: 'gemini' | 'deepseek' | 'kimi' | 'kimi-brain' | 'kimi-saas') => {
    setBrainModel(model)
    localStorage.setItem('agendavet-brain-model', model)
    if (model === 'kimi-brain') {
      setKimiBrainMode(true)
      setKimiSaasMode(false)
      setClinicalMode(false)
    } else if (model === 'kimi-saas') {
      setKimiBrainMode(false)
      setKimiSaasMode(true)
      setClinicalMode(false)
    } else {
      setKimiBrainMode(false)
      setKimiSaasMode(false)
    }
  }

  // Toggle KIMI Brain mode
  const toggleKimiBrainMode = () => {
    const newMode = !kimiBrainMode
    setKimiBrainMode(newMode)
    setKimiSaasMode(false)
    if (newMode) {
      setBrainModel('kimi-brain')
      localStorage.setItem('agendavet-brain-model', 'kimi-brain')
      setClinicalMode(false)
    } else {
      setBrainModel('gemini')
      localStorage.setItem('agendavet-brain-model', 'gemini')
    }
    setMessages([])
  }

  // Toggle KIMI Copilot SaaS mode
  const toggleKimiSaasMode = () => {
    const newMode = !kimiSaasMode
    setKimiSaasMode(newMode)
    setKimiBrainMode(false)
    if (newMode) {
      setBrainModel('kimi-saas')
      localStorage.setItem('agendavet-brain-model', 'kimi-saas')
      setClinicalMode(false)
    } else {
      setBrainModel('gemini')
      localStorage.setItem('agendavet-brain-model', 'gemini')
    }
    setMessages([])
  }

  // Build context about the clinic data
  const clinicContext = `
Current clinic data summary:
- Total pets: ${pets.length}
- Total owners: ${owners.length}
- Total appointments: ${appointments.length}
- Today's date: ${new Date().toLocaleDateString()}

Recent pets: ${pets.slice(0, 3).map((p) => `${p.name} (${p.species})`).join(', ')}
Recent owners: ${owners.slice(0, 3).map((o) => `${o.firstName} ${o.lastName}`).join(', ')}
`

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        model: brainModel === 'kimi-brain' || brainModel === 'kimi-saas' ? 'kimi' : (brainModel === 'deepseek' ? 'deepseek' : (clinicalMode ? 'gemini-1.5-pro' : settings.model)),
        temperature: clinicalMode || kimiBrainMode || kimiSaasMode ? 0.3 : settings.temperature,
        systemPrompt: (clinicalMode
          ? 'Você é o Vet Copilot, assistente clínico veterinário especializado da AgendaVet.'
          : kimiSaasMode
            ? 'Você é o KIMI Copilot SaaS - AI Control Brain do AgendaVet.'
            : kimiBrainMode
              ? 'Você é o KIMI Brain, o orquestrador central da AgendaVet.'
              : settings.systemPrompt.replace(/VetCRM/g, 'AgendaVet')) + '\n\n' + clinicContext,
        mode: clinicalMode ? 'clinical' : (kimiSaasMode ? 'kimi_copilot_saas' : (kimiBrainMode ? 'kimi_brain' : 'admin')),
        petId: clinicalMode && selectedPetId && selectedPetId !== 'none' ? selectedPetId : undefined,
        enableKimiBrain: kimiBrainMode,
        enableKimiCopilotSaas: kimiSaasMode,
      },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const clearChat = () => {
    setMessages([])
  }

  const toggleClinicalMode = () => {
    if (kimiBrainMode) {
      setKimiBrainMode(false)
      setBrainModel('gemini')
    }
    setClinicalMode(!clinicalMode)
    setMessages([]) // Limpa o chat ao trocar de modo
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    // Debug: Log do que está sendo enviado
    console.log("[FRONTEND DEBUG] Enviando mensagem:", {
      text: input,
      clinicalMode,
      selectedPetId,
      finalPetId: clinicalMode && selectedPetId && selectedPetId !== 'none' ? selectedPetId : undefined
    })
    
    sendMessage({ text: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      
      // Debug: Log do que está sendo enviado via Enter
      console.log("[FRONTEND DEBUG] Enviando mensagem (Enter):", {
        text: input,
        clinicalMode,
        selectedPetId,
        finalPetId: clinicalMode && selectedPetId && selectedPetId !== 'none' ? selectedPetId : undefined
      })
      
      sendMessage({ text: input })
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] p-3 md:p-6">
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="border-b py-2 md:py-3 px-3 md:px-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm md:text-base min-w-0">
              <Bot className={cn("size-4 md:size-5 shrink-0", kimiBrainMode ? "text-purple-500" : "text-primary")} />
              <span className="truncate">
                {kimiBrainMode ? 'KIMI Brain (Orquestrador)' : clinicalMode ? 'Vet Copilot (Clínico)' : settings.model.split('/').pop()}
              </span>
              {clinicalMode && <Stethoscope className="size-4 text-green-500" />}
              {kimiBrainMode && <Brain className="size-4 text-purple-500" />}
              <div className="ml-2 flex bg-muted rounded-md p-0.5 scale-90">
                <Button
                  variant={brainModel === 'gemini' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => handleModelChange('gemini')}
                  disabled={kimiBrainMode}
                >
                  Gemini
                </Button>
                <Button
                  variant={brainModel === 'deepseek' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => handleModelChange('deepseek')}
                  disabled={kimiBrainMode}
                >
                  DeepSeek
                </Button>
                <Button
                  variant={brainModel === 'kimi' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => handleModelChange('kimi')}
                  disabled={kimiBrainMode}
                >
                  Kimi
                </Button>
              </div>
            </div>
            <div className="flex gap-1 shrink-0 items-center">
              <div className="flex items-center gap-2 mr-2">
                <Switch
                  id="kimi-brain-mode"
                  checked={kimiBrainMode}
                  onCheckedChange={toggleKimiBrainMode}
                />
                <Label htmlFor="kimi-brain-mode" className="text-xs hidden md:inline text-purple-600">
                  KIMI Brain
                </Label>
              </div>
              <div className="flex items-center gap-2 mr-2">
                <Switch
                  id="clinical-mode"
                  checked={clinicalMode}
                  onCheckedChange={toggleClinicalMode}
                  disabled={kimiBrainMode}
                />
                <Label htmlFor="clinical-mode" className="text-xs hidden md:inline">
                  Modo Clínico
                </Label>
              </div>
              <Button variant="ghost" size="icon" className="size-8" onClick={clearChat} disabled={messages.length === 0}>
                <MessageSquare className="size-4" />
                <span className="sr-only">Clear Chat</span>
              </Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setSettingsOpen(true)}>
                <Settings className="size-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 md:py-12 px-2">
                <MessageSquare className={cn("size-10 md:size-12 text-muted-foreground/50 mb-3 md:mb-4", kimiBrainMode && "text-purple-500/50")} />
                <h3 className="text-base md:text-lg font-medium">
                  {kimiBrainMode ? 'KIMI Brain Ativado' : clinicalMode ? 'Modo Clínico Ativado' : 'How can I help you today?'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mt-1">
                  {kimiBrainMode
                    ? 'Eu sou o orquestrador central. Envie comandos como "KIMI melhore o diálogo" ou "KIMI delegue para Gemini".'
                    : clinicalMode
                    ? 'Selecione um paciente para consultar dados clínicos, histórico médico, vacinas e mais.'
                    : 'I can help with patient info, appointments, medical records, and veterinary questions.'}
                </p>
                {clinicalMode && (
                  <div className="w-full max-w-xs mt-4">
                    <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione um paciente...</SelectItem>
                        {pets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name} ({pet.species})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-2 mt-4 md:mt-6">
                  {kimiBrainMode ? [
                    "KIMI melhore o diálogo",
                    "KIMI delegue para Gemini",
                    "KIMI use DeepSeek",
                    "KIMI modo clínico",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs md:text-sm bg-purple-50/50 border-purple-200 hover:bg-purple-100"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  )) : clinicalMode ? [
                    "Histórico médico",
                    "Status vacinal",
                    "Medicações atuais",
                    "Calcular dose",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs md:text-sm bg-transparent"
                      onClick={() => setInput(suggestion)}
                      disabled={selectedPetId === 'none'}
                    >
                      {suggestion}
                    </Button>
                  )) : [
                    "How many pets?",
                    "Today's appointments",
                    "Anxious pet tips",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs md:text-sm bg-transparent"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
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

          <form
            onSubmit={handleSubmit}
            className="border-t p-3 md:p-4 flex gap-2"
          >
            {clinicalMode && (
              <div className="shrink-0">
                <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                  <SelectTrigger className="w-[140px] md:w-[180px]">
                    <SelectValue placeholder="Paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Paciente...</SelectItem>
                    {pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={kimiBrainMode ? "Comandos para KIMI Brain..." : clinicalMode ? "Pergunte sobre o paciente..." : "Ask about your clinic..."}
              className={cn("min-h-[44px] max-h-24 md:max-h-32 resize-none text-sm md:text-base", kimiBrainMode && "border-purple-200 focus:border-purple-400")}
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              disabled={isLoading || !input.trim() || (clinicalMode && selectedPetId === 'none')}
            >
              <Send className="size-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      <AgentSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
