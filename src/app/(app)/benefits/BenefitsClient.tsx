'use client'

import { useMemo, useState } from 'react'
import type { Card, Club, Category } from '@/lib/types'
import { CATEGORY_LABEL_HE } from '@/lib/types'

export function BenefitsClient({
  cards,
  clubs,
  categories,
}: {
  cards: Card[]
  clubs: Club[]
  categories: Category[]
}) {
  const [filter, setFilter] = useState<Category | 'all'>('all')

  const benefits = useMemo(() => {
    const list: { provider: string; emoji: string; label: string; category: Category; pct: number; kind: 'card' | 'club' }[] = []
    for (const c of cards) {
      for (const [cat, pct] of Object.entries(c.category_bonuses)) {
        list.push({
          provider: c.name,
          emoji: c.logo_emoji,
          label: 'Cashback',
          category: cat as Category,
          pct: Number(pct),
          kind: 'card',
        })
      }
    }
    for (const c of clubs) {
      for (const [cat, pct] of Object.entries(c.category_bonuses)) {
        list.push({
          provider: c.name,
          emoji: c.logo_emoji,
          label: 'הנחה',
          category: cat as Category,
          pct: Number(pct),
          kind: 'club',
        })
      }
    }
    return list
      .filter((b) => filter === 'all' || b.category === filter)
      .sort((a, b) => b.pct - a.pct)
  }, [cards, clubs, filter])

  return (
    <div className="px-5 pt-6 pb-4 space-y-4">
      <header>
        <div className="text-xs text-primary font-semibold">PULL · מרכז שליטה</div>
        <h1 className="text-2xl font-bold mt-0.5">כל ההטבות שלך</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {benefits.length} הטבות פעילות · מסוננות לפי קטגוריה.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')} label="הכל" />
        {categories.map((c) => (
          <Chip
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
            label={CATEGORY_LABEL_HE[c]}
          />
        ))}
      </div>

      <div className="space-y-2">
        {benefits.map((b, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border bg-card p-3"
          >
            <div className="text-2xl">{b.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{b.provider}</div>
              <div className="text-xs text-muted-foreground">
                {b.label} · {CATEGORY_LABEL_HE[b.category]} · {b.kind === 'card' ? 'כרטיס' : 'מועדון'}
              </div>
            </div>
            <div className="text-lg font-bold text-primary shrink-0">{b.pct}%</div>
          </div>
        ))}
        {benefits.length === 0 && (
          <div className="text-sm text-muted-foreground bg-muted rounded-xl p-4 text-center">
            אין הטבות לקטגוריה הזו.
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full border transition ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground'
      }`}
    >
      {label}
    </button>
  )
}
