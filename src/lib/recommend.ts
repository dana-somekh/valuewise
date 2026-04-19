import type { Card, Club, Merchant, CardRecommendation, ClubDeal } from './types'

export function rankCardsForMerchant(
  merchant: Merchant,
  amount: number,
  userCards: Card[]
): CardRecommendation[] {
  const scored = userCards.map((card) => {
    const bonus = card.category_bonuses[merchant.category] ?? 0
    const saved = Math.round(((amount * bonus) / 100) * 100) / 100
    return {
      card,
      bonus_pct: bonus,
      amount_saved: saved,
      reason: bonus > 0
        ? `${bonus}% חזרה בקטגוריית ${merchant.category}`
        : 'ללא הטבה ייעודית לחנות זו',
    }
  })
  return scored.sort((a, b) => b.amount_saved - a.amount_saved)
}

export function clubDealsForMerchant(
  merchant: Merchant,
  userClubs: Club[]
): ClubDeal[] {
  return userClubs
    .map((club) => ({ club, discount_pct: club.category_bonuses[merchant.category] ?? 0 }))
    .filter((d) => d.discount_pct > 0)
    .sort((a, b) => b.discount_pct - a.discount_pct)
}

export function totalStackedSavings(
  amount: number,
  bestCardBonus: number,
  bestClubDiscount: number
): { saved: number; pays: number } {
  const clubSave = (amount * bestClubDiscount) / 100
  const afterClub = amount - clubSave
  const cardSave = (afterClub * bestCardBonus) / 100
  const saved = Math.round((clubSave + cardSave) * 100) / 100
  const pays = Math.round((afterClub - cardSave) * 100) / 100
  return { saved, pays }
}
