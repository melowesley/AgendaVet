'use client'

import { useEffect, useState, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  title: string | null
  pet_id: string | null
  model_used: string
  created_at: string
  updated_at: string
}

interface ConversationSidebarProps {
  activeId: string | null
  petId: string | null
  onSelect: (conversationId: string) => void
  onNew: () => void
}

export function ConversationSidebar({
  activeId,
  petId,
  onSelect,
  onNew,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (petId) params.set('petId', petId)
      params.set('limit', '30')
      const res = await fetch(`/api/vet-copilot/conversations?${params}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [petId])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (activeId) {
      const interval = setInterval(fetchConversations, 10000)
      return () => clearInterval(interval)
    }
  }, [activeId, fetchConversations])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'Agora'
    if (diffMin < 60) return `${diffMin}min`
    if (diffHrs < 24) return `${diffHrs}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button
          onClick={onNew}
          variant="outline"
          className="w-full justify-start gap-2 text-sm"
        >
          <Plus className="size-4" />
          Nova conversa
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-2 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma conversa ainda
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'w-full text-left rounded-md px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  activeId === conv.id && 'bg-accent text-accent-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">
                    {conv.title || 'Conversa sem titulo'}
                  </span>
                </div>
                <div className="mt-0.5 pl-5 text-xs text-muted-foreground">
                  {formatDate(conv.updated_at)}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
