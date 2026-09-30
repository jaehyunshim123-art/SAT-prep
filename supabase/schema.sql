-- SatWizz cloud sync schema. Run once in the Supabase SQL editor.

create table if not exists public.profiles (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  email          text,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak    integer not null default 0 check (best_streak >= 0),
  total_xp       integer not null default 0 check (total_xp >= 0),
  streak_freezes integer not null default 0, -- Aura Shields, 0-5 (constraint below)
  -- Local date (YYYY-MM-DD) the daily goal was last met. Without it another
  -- device can't tell whether current_streak is still alive.
  last_goal_date date,
  updated_at     timestamptz not null default now()
);

-- Gamification columns. Safe to re-run on an existing project.
alter table public.profiles add column if not exists sparks integer not null default 0;
alter table public.profiles add column if not exists focus_shields integer not null default 3;
alter table public.profiles add column if not exists unlocked_themes text[] not null default '{}';
alter table public.profiles add column if not exists unlocked_badges text[] not null default '{}';
-- { stake, startStreak, target, placedOn } while a Double-Spark Wager is active
alter table public.profiles add column if not exists spark_wager jsonb;
alter table public.profiles add column if not exists unlocked_avatars text[] not null default '{}';
alter table public.profiles add column if not exists combo_savers integer not null default 0;

alter table public.profiles drop constraint if exists profiles_streak_freezes_check;
alter table public.profiles add constraint profiles_streak_freezes_check check (streak_freezes between 0 and 5);
alter table public.profiles drop constraint if exists profiles_sparks_check;
alter table public.profiles add constraint profiles_sparks_check check (sparks >= 0);
alter table public.profiles drop constraint if exists profiles_focus_shields_check;
alter table public.profiles add constraint profiles_focus_shields_check check (focus_shields between 0 and 3);

create table if not exists public.user_settings (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  selected_theme text not null default 'everyday',
  daily_goal     integer not null default 5 check (daily_goal in (5, 10, 20)),
  -- { people: [{ name, pro }, x3], place, craft, event }
  custom_names   jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

-- Preset avatar id (see SatWizz.avatars in js/themes.js)
alter table public.user_settings add column if not exists avatar text not null default 'fox';

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "settings: read own" on public.user_settings;
drop policy if exists "settings: insert own" on public.user_settings;
drop policy if exists "settings: update own" on public.user_settings;
create policy "settings: read own" on public.user_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "settings: insert own" on public.user_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "settings: update own" on public.user_settings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.profiles drop constraint if exists profiles_combo_savers_check;
alter table public.profiles add constraint profiles_combo_savers_check check (combo_savers between 0 and 3);
