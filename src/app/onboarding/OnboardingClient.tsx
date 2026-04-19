'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Card, Club, Persona } from '@/lib/types'
import { PERSONA_LABEL_HE } from '@/lib/types'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { CardTile } from '@/components/CardTile'
import { ClubTile } from '@/components/ClubTile'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

export function OnboardingClient({ cards, clubs }: { cards: Card[]; clubs: Club[] }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [name, setName] = useState('')
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const steps = ['פרופיל', 'כרטיסים', 'מועדונים']
  const progressPct = ((step + 1) / steps.length) * 100

  const suggestedCards = cards
    .filter((c) => {
      if (persona === 'student_reservist') return ['istudent', 'behatzdaa', 'amex_gold'].includes(c.id)
      if (persona === 'career_family') return ['hever_card', 'cal_plat', 'amex_gold', 'flycard'].includes(c.id)
      return true
    })

  const suggestedClubs = clubs
    .filter((c) => {
      if (persona === 'student_reservist') return ['general', 'student', 'military'].includes(c.audience)
      if (persona === 'career_family') return ['general', 'military', 'family'].includes(c.audience)
      return true
    })

  function toggle(set: Set<string>, id: string, setter: (s: Set<string>) => void) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  async function finish() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    await supabase.from('vw_profiles').upsert({
      id: user.id,
      name: name || user.email?.split('@')[0] || null,
      persona,
      onboarding_done: true,
    })

    if (selectedCards.size) {
      await supabase.from('vw_user_cards').upsert(
        [...selectedCards].map((card_id) => ({ user_id: user.id, card_id }))
      )
    }

    if (selectedClubs.size) {
      const in30d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const in180d = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const in10d = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const clubArr = [...selectedClubs]
      await supabase.from('vw_user_clubs').upsert(
        clubArr.map((club_id, i) => ({
          user_id: user.id,
          club_id,
          points: clubs.find((c) => c.id === club_id)?.default_points ?? 100,
          expires_at: i === 0 ? in10d : i === 1 ? in30d : in180d,
        }))
      )
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-dvh bg-background">
      <header className="mx-auto max-w-lg px-5 pt-6 pb-2 flex items-center justify-between">
        <Logo size={24} />
        <div className="text-xs text-muted-foreground">{step + 1} / {steps.length}</div>
      </header>
      <div className="mx-auto max-w-lg px-5">
        <Progress value={progressPct} className="h-1" />
      </div>

      <section className="mx-auto max-w-lg px-5 pt-6 pb-28">
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold">מי את/ה?</h1>
            <p className="text-muted-foreground mt-1">כדי שנתאים לך את ההטבות הנכונות.</p>

            <div className="mt-5">
              <label className="text-sm font-medium">איך לקרוא לך?</label>
              <Input
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם פרטי"
              />
            </div>

            <div className="mt-6 space-y-2">
              <div className="text-sm font-medium">הפרסונה שלך</div>
              {(['student_reservist', 'career_family', 'other'] as Persona[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPersona(p)}
                  className={`w-full text-right rounded-2xl border p-3 transition ${
                    persona === p ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="font-semibold">{PERSONA_LABEL_HE[p]}</div>
                  <div className="text-xs text-muted-foreground">
                    {p === 'student_reservist' && 'מתאים לסטודנטים ומילואימניקים'}
                    {p === 'career_family' && 'מתאים לאנשי קבע והורים'}
                    {p === 'other' && 'פרופיל כללי'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold">הכרטיסים שלך</h1>
            <p className="text-muted-foreground mt-1">בחר/י את כרטיסי האשראי שברשותך.</p>
            <div className="mt-2 text-xs text-muted-foreground">
              ⚡ הומלץ לפי הפרסונה: {suggestedCards.length} כרטיסים
            </div>
            <div className="mt-4 space-y-2">
              {suggestedCards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  selected={selectedCards.has(card.id)}
                  onToggle={() => toggle(selectedCards, card.id, setSelectedCards)}
                />
              ))}
              <details className="pt-2">
                <summary className="text-sm text-primary font-semibold cursor-pointer">עוד כרטיסים</summary>
                <div className="mt-2 space-y-2">
                  {cards.filter((c) => !suggestedCards.includes(c)).map((card) => (
                    <CardTile
                      key={card.id}
                      card={card}
                      selected={selectedCards.has(card.id)}
                      onToggle={() => toggle(selectedCards, card.id, setSelectedCards)}
                    />
                  ))}
                </div>
              </details>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold">המועדונים שלך</h1>
            <p className="text-muted-foreground mt-1">חבר/י את מועדוני הלקוחות שלך לסנכרון.</p>
            <div className="mt-4 space-y-2">
              {suggestedClubs.map((club) => (
                <ClubTile
                  key={club.id}
                  club={club}
                  selected={selectedClubs.has(club.id)}
                  onToggle={() => toggle(selectedClubs, club.id, setSelectedClubs)}
                />
              ))}
              <details className="pt-2">
                <summary className="text-sm text-primary font-semibold cursor-pointer">עוד מועדונים</summary>
                <div className="mt-2 space-y-2">
                  {clubs.filter((c) => !suggestedClubs.includes(c)).map((club) => (
                    <ClubTile
                      key={club.id}
                      club={club}
                      selected={selectedClubs.has(club.id)}
                      onToggle={() => toggle(selectedClubs, club.id, setSelectedClubs)}
                    />
                  ))}
                </div>
              </details>
            </div>
          </div>
        )}
      </section>

      <footer className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t p-3">
        <div className="mx-auto max-w-lg flex gap-2">
          {step > 0 && (
            <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(step - 1)}>
              חזרה
            </Button>
          )}
          {step < 2 ? (
            <Button
              className="flex-1 h-12 text-base"
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !persona}
            >
              המשך
            </Button>
          ) : (
            <Button className="flex-1 h-12 text-base" onClick={finish} disabled={saving}>
              {saving ? 'שומר...' : 'סיום וכניסה'}
            </Button>
          )}
        </div>
      </footer>
    </main>
  )
}
