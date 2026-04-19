import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Card, Merchant, Club } from '@/lib/types'
import { CATEGORY_LABEL_HE } from '@/lib/types'
import { rankCardsForMerchant, clubDealsForMerchant } from '@/lib/recommend'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await request.json()) as { merchant_id?: string; amount?: number }
  const merchantId = body.merchant_id
  const amount = Number(body.amount)
  if (!merchantId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 })
  }

  const [{ data: merchant }, { data: userCards }, { data: userClubs }] = await Promise.all([
    supabase.from('vw_merchants').select('*').eq('id', merchantId).maybeSingle(),
    supabase.from('vw_user_cards').select('vw_cards(*)').eq('user_id', user.id),
    supabase.from('vw_user_clubs').select('vw_clubs(*)').eq('user_id', user.id),
  ])
  if (!merchant) return NextResponse.json({ error: 'merchant not found' }, { status: 404 })

  const cards = (userCards ?? [])
    .map((r: { vw_cards: Card | Card[] | null }) => (Array.isArray(r.vw_cards) ? r.vw_cards[0] : r.vw_cards))
    .filter((c): c is Card => Boolean(c))
  const clubs = (userClubs ?? [])
    .map((r: { vw_clubs: Club | Club[] | null }) => (Array.isArray(r.vw_clubs) ? r.vw_clubs[0] : r.vw_clubs))
    .filter((c): c is Club => Boolean(c))

  const ranked = rankCardsForMerchant(merchant as Merchant, amount, cards)
  const deals = clubDealsForMerchant(merchant as Merchant, clubs)
  const top = ranked[0]

  if (!top) return NextResponse.json({ insight: 'אין לך כרטיסים מחוברים — הוסף/י כרטיס כדי לקבל המלצה.' })

  const apiKey = process.env.GEMINI_API_KEY
  const fallback = `הכי משתלם לשלם ב-${top.card.name}: ${top.reason}. תחסוך/י ₪${top.amount_saved}.`
  if (!apiKey) return NextResponse.json({ insight: fallback })

  const systemPrompt = [
    'את/ה היועץ/ת הפיננסי/ת של אפליקציית ValueWise.',
    'המשימה שלך: לקבל נתונים של המלצת תשלום חכמה, ולהסביר ללקוח/ה בעברית — במשפט אחד קצר (עד 25 מילים) —',
    'למה הכרטיס הנבחר הכי משתלם. השתמש/י בטון ידידותי, בלי להיות יותר מדי שיווקי/ת.',
    'אל תמציא/י מספרים מעבר למה שניתן.',
    'אל תפתח/י ב"שלום" או "היי" — תגיד/י ישר את ההמלצה.',
  ].join(' ')

  const ctx = {
    merchant: { name: merchant.name, category: CATEGORY_LABEL_HE[merchant.category as keyof typeof CATEGORY_LABEL_HE] },
    amount,
    chosen_card: { name: top.card.name, issuer: top.card.issuer, bonus_pct: top.bonus_pct, saved: top.amount_saved },
    other_cards: ranked.slice(1, 3).map((r) => ({ name: r.card.name, bonus_pct: r.bonus_pct, saved: r.amount_saved })),
    club_deals: deals.slice(0, 2).map((d) => ({ name: d.club.name, discount_pct: d.discount_pct })),
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `הנתונים:\n${JSON.stringify(ctx, null, 2)}\n\nהסבר/י במשפט אחד קצר למה הכרטיס הנבחר הכי משתלם כאן.`,
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 200, temperature: 0.6 },
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ insight: fallback })
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return NextResponse.json({ insight: text || fallback })
  } catch {
    return NextResponse.json({ insight: fallback })
  }
}
