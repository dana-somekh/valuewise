import type { Card as VWCard } from '@/lib/types'
import { CATEGORY_LABEL_HE, type Category } from '@/lib/types'

export function CardTile({
  card,
  selected,
  onToggle,
  trailing,
}: {
  card: VWCard
  selected?: boolean
  onToggle?: () => void
  trailing?: React.ReactNode
}) {
  const topCategories = Object.entries(card.category_bonuses)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 2)

  const body = (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
      } ${onToggle ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: card.brand_color + '22', color: card.brand_color }}
      >
        {card.logo_emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">{card.name}</div>
        <div className="text-xs text-muted-foreground truncate">{card.issuer}</div>
        {topCategories.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {topCategories.map(([cat, pct]) => (
              <span key={cat} className="text-[10px] bg-secondary rounded-md px-1.5 py-0.5">
                {CATEGORY_LABEL_HE[cat as Category]} {Number(pct)}%
              </span>
            ))}
          </div>
        )}
      </div>
      {trailing}
      {onToggle && !trailing && (
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
