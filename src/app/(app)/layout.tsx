import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('vw_profiles')
    .select('onboarding_done')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_done) redirect('/onboarding')

  return (
    <div className="min-h-dvh pb-24 bg-background">
      <div className="mx-auto max-w-lg">{children}</div>
      <BottomNav />
    </div>
  )
}
