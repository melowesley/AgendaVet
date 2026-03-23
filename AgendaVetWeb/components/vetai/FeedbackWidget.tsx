'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackWidgetProps {
  interactionId: string
  onFeedback?: (score: number) => void
}

export function VetAIFeedbackWidget({ interactionId, onFeedback }: FeedbackWidgetProps) {
  const [feedback, setFeedback] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const handleFeedback = async (score: number) => {
    if (saving || feedback !== null) return
    setSaving(true)
    setFeedback(score)

    try {
      await fetch('/api/vetai/interactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: interactionId,
          type: 'feedback',
          feedback: score,
          followedSuggestion: score >= 4,
        }),
      })
      onFeedback?.(score)
    } catch {
      // fail silently — feedback is best-effort
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-xs text-muted-foreground">Útil?</span>
      <button
        onClick={() => handleFeedback(5)}
        disabled={saving || feedback !== null}
        title="Sugestão útil"
        className={cn(
          'rounded p-0.5 transition-colors',
          feedback === 5
            ? 'text-green-600'
            : 'text-muted-foreground hover:text-green-600 disabled:opacity-40'
        )}
      >
        <ThumbsUp className="size-3.5" />
      </button>
      <button
        onClick={() => handleFeedback(1)}
        disabled={saving || feedback !== null}
        title="Sugestão não útil"
        className={cn(
          'rounded p-0.5 transition-colors',
          feedback === 1
            ? 'text-red-600'
            : 'text-muted-foreground hover:text-red-600 disabled:opacity-40'
        )}
      >
        <ThumbsDown className="size-3.5" />
      </button>
      {feedback !== null && (
        <span className="text-xs text-muted-foreground">Obrigado!</span>
      )}
    </div>
  )
}
