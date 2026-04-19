import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/Logo'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-dvh bg-gradient-to-b from-background via-background to-secondary/40">
      <header className="mx-auto max-w-lg px-5 pt-6 flex items-center justify-between">
        <Logo />
        <Link href="/login" className="text-sm text-primary font-semibold">כניסה</Link>
      </header>

      <section className="mx-auto max-w-lg px-5 pt-10 pb-6">
        <div className="text-xs font-semibold text-primary mb-3">ValueWise · מ0 לאחת</div>
        <h1 className="text-3xl font-bold leading-tight">
          כל ההטבות שלך,<br />
          <span className="text-primary">ברגע הקנייה.</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          האפליקציה שמחברת את כל כרטיסי האשראי ומועדוני הלקוחות שלך —
          ואומרת לך במדויק באיזה כרטיס הכי משתלם לשלם, בדיוק כשאת/ה עומד/ת מול הקופה.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="flex-1 h-12 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-base font-semibold active:scale-[0.98]"
          >
            התחלה חינם
          </Link>
          <Link
            href="#how"
            className="flex-1 h-12 inline-flex items-center justify-center rounded-lg border border-border bg-card text-base font-semibold active:scale-[0.98]"
          >
            איך זה עובד
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2 text-center">
          {[
            { n: '11M', l: 'כרטיסי אשראי בישראל' },
            { n: '3.27B$', l: 'שוק הנקודות השנתי' },
            { n: '100+', l: 'מועדוני לקוחות' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-card border p-3">
              <div className="text-lg font-bold">{s.n}</div>
              <div className="text-[11px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-lg px-5 py-8 space-y-3">
        <h2 className="text-xl font-bold mb-3">מה מקבלים?</h2>
        {[
          { e: '📍', t: 'זיהוי בזמן אמת', d: 'התראה בכניסה לחנות עם הכרטיס הכי משתלם.' },
          { e: '🎛️', t: 'מרכז שליטה', d: 'כל המועדונים והנקודות במסך אחד — בלי לצאת פראייר.' },
          { e: '🧠', t: 'AI אישי', d: 'עוזר חכם שעונה: איפה לאכול? איפה לקנות? איך לשלם?' },
          { e: '⏳', t: 'כסף כלוא', d: 'התראה לפני שנקודות או קופונים פגים.' },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border bg-card p-4 flex gap-3">
            <div className="text-2xl">{f.e}</div>
            <div>
              <div className="font-semibold">{f.t}</div>
              <div className="text-sm text-muted-foreground">{f.d}</div>
            </div>
          </div>
        ))}
      </section>

      <footer className="mx-auto max-w-lg px-5 py-8 text-center text-xs text-muted-foreground">
        חינם לשימוש · עמלת הצלחה 10% עד ₪15
      </footer>
    </main>
  )
}
