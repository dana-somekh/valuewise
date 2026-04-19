import type { Club } from '@/lib/types'
import { CATEGORY_LABEL_HE, type Category } from '@/lib/types'

export function ClubTile({
  club,
  selected,
  onToggle,
  points,
  expiresAt,
}: {
  club: Club
  selected?: boolean
  onToggle?: () => void
  points?: number
  expiresAt?: string | null
}) {
  const topCategories = Object.entries(club.category_bonuses)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 2)

  const expiringSoon = expiresAt
    ? new Date(expiresAt).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000
    : false

  const body = (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
      } ${onToggle ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-secondary">
        {club.logo_emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">{club.name}</div>
        <div className="text-xs text-muted-foreground truncate">{club.description}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {topCategories.map(([cat, pct]) => (
            <span key={cat} className="text-[10px] bg-secondary rounded-md px-1.5 py-0.5">
              {CATEGORY_LABEL_HE[cat as Category]} -{Number(pct)}%
            </span>
          ))}
          {typeof points === 'number' && (
            <span className="text-[10px] bg-accent/30 rounded-md px-1.5 py-0.5 font-semibold">
              ⭐ {points.toLocaleString('he-IL')}
            </span>
          )}
          {expiringSoon && (
            <span className="text-[10px] bg-destructive/15 text-destructive rounded-md px-1.5 py-0.5 font-semibold">
              פג תוקף בקרוב
            </span>
          )}
        </div>
      </div>
      {onToggle && (
        <div
          className={`w-5 h-5 rounded-full border-2 shrink-0 ${
            selected ? 'border-primary bg-primary' : 'border-border'
          }`}
        />
      )}
    </div>
  )

  return onToggle ? (
    <button type="button" onClick={onToggle} className="w-full text-right">
      {body}
    </button>
  ) : (
    body
  )
}
