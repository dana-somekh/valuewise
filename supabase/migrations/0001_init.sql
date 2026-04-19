-- ValueWise schema (co-located with financeapp in the same Supabase project; all tables vw_ prefixed)

-- =========================
-- User-owned tables
-- =========================

create table if not exists public.vw_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  persona text check (persona in ('student_reservist','career_family','other')),
  onboarding_done boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.vw_cards (
  id text primary key,
  name text not null,
  issuer text not null,
  description text,
  brand_color text default '#1f3b5a',
  logo_emoji text default '💳',
  category_bonuses jsonb default '{}'::jsonb, -- { category: bonus_pct }
  created_at timestamptz default now()
);

create table if not exists public.vw_clubs (
  id text primary key,
  name text not null,
  description text,
  logo_emoji text default '🎟️',
  default_points int default 100,
  category_bonuses jsonb default '{}'::jsonb, -- { category: discount_pct }
  audience text default 'general', -- 'student','military','family','general'
  created_at timestamptz default now()
);

create table if not exists public.vw_merchants (
  id text primary key,
  name text not null,
  category text not null, -- supermarket, restaurants, fashion, household, entertainment, travel, coffee, pharmacy, books
  logo_emoji text default '🏪',
  location text default 'תל אביב',
  created_at timestamptz default now()
);

create table if not exists public.vw_user_cards (
  user_id uuid references auth.users(id) on delete cascade,
  card_id text references public.vw_cards(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (user_id, card_id)
);

create table if not exists public.vw_user_clubs (
  user_id uuid references auth.users(id) on delete cascade,
  club_id text references public.vw_clubs(id) on delete cascade,
  points int default 0,
  expires_at date,
  added_at timestamptz default now(),
  primary key (user_id, club_id)
);

create table if not exists public.vw_savings_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  merchant_id text references public.vw_merchants(id),
  card_id text references public.vw_cards(id),
  amount_spent numeric(10,2) not null,
  amount_saved numeric(10,2) not null,
  reason text,
  occurred_at timestamptz default now()
);

create index if not exists vw_savings_log_user_idx on public.vw_savings_log(user_id, occurred_at desc);

-- =========================
-- RLS
-- =========================

alter table public.vw_profiles enable row level security;
alter table public.vw_user_cards enable row level security;
alter table public.vw_user_clubs enable row level security;
alter table public.vw_savings_log enable row level security;

-- Seed tables are public-read, no insert/update from clients
alter table public.vw_cards enable row level security;
alter table public.vw_clubs enable row level security;
alter table public.vw_merchants enable row level security;

drop policy if exists "profiles self" on public.vw_profiles;
create policy "profiles self" on public.vw_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "user_cards self" on public.vw_user_cards;
create policy "user_cards self" on public.vw_user_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_clubs self" on public.vw_user_clubs;
create policy "user_clubs self" on public.vw_user_clubs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "savings self" on public.vw_savings_log;
create policy "savings self" on public.vw_savings_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cards public read" on public.vw_cards;
create policy "cards public read" on public.vw_cards for select using (true);

drop policy if exists "clubs public read" on public.vw_clubs;
create policy "clubs public read" on public.vw_clubs for select using (true);

drop policy if exists "merchants public read" on public.vw_merchants;
create policy "merchants public read" on public.vw_merchants for select using (true);

-- =========================
-- Seed data
-- =========================

insert into public.vw_cards (id, name, issuer, description, brand_color, logo_emoji, category_bonuses) values
  ('amex_gold',  'אמריקן אקספרס Gold',   'American Express', 'הטבות על מסעדות ונסיעות',   '#C9A33A', '🟡', '{"restaurants":10,"travel":5,"coffee":5}'),
  ('cal_plat',   'Cal פלטינום',           'Cal',              'הטבות על סופר ואופנה',       '#0055A5', '🔵', '{"supermarket":3,"fashion":5,"pharmacy":3}'),
  ('max_back',   'Max Back',              'Max',              'Cashback על קניות אונליין',  '#E23D4B', '🔴', '{"supermarket":5,"online":4,"household":3}'),
  ('isracard_more','Isracard More',        'Isracard',         'הטבות על אופנה ובילויים',     '#2E7D32', '🟢', '{"fashion":4,"entertainment":5,"books":3}'),
  ('flycard',    'FlyCard',               'Max',              'נקודות על טיסות ומלונות',    '#1565C0', '✈️', '{"travel":7,"restaurants":3}'),
  ('hever_card', 'כרטיס חבר',             'חבר',              'הטבות למשרתי קבע',            '#1B5E20', '🪖', '{"household":8,"supermarket":4,"fashion":5}'),
  ('istudent',   'iStudent',              'לאומי',            'הטבות סטודנטים',               '#7B1FA2', '🎓', '{"entertainment":10,"restaurants":5,"coffee":6}'),
  ('behatzdaa',  'בהצדעה',                'מזרחי טפחות',      'כרטיס אשראי למילואים ומשרתים','#0D47A1', '🛡️', '{"entertainment":8,"household":5,"supermarket":3}')
on conflict (id) do update set
  name = excluded.name, issuer = excluded.issuer, description = excluded.description,
  brand_color = excluded.brand_color, logo_emoji = excluded.logo_emoji,
  category_bonuses = excluded.category_bonuses;

insert into public.vw_clubs (id, name, description, logo_emoji, default_points, category_bonuses, audience) values
  ('club_hever',     'חבר',               'מועדון הצרכנות לאנשי הקבע',     '🏛️', 850, '{"household":12,"supermarket":6,"fashion":8}', 'military'),
  ('club_behatzdaa', 'בהצדעה',            'הטבות לחיילים ומילואימניקים',    '🎖️', 420, '{"entertainment":15,"restaurants":10}',         'military'),
  ('club_istudent',  'iStudent',          'מועדון סטודנטים בכל האוניברסיטאות', '📚', 300, '{"entertainment":20,"books":15,"coffee":10}',  'student'),
  ('club_shufersal', 'שופרסל Deal',        'מועדון השופרסל',                 '🛒', 120, '{"supermarket":8}',                             'general'),
  ('club_fox',       'FOX Loyalty',       'מועדון הלקוחות של FOX',           '🦊', 250, '{"fashion":15}',                                'general'),
  ('club_elal',      'Matmid (אל-על)',   'נקודות הנוסע המתמיד',            '✈️', 1200,'{"travel":10}',                                 'general'),
  ('club_arcaffe',   'Arcaffe Club',      'מועדון ארקפה',                   '☕', 60,  '{"coffee":10,"restaurants":5}',                 'general'),
  ('club_castro',    'Castro Club',       'מועדון Castro',                  '👕', 90,  '{"fashion":12}',                                'general'),
  ('club_big',       'BIG Club',          'מועדון קניונים BIG',             '🏬', 180, '{"fashion":5,"restaurants":5,"entertainment":5}','general'),
  ('club_cinema',    'Cinema City',       'מועדון הקולנוע',                 '🎬', 140, '{"entertainment":25}',                          'general')
on conflict (id) do update set
  name = excluded.name, description = excluded.description,
  logo_emoji = excluded.logo_emoji, default_points = excluded.default_points,
  category_bonuses = excluded.category_bonuses, audience = excluded.audience;

insert into public.vw_merchants (id, name, category, logo_emoji, location) values
  ('m_shufersal',   'שופרסל',         'supermarket',    '🛒', 'ברחבי הארץ'),
  ('m_ramilevi',    'רמי לוי',        'supermarket',    '🛍️', 'ברחבי הארץ'),
  ('m_arcaffe',     'ארקפה',          'coffee',         '☕', 'דיזנגוף סנטר, ת"א'),
  ('m_castro',      'Castro',         'fashion',        '👗', 'עזריאלי, ת"א'),
  ('m_fox',         'FOX',            'fashion',        '🦊', 'גרנד קניון, הרצליה'),
  ('m_mcdonalds',   'McDonald''s',    'restaurants',    '🍔', 'אבן גבירול, ת"א'),
  ('m_zara',        'Zara',           'fashion',        '🛍️', 'דיזנגוף סנטר, ת"א'),
  ('m_ikea',        'איקאה',          'household',      '🛋️', 'נתניה'),
  ('m_steimatzky',  'סטימצקי',        'books',          '📚', 'רמת אביב, ת"א'),
  ('m_dan',         'מלון Dan',      'travel',         '🏨', 'טיילת ת"א'),
  ('m_cinemacity',  'Cinema City',    'entertainment',  '🎬', 'גלילות'),
  ('m_superpharm',  'סופר-פארם',      'pharmacy',       '💊', 'דיזנגוף, ת"א'),
  ('m_burgus',      'בורגוס',         'restaurants',    '🍔', 'ת"א'),
  ('m_golda',       'גולדה גלידה',    'coffee',         '🍦', 'ת"א'),
  ('m_dominos',     'דומינו''ס פיצה', 'restaurants',    '🍕', 'ברחבי הארץ')
on conflict (id) do update set
  name = excluded.name, category = excluded.category,
  logo_emoji = excluded.logo_emoji, location = excluded.location;

-- =========================
-- Helper function: auto-create profile row on signup
-- =========================

create or replace function public.vw_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.vw_profiles (id, name, onboarding_done)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), false)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- NOTE: we don't attach a trigger to auth.users because financeapp may already have its own trigger.
-- The app creates the vw_profiles row explicitly during /onboarding.
