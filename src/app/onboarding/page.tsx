import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Card, Club } from '@/lib/types'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('vw_profiles')
    .select('onboarding_done')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_done) redirect('/dashboard')

  const [{ data: cards }, { data: clubs }] = await Promise.all([
    supabase.from('vw_cards').select('*').order('name'),
    supabase.from('vw_clubs').select('*').order('name'),
  ])

  return <OnboardingClient cards={(cards ?? []) as Card[]} clubs={(clubs ?? []) as Club[]} />
}
