import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Card as VWCard, Club, SavingsLog, Merchant } from '@/lib/types'
import { CardTile } from '@/components/CardTile'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: profile },
    { data: userCards },
    { data: userClubs },
    { data: savings },
  ] = await Promise.all([
    supabase.from('vw_profiles').select('name, persona').eq('id', user.id).maybeSingle(),
    supabase.from('vw_user_cards').select('card_id, vw_cards(*)').eq('user_id', user.id),
    supabase.from('vw_user_clubs').select('points, expires_at, vw_clubs(*)').eq('user_id', user.id),
    supabase
      .from('vw_savings_log')
      .select('*, vw_merchants(name, logo_emoji), vw_cards(name)')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(5),
  ])

  const cards = (userCards ?? [])
    .map((row: { vw_cards: VWCard | VWCard[] | null }) => {
      const c = row.vw_cards
      return Array.isArray(c) ? c[0] : c
    })
    .filter((c): c is VWCard => Boolean(c))

  const clubs = (userClubs ?? []).map((row: { points: number; expires_at: string | null; vw_clubs: Club | Club[] | null }) => {
    const c = row.vw_clubs
    return {
      club: (Array.isArray(c) ? c[0] : c) as Club,
      points: row.points,
      expires_at: row.expires_at,
    }
  }).filter((r) => r.club)

  const totalPoints = clubs.reduce((s, c) => s + (c.points ?? 0), 0)
  const thisMonth = new Date()
  thisMonth.setDate(1)
  const savedThisMonth = (savings ?? [])
    .filter((s: SavingsLog) => new Date(s.occurred_at) >= thisMonth)
    .reduce((sum: number, s: SavingsLog) => sum + Number(s.amount_saved), 0)

  const expiringSoon = clubs.filter((c) => {
    if (!c.expires_at) return false
    return new Date(c.expires_at).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000
  })

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <header>
        <div className="text-xs text-muted-foreground">שלום, {profile?.name || 'משתמש/ת'} 👋</div>
        <h1 className="text-2xl font-bold mt-0.5">מרכז השליטה שלך</h1>
      </header>

      <div className="rounded-3xl bg-primary text-primary-foreground p-5 shadow-sm">
        <div className="text-xs opacity-80">חסכת החודש</div>
        <div className="text-3xl font-bold mt-1">
          ₪{savedThisMonth.toLocaleString('he-IL', { maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs opacity-80 mt-2">עם {cards.length} כרטיסים ו-{clubs.length} מועדונים</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-3">
          <div className="text-xs text-muted-foreground">נקודות זמינות</div>
          <div className="text-2xl font-bold text-accent-foreground mt-1">
            {totalPoints.toLocaleString('he-IL')}
          </div>
          <Link href="/points" className="text-xs text-primary mt-1 inline-block">
            לניהול →
          </Link>
        </div>
        <div className="rounded-2xl border bg-card p-3">
          <div className="text-xs text-muted-foreground">פג תוקפן בקרוב</div>
          <div className="text-2xl font-bold text-destructive mt-1">{expiringSoon.length}</div>
          <Link href="/points" className="text-xs text-primary mt-1 inline-block">
            פרטים →
          </Link>
        </div>
      </div>

      <Link
        href="/checkout"
        className="block rounded-2xl bg-accent p-4 text-accent-foreground active:scale-[0.98]"
      >
        <div className="text-sm font-semibold">📍 עומד/ת לשלם עכשיו?</div>
        <div className="text-xs mt-1 opacity-80">
          בחר/י חנות וסכום — נמליץ על הכרטיס הכי משתלם.
        </div>
      </Link>

      <section>
        <h2 className="text-lg font-bold mb-2">הכרטיסים שלך</h2>
        <div className="space-y-2">
          {cards.length === 0 && (
            <div className="text-sm text-muted-foreground bg-muted rounded-xl p-4">
              עוד לא חיברת כרטיסים. <Link href="/profile" className="text-primary font-semibold">הוספה</Link>
            </div>
          )}
          {cards.map((c) => (
            <CardTile key={c.id} card={c} />
          ))}
        </div>
      </section>

      {(savings?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-2">פעילות אחרונה</h2>
          <div className="space-y-2">
            {(savings ?? []).map((s: SavingsLog & { vw_merchants?: Pick<Merchant, 'name' | 'logo_emoji'> | null; vw_cards?: Pick<VWCard, 'name'> | null }) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                <div className="text-xl">{s.vw_merchants?.logo_emoji ?? '🧾'}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{s.vw_merchants?.name ?? 'חנות'}</div>
                  <div className="text-xs text-muted-foreground">
                    ₪{Number(s.amount_spent).toLocaleString('he-IL')} · {s.vw_cards?.name}
                  </div>
                </div>
                <div className="text-sm font-bold text-primary shrink-0">
                  +₪{Number(s.amount_saved).toLocaleString('he-IL')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
