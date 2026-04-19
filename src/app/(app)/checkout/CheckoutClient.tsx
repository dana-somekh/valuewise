'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Card, Club, Merchant } from '@/lib/types'
import { CATEGORY_LABEL_HE } from '@/lib/types'
import { rankCardsForMerchant, clubDealsForMerchant } from '@/lib/recommend'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CheckoutClient({
  merchants,
  userCards,
  userClubs,
}: {
  merchants: Merchant[]
  userCards: Card[]
  userClubs: Club[]
}) {
  const [merchantId, setMerchantId] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [query, setQuery] = useState('')
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [logged, setLogged] = useState(false)

  const filtered = useMemo(
    () =>
      query
        ? merchants.filter((m) => m.name.includes(query))
        : merchants,
    [merchants, query]
  )

  const merchant = useMemo(
    () => merchants.find((m) => m.id === merchantId) ?? null,
    [merchants, merchantId]
  )

  const amountNum = Number(amount) || 0

  const recommendations = useMemo(() => {
    if (!merchant || amountNum <= 0) return []
    return rankCardsForMerchant(merchant, amountNum, userCards)
  }, [merchant, amountNum, userCards])

  const clubDeals = useMemo(() => {
    if (!merchant) return []
    return clubDealsForMerchant(merchant, userClubs)
  }, [merchant, userClubs])

  async function askAI() {
    if (!merchant || !recommendations[0]) return
    setAiLoading(true)
    setAiInsight(null)
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchant.id,
          amount: amountNum,
        }),
      })
      const json = await res.json()
      setAiInsight(json.insight ?? null)
    } catch {
      setAiInsight('לא הצלחנו לקבל תובנה מה-AI כרגע.')
    } finally {
      setAiLoading(false)
    }
  }

  async function confirmUse() {
    if (!merchant || !recommendations[0]) return
    const top = recommendations[0]
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('vw_savings_log').insert({
      user_id: user.id,
      merchant_id: merchant.id,
      card_id: top.card.id,
      amount_spent: amountNum,
      amount_saved: top.amount_saved,
      reason: top.reason,
    })
    setLogged(true)
  }

  function reset() {
    setMerchantId(null)
    setAmount('')
    setAiInsight(null)
    setLogged(false)
  }

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <header>
        <div className="text-xs text-primary font-semibold">PUSH · תשלום חכם</div>
        <h1 className="text-2xl font-bold mt-0.5">באיזה כרטיס כדאי לשלם?</h1>
        <p className="text-sm text-muted-foreground mt-1">
          בחר/י את החנות שאת/ה בה עכשיו ואת הסכום — נמליץ בשנייה.
        </p>
      </header>

      {!merchant && (
        <div>
          <Input
            placeholder="🔍 חיפוש חנות..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11"
          />
          <div className="mt-3 space-y-2">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setMerchantId(m.id)}
                className="w-full text-right flex items-center gap-3 rounded-2xl border bg-card p-3 active:scale-[0.98]"
              >
                <div className="text-2xl">{m.logo_emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {CATEGORY_LABEL_HE[m.category]} · {m.location}
                  </div>
                </div>
                <div className="text-muted-foreground">←</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                אין חנויות תואמות
              </div>
            )}
          </div>
        </div>
      )}

      {merchant && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            <div className="text-3xl">{merchant.logo_emoji}</div>
            <div className="flex-1">
              <div className="font-semibold">{merchant.name}</div>
              <div className="text-xs text-muted-foreground">
                {CATEGORY_LABEL_HE[merchant.category]} · {merchant.location}
              </div>
            </div>
            <button onClick={reset} className="text-xs text-primary font-semibold">
              החלפה
            </button>
          </div>

          <div>
            <label className="text-sm font-medium">סכום התשלום</label>
            <div className="mt-1 relative">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-12 text-lg pe-10"
                dir="ltr"
              />
              <div className="absolute top-1/2 -translate-y-1/2 left-3 text-muted-foreground">₪</div>
            </div>
          </div>

          {amountNum > 0 && recommendations.length > 0 && !logged && (
            <section className="space-y-3">
              <div className="rounded-3xl bg-primary text-primary-foreground p-4">
                <div className="text-xs opacity-80">המלצה עליונה</div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-3xl">{recommendations[0].card.logo_emoji}</div>
                  <div className="flex-1">
                    <div className="font-bold">{recommendations[0].card.name}</div>
                    <div className="text-xs opacity-90">{recommendations[0].reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₪{recommendations[0].amount_saved}</div>
                    <div className="text-xs opacity-80">תחסוך/י</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={confirmUse}>
                    השתמשתי בכרטיס הזה
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-transparent border-primary-foreground/30 text-primary-foreground"
                    onClick={askAI}
                    disabled={aiLoading}
                  >
                    {aiLoading ? '...' : '💡 למה?'}
                  </Button>
                </div>
              </div>

              {aiInsight && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm">
                  <div className="text-xs font-semibold text-primary mb-1">🧠 תובנת AI</div>
                  {aiInsight}
                </div>
              )}

              {recommendations.length > 1 && (
                <div>
                  <div className="text-sm font-semibold mb-2 mt-2">אפשרויות נוספות</div>
                  <div className="space-y-2">
                    {recommendations.slice(1).map((r) => (
                      <div
                        key={r.card.id}
                        className="flex items-center gap-3 rounded-2xl border bg-card p-3"
                      >
                        <div className="text-xl">{r.card.logo_emoji}</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{r.card.name}</div>
                          <div className="text-xs text-muted-foreground">{r.reason}</div>
                        </div>
                        <div className="text-sm font-bold text-muted-foreground">
                          ₪{r.amount_saved}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {clubDeals.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2 mt-2">מועדונים שיכולים לחסוך עוד</div>
                  <div className="space-y-2">
                    {clubDeals.map((d) => (
                      <div
                        key={d.club.id}
                        className="flex items-center gap-3 rounded-2xl border bg-accent/10 p-3"
                      >
                        <div className="text-xl">{d.club.logo_emoji}</div>
                        <div className="flex-1 text-sm">
                          <span className="font-semibold">{d.club.name}</span> — הנחה עד{' '}
                          <span className="font-bold">{d.discount_pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {logged && (
            <div className="rounded-3xl bg-accent text-accent-foreground p-5 text-center">
              <div className="text-5xl">🎉</div>
              <div className="text-xl font-bold mt-2">מעולה!</div>
              <div className="text-sm mt-1">
                חסכת ₪{recommendations[0]?.amount_saved} בעסקה הזו.
              </div>
              <Button className="mt-4 w-full" onClick={reset}>
                לעסקה הבאה
              </Button>
            </div>
          )}

          {amountNum > 0 && userCards.length === 0 && (
            <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground text-center">
              אין לך כרטיסים מחוברים — הוסף/י כרטיסים בפרופיל כדי לקבל המלצות.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
