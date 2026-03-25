-- ============================================
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- Transactions table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  description text not null,
  amount numeric(12,2) not null,
  category text not null default 'other',
  manual_category boolean not null default false,
  created_at timestamptz default now()
);

-- Categories table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  cat_id text not null,
  label text not null,
  icon text not null default '📦',
  color text not null default '#90A4AE',
  sort_order int not null default 0,
  created_at timestamptz default now(),
  unique(user_id, cat_id)
);

-- Row Level Security: users can only see/edit their own data
alter table public.transactions enable row level security;
alter table public.categories enable row level security;

create policy "Users manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes for performance
create index idx_transactions_user_date on public.transactions(user_id, date);
create index idx_categories_user on public.categories(user_id);
