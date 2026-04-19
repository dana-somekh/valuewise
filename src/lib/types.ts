export type Persona = 'student_reservist' | 'career_family' | 'other'

export type Category =
  | 'supermarket'
  | 'restaurants'
  | 'fashion'
  | 'household'
  | 'entertainment'
  | 'travel'
  | 'coffee'
  | 'pharmacy'
  | 'books'
  | 'online'

export type CategoryBonuses = Partial<Record<Category, number>>

export interface Profile {
  id: string
  name: string | null
  persona: Persona | null
  onboarding_done: boolean
  created_at: string
}

export interface Card {
  id: string
  name: string
  issuer: string
  description: string | null
  brand_color: string
  logo_emoji: string
  category_bonuses: CategoryBonuses
}

export interface Club {
  id: string
  name: string
  description: string | null
  logo_emoji: string
  default_points: number
  category_bonuses: CategoryBonuses
  audience: 'general' | 'student' | 'military' | 'family'
}

export interface Merchant {
  id: string
  name: string
  category: Category
  logo_emoji: string
  location: string
}

export interface UserCard {
  user_id: string
  card_id: string
  added_at: string
}

export interface UserClub {
  user_id: string
  club_id: string
  points: number
  expires_at: string | null
  added_at: string
}

export interface SavingsLog {
  id: number
  user_id: string
  merchant_id: string
  card_id: string
  amount_spent: number
  amount_saved: number
  reason: string | null
  occurred_at: string
}

export interface CardRecommendation {
  card: Card
  bonus_pct: number
  amount_saved: number
  reason: string
}

export interface ClubDeal {
  club: Club
  discount_pct: number
}

export const CATEGORY_LABEL_HE: Record<Category, string> = {
  supermarket: 'סופרמרקט',
  restaurants: 'מסעדות',
  fashion: 'אופנה',
  household: 'בית וכלי בית',
  entertainment: 'בידור ותרבות',
  travel: 'טיסות ומלונות',
  coffee: 'קפה ומאפים',
  pharmacy: 'פארם ובריאות',
  books: 'ספרים',
  online: 'קניות אונליין',
}

export const PERSONA_LABEL_HE: Record<Persona, string> = {
  student_reservist: 'סטודנט/ית במילואים',
  career_family: 'משפחה / אנשי קבע',
  other: 'אחר',
}
