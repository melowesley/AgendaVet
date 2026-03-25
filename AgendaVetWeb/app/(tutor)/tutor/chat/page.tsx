'use client'

import { useEffect, useState, useRef } from 'react'
import { TutorLayout } from '@/components/tutor/tutor-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, Bot, User, Sparkles, PawPrint } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Olá! Sou o **Chat IA AgendaVet**. Estou aqui para ajudar você com dúvidas sobre a saúde do seu pet, cuidados gerais, nutrição, vacinação e muito mais.\n\nComo posso ajudar hoje? 🐾',
  timestamp: new Date(),
}

const SUGGESTIONS = [
  'Quando devo vacinar meu cachorro?',
  'Quais são os sinais de que meu gato está doente?',
  'Com que frequência devo dar banho no meu pet?',
  'O que meu pet pode e não pode comer?',
]

function formatMessage(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
}

export default function TutorChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/tutor/login'); return }
      setAuthLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: 'tutor',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message || data.content || 'Desculpe, não consegui processar sua pergunta. Tente novamente.',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMsg])
      } else {
        throw new Error('API error')
      }
    } catch {
      // Resposta de fallback quando a API não está disponível
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, o chat IA está temporariamente indisponível. Para informações urgentes sobre a saúde do seu pet, entre em contato diretamente com a clínica. 🐾',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, fallbackMsg])
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (authLoading) return null

  return (
    <TutorLayout breadcrumbs={[{ label: 'Chat IA' }]}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">

        {/* Header do chat */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border/50 bg-card/30">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">Chat IA AgendaVet</p>
            <p className="text-xs text-muted-foreground">Assistente especializado em saúde pet</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-500">Online</span>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex size-8 items-center justify-center rounded-full shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {msg.role === 'assistant' ? <Bot className="size-4" /> : <User className="size-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-white rounded-tr-sm'
                  : 'bg-muted/50 text-foreground rounded-tl-sm border border-border/30'
              }`}>
                <p
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  className="leading-relaxed"
                />
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 shrink-0">
                <Bot className="size-4" />
              </div>
              <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugestões de perguntas */}
        {messages.length === 1 && (
          <div className="px-4 md:px-6 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 md:px-6 pb-4 pt-2 border-t border-border/50 bg-background/50">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre a saúde do seu pet... (Enter para enviar)"
              className="resize-none min-h-[44px] max-h-32 bg-muted/30 border-border/50 focus-visible:ring-emerald-500"
              rows={1}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              size="icon"
              className="h-11 w-11 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            O Chat IA é informativo e não substitui a consulta veterinária
          </p>
        </div>
      </div>
    </TutorLayout>
  )
}
