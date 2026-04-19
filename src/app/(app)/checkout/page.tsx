import { createClient } from '@/lib/supabase/server'
import type { Card, Club, Merchant } from '@/lib/types'
import { CheckoutClient } from './CheckoutClient'

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: merchants }, { data: userCards }, { data: userClubs }] = await Promise.all([
    supabase.from('vw_merchants').select('*').order('name'),
    supabase.from('vw_user_cards').select('vw_cards(*)').eq('user_id', user.id),
    supabase.from('vw_user_clubs').select('vw_clubs(*)').eq('user_id', user.id),
  ])

  const cards = (userCards ?? [])
    .map((r: { vw_cards: Card | Card[] | null }) => (Array.isArray(r.vw_cards) ? r.vw_cards[0] : r.vw_cards))
    .filter((c): c is Card => Boolean(c))
  const clubs = (userClubs ?? [])
    .map((r: { vw_clubs: Club | Club[] | null }) => (Array.isArray(r.vw_clubs) ? r.vw_clubs[0] : r.vw_clubs))
    .filter((c): c is Club => Boolean(c))

  return (
    <CheckoutClient
      merchants={(merchants ?? []) as Merchant[]}
      userCards={cards}
      userClubs={clubs}
    />
  )
}
