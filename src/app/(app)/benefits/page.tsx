import { createClient } from '@/lib/supabase/server'
import type { Card, Club, Category } from '@/lib/types'
import { CATEGORY_LABEL_HE } from '@/lib/types'
import { BenefitsClient } from './BenefitsClient'

export default async function BenefitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: userCards }, { data: userClubs }] = await Promise.all([
    supabase.from('vw_user_cards').select('vw_cards(*)').eq('user_id', user.id),
    supabase.from('vw_user_clubs').select('vw_clubs(*)').eq('user_id', user.id),
  ])

  const cards = (userCards ?? [])
    .map((r: { vw_cards: Card | Card[] | null }) => (Array.isArray(r.vw_cards) ? r.vw_cards[0] : r.vw_cards))
    .filter((c): c is Card => Boolean(c))
  const clubs = (userClubs ?? [])
    .map((r: { vw_clubs: Club | Club[] | null }) => (Array.isArray(r.vw_clubs) ? r.vw_clubs[0] : r.vw_clubs))
    .filter((c): c is Club => Boolean(c))

  // Union of all categories mentioned across user's providers
  const categories = new Set<Category>()
  for (const c of cards) Object.keys(c.category_bonuses).forEach((k) => categories.add(k as Category))
  for (const c of clubs) Object.keys(c.category_bonuses).forEach((k) => categories.add(k as Category))
  const sortedCategories = [...categories].sort((a, b) =>
    CATEGORY_LABEL_HE[a].localeCompare(CATEGORY_LABEL_HE[b], 'he')
  )

  return <BenefitsClient cards={cards} clubs={clubs} categories={sortedCategories} />
}
