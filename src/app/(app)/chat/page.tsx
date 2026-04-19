'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Msg = { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'איפה הכי משתלם לי לאכול היום?',
  'איזה כרטיס מומלץ לקניה בשופרסל?',
  'אילו נקודות שלי פג תוקפן בקרוב?',
  'מה ההטבה הכי טובה שיש לי?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'שגיאה' }))
        setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${err.error ?? 'שגיאה'}` }])
        return
      }

      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      setMessages((m) => [...m, { role: 'assistant', content: '' }])

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: acc }
          return copy
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)]">
      <header className="px-5 pt-6 pb-3">
        <div className="text-xs text-primary font-semibold">🧠 עוזר AI</div>
        <h1 className="text-2xl font-bold mt-0.5">שאל/י אותי על ההטבות שלך</h1>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              תוכל/י לשאול אותי איפה לקנות, באיזה כרטיס לשלם, או אילו נקודות לממש. הנה כמה רעיונות:
            </p>
            <div className="space-y-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-right rounded-2xl border bg-card p-3 text-sm active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-2xl px-3 py-2 max-w-[85%] whitespace-pre-wrap text-sm ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground self-end ms-auto'
                : 'bg-card border'
            }`}
          >
            {m.content || (loading && i === messages.length - 1 ? '...' : '')}
          </div>
        ))}
        <div className="h-4" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="p-3 border-t bg-card/95 backdrop-blur flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="שאל/י..."
          className="flex-1 h-11"
          disabled={loading}
        />
        <Button type="submit" className="h-11" disabled={loading || !input.trim()}>
          שלח
        </Button>
      </form>
    </div>
  )
}
