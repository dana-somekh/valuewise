import { createClient } from '@/lib/supabase/server'
import type { Club } from '@/lib/types'

export default async function PointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userClubs } = await supabase
    .from('vw_user_clubs')
    .select('points, expires_at, vw_clubs(*)')
    .eq('user_id', user.id)

  const rows = (userClubs ?? [])
    .map((r: { points: number; expires_at: string | null; vw_clubs: Club | Club[] | null }) => {
      const c = r.vw_clubs
      return {
        club: (Array.isArray(c) ? c[0] : c) as Club | null,
        points: r.points,
        expires_at: r.expires_at,
      }
    })
    .filter((r): r is { club: Club; points: number; expires_at: string | null } => Boolean(r.club))
    .sort((a, b) => {
      // Expiring first
      const ae = a.expires_at ? new Date(a.expires_at).getTime() : Infinity
      const be = b.expires_at ? new Date(b.expires_at).getTime() : Infinity
      return ae - be
    })

  const totalPoints = rows.reduce((s, r) => s + r.points, 0)
  const trappedValue = Math.round(totalPoints * 0.05 * 100) / 100 // rough ₪0.05 per point estimate
  const expiring = rows.filter(
    (r) => r.expires_at && new Date(r.expires_at).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000
  )

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <header>
        <div className="text-xs text-primary font-semibold">💰 כסף כלוא</div>
        <h1 className="text-2xl font-bold mt-0.5">הנקודות שלך</h1>
        <p className="text-sm text-muted-foreground mt-1">
          כל הנקודות והקופונים במקום אחד — בלי לפספס פקיעה.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-primary text-primary-foreground p-4">
          <div className="text-xs opacity-80">שווי משוער</div>
          <div className="text-2xl font-bold mt-1">₪{trappedValue.toLocaleString('he-IL')}</div>
          <div className="text-[11px] opacity-80 mt-1">במצטבר על כל המועדונים</div>
        </div>
        <div className="rounded-3xl bg-accent p-4 text-accent-foreground">
          <div className="text-xs opacity-80">פוקעים תוך 14 יום</div>
          <div className="text-2xl font-bold mt-1">{expiring.length}</div>
          <div className="text-[11px] opacity-80 mt-1">מועדונים בסכנה</div>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">פירוט לפי מועדון</h2>
        {rows.map((r) => {
          const exp = r.expires_at ? new Date(r.expires_at) : null
          const days = exp ? Math.round((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
          const expClass =
            days !== null && days < 14
              ? 'text-destructive font-bold'
              : 'text-muted-foreground'
          return (
            <div key={r.club.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
              <div className="text-2xl shrink-0">{r.club.logo_emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{r.club.name}</div>
                <div className={`text-xs ${expClass}`}>
                  {days === null
                    ? 'ללא תוקף'
                    : days <= 0
                    ? 'פג תוקף!'
                    : `פג עוד ${days} ימים`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold">{r.points.toLocaleString('he-IL')}</div>
                <div className="text-[10px] text-muted-foreground">נקודות</div>
              </div>
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="text-sm text-muted-foreground bg-muted rounded-xl p-4 text-center">
            אין מועדונים מחוברים.
          </div>
        )}
      </section>
    </div>
  )
}
