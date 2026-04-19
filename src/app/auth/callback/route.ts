import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Ensure profile row exists (trigger may or may not be wired)
  const { data: profile } = await supabase
    .from('vw_profiles')
    .select('id, onboarding_done')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    await supabase.from('vw_profiles').insert({
      id: user.id,
      name: user.email?.split('@')[0] ?? null,
      onboarding_done: false,
    })
  }

  const done = profile?.onboarding_done ?? false
  return NextResponse.redirect(new URL(done ? '/dashboard' : '/onboarding', request.url))
}
