'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    // For signup: if email confirmation is off, session is created immediately
    if (result.data.session) {
      router.push('/auth/callback')
    } else {
      setError('נשלח אימייל — אשר/י אותו וחזור/י לבצע כניסה.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-background flex flex-col">
      <header className="mx-auto w-full max-w-lg px-5 pt-6">
        <Logo />
      </header>
      <div className="flex-1 mx-auto w-full max-w-lg px-5 py-8">
        <h1 className="text-2xl font-bold mb-2">ברוכ/ה הבא/ה</h1>
        <p className="text-muted-foreground mb-6">
          {mode === 'signup'
            ? 'צור/י חשבון כדי להתחיל לחסוך.'
            : 'התחבר/י לחשבון שלך.'}
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              dir="ltr"
            />
          </div>
          <div>
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-2">{error}</div>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? '...' : mode === 'signup' ? 'יצירת חשבון' : 'כניסה'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          className="mt-4 text-sm text-primary font-semibold w-full text-center"
        >
          {mode === 'signup' ? 'כבר יש לי חשבון — כניסה' : 'אין לי חשבון — יצירה'}
        </button>
      </div>
    </main>
  )
}
