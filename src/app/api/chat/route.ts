import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Card, Club, Merchant } from '@/lib/types'
import { CATEGORY_LABEL_HE } from '@/lib/types'

export const runtime = 'nodejs'

type UiMsg = { role: 'user' | 'assistant'; content: string }

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await request.json()) as { messages: UiMsg[] }
  const history = Array.isArray(body.messages) ? body.messages : []

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'missing GEMINI_API_KEY — add it to Vercel env vars to enable the assistant.' },
      { status: 503 }
    )
  }

  const [{ data: userCards }, { data: userClubs }, { data: merchants }] = await Promise.all([
    supabase.from('vw_user_cards').select('vw_cards(*)').eq('user_id', user.id),
    supabase.from('vw_user_clubs').select('points, expires_at, vw_clubs(*)').eq('user_id', user.id),
    supabase.from('vw_merchants').select('*').order('name'),
  ])

  const cards = (userCards ?? [])
    .map((r: { vw_cards: Card | Card[] | null }) => (Array.isArray(r.vw_cards) ? r.vw_cards[0] : r.vw_cards))
    .filter((c): c is Card => Boolean(c))
  const clubs = (userClubs ?? [])
    .map((r: { points: number; expires_at: string | null; vw_clubs: Club | Club[] | null }) => {
      const c = r.vw_clubs
      return { club: (Array.isArray(c) ? c[0] : c) as Club | null, points: r.points, expires_at: r.expires_at }
    })
    .filter((r): r is { club: Club; points: number; expires_at: string | null } => Boolean(r.club))

  const userCtx = {
    connected_cards: cards.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      bonuses: Object.fromEntries(
        Object.entries(c.category_bonuses).map(([k, v]) => [CATEGORY_LABEL_HE[k as keyof typeof CATEGORY_LABEL_HE] ?? k, `${v}%`])
      ),
    })),
    connected_clubs: clubs.map((r) => ({
      name: r.club.name,
      points: r.points,
      expires_at: r.expires_at,
      discounts: Object.fromEntries(
        Object.entries(r.club.category_bonuses).map(([k, v]) => [CATEGORY_LABEL_HE[k as keyof typeof CATEGORY_LABEL_HE] ?? k, `${v}%`])
      ),
    })),
    known_merchants: (merchants as Merchant[] | null)?.map((m) => ({
      name: m.name,
      category: CATEGORY_LABEL_HE[m.category as keyof typeof CATEGORY_LABEL_HE] ?? m.category,
      location: m.location,
    })),
  }

  const systemPrompt = [
    'את/ה העוזר/ת האישי/ת של משתמש/ת באפליקציית ValueWise.',
    'מטרתך: לעזור ללקוח/ה להפיק את המקסימום מההטבות של כרטיסי האשראי והמועדונים המחוברים.',
    'תשובות בעברית, קצרות ותכליתיות — עד 3-4 משפטים לכל תשובה.',
    'התבסס/י רק על הכרטיסים והמועדונים שבהקשר הלקוח/ה. אל תמציא/י כרטיסים שלא מופיעים שם.',
    'כשממליץ/ה על חנות, הצג/י את המספר: "בקסטרו תחסוך כ-12% דרך מועדון FOX."',
    'אם המשתמש/ת שואל/ת על חנות שלא מופיעה ברשימה — ציין/י זאת, והצע/י אלטרנטיבה דומה מהרשימה.',
    `הקשר הלקוח/ה: ${JSON.stringify(userCtx)}`,
  ].join('\n')

  // Gemini chat format: alternating user/model turns. Map UI messages → Gemini contents.
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=${apiKey}`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
          }),
        })

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => '')
          controller.enqueue(encoder.encode(`[שגיאה: ${res.status} ${errText.slice(0, 200)}]`))
          controller.close()
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let sep: number
          while ((sep = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, sep).trim()
            buffer = buffer.slice(sep + 1)
            if (!line.startsWith('data:')) continue
            const payload = line.slice(5).trim()
            if (!payload || payload === '[DONE]') continue
            try {
              const json = JSON.parse(payload) as {
                candidates?: { content?: { parts?: { text?: string }[] } }[]
              }
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) controller.enqueue(encoder.encode(text))
            } catch {
              // skip malformed chunk
            }
          }
        }
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'שגיאה ביצירת תשובה'
        controller.enqueue(encoder.encode(`\n\n[שגיאה: ${msg}]`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
