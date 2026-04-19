import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Card, Club, Persona } from '@/lib/types'
import { PERSONA_LABEL_HE } from '@/lib/types'
import { CardTile } from '@/components/CardTile'
import { ClubTile } from '@/components/ClubTile'
import { SignOutButton } from './SignOutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: userCards }, { data: userClubs }] = await Promise.all([
    supabase.from('vw_profiles').select('name, persona').eq('id', user.id).maybeSingle(),
    supabase.from('vw_user_cards').select('vw_cards(*)').eq('user_id', user.id),
    supabase.from('vw_user_clubs').select('points, expires_at, vw_clubs(*)').eq('user_id', user.id),
  ])

  const cards = (userCards ?? [])
    .map((r: { vw_cards: Card | Card[] | null }) => (Array.isArray(r.vw_cards) ? r.vw_cards[0] : r.vw_cards))
    .filter((c): c is Card => Boolean(c))
  const clubs = (userClubs ?? [])
    .map((r: { points: number; expires_at: string | null; vw_clubs: Club | Club[] | null }) => {
      const c = r.vw_clubs
      return {
        club: (Array.isArray(c) ? c[0] : c) as Club | null,
        points: r.points,
        expires_at: r.expires_at,
      }
    })
    .filter((r): r is { club: Club; points: number; expires_at: string | null } => Boolean(r.club))

  const personaLabel = profile?.persona ? PERSONA_LABEL_HE[profile.persona as Persona] : 'לא נבחר'

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <header>
        <h1 className="text-2xl font-bold">הפרופיל שלי</h1>
      </header>

      <div className="rounded-2xl border bg-card p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">שם</span>
          <span className="font-semibold">{profile?.name ?? '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">אימייל</span>
          <span className="font-semibold" dir="ltr">{user.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">פרסונה</span>
          <span className="font-semibold">{personaLabel}</span>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">כרטיסים מחוברים</h2>
          <Link href="/onboarding" className="text-xs text-primary font-semibold">עריכה</Link>
        </div>
        <div className="space-y-2">
          {cards.map((c) => (
            <CardTile key={c.id} card={c} />
          ))}
          {cards.length === 0 && (
            <div className="text-sm text-muted-foreground bg-muted rounded-xl p-4 text-center">
              אין כרטיסים מחוברים
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">מועדונים מחוברים</h2>
        <div className="space-y-2">
          {clubs.map((r) => (
            <ClubTile
              key={r.club.id}
              club={r.club}
              points={r.points}
              expiresAt={r.expires_at}
            />
          ))}
          {clubs.length === 0 && (
            <div className="text-sm text-muted-foreground bg-muted rounded-xl p-4 text-center">
              אין מועדונים מחוברים
            </div>
          )}
        </div>
      </section>

      <SignOutButton />

      <div className="text-center text-xs text-muted-foreground pt-2">
        ValueWise · MVP · אוניברסיטת רייכמן
      </div>
    </div>
  )
}
