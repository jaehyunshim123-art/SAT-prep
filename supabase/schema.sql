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
-- Unused since Focus Shields became per-session; kept so older clients don't break.
alter table public.profiles add column if not exists focus_shields integer not null default 3;
-- Curriculum progress (chapter ids 1-10; chapter 1 is always unlocked).
alter table public.profiles add column if not exists unlocked_chapters integer[] not null default '{1}';
alter table public.profiles add column if not exists completed_chapters integer[] not null default '{}';
alter table public.profiles add column if not exists unlocked_themes text[] not null default '{}';
alter table public.profiles add column if not exists unlocked_badges text[] not null default '{}';
-- { stake, startStreak, target, placedOn } while a Double-Spark Wager is active
alter table public.profiles add column if not exists spark_wager jsonb;
alter table public.profiles add column if not exists unlocked_avatars text[] not null default '{}';
alter table public.profiles add column if not exists combo_savers integer not null default 0;
-- Vocab Vault: { words: { [id]: { tier, seen, correct, wrong, lastAt, lastDay, advancedDay, mastered } }, sprintDay, sprints }
alter table public.profiles add column if not exists vocab_progress jsonb not null default '{}'::jsonb;

-- Dashboard tests and practice sets: { [chapterId]: { best, last, n, passed, attempts, at } }
alter table public.profiles add column if not exists chapter_tests jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists practice_sets jsonb not null default '{}'::jsonb;
-- Trophy Case: { [badgeId]: ms unlocked } and the count of 10/10 sets
alter table public.profiles add column if not exists badge_times jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists flawless_runs integer not null default 0;
-- Per-question progress: { chapterCorrect: { [ch]: ids }, missed: ids, genCursor: { [ch]: n } }
alter table public.profiles add column if not exists practice_progress jsonb not null default '{}'::jsonb;
-- Focus Meter: { focus, streak, resetAt, at }
alter table public.profiles add column if not exists focus_state jsonb;

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


-- ============================================================================
-- Social: leaderboards, friends, friend streaks, Lock In alerts, push.
-- ============================================================================

-- Public card for leaderboards and friend search. Everything here is visible
-- to every signed-in user, so it holds only what a leaderboard shows.
create table if not exists public.user_public (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  username         text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name     text not null default 'SatWizz student' check (char_length(display_name) between 1 and 30),
  avatar           text not null default 'fox',
  total_xp         integer not null default 0 check (total_xp >= 0),
  sparks           integer not null default 0 check (sparks >= 0),
  current_streak   integer not null default 0 check (current_streak >= 0),
  last_practice_at timestamptz, -- written only by record_practice()
  updated_at       timestamptz not null default now()
);
create index if not exists user_public_xp_idx on public.user_public (total_xp desc);
create index if not exists user_public_sparks_idx on public.user_public (sparks desc);

alter table public.user_public enable row level security;
drop policy if exists "user_public: read" on public.user_public;
drop policy if exists "user_public: insert own" on public.user_public;
drop policy if exists "user_public: update own" on public.user_public;
create policy "user_public: read" on public.user_public
  for select to authenticated using (true);
create policy "user_public: insert own" on public.user_public
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_public: update own" on public.user_public
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Clients may not set last_practice_at themselves.
revoke insert, update on public.user_public from anon, authenticated;
grant select on public.user_public to authenticated;
grant insert (user_id, username, display_name, avatar, total_xp, sparks, current_streak, updated_at)
  on public.user_public to authenticated;
grant update (user_id, username, display_name, avatar, total_xp, sparks, current_streak, updated_at)
  on public.user_public to authenticated;

-- One row per pair of users (user_low < user_high). Friend streak lives here.
create table if not exists public.friendships (
  id           bigint generated always as identity primary key,
  user_low     uuid not null references auth.users (id) on delete cascade,
  user_high    uuid not null references auth.users (id) on delete cascade,
  requested_by uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  streak       integer not null default 0 check (streak >= 0),
  streak_date  date, -- UTC day the friend streak last grew
  created_at   timestamptz not null default now(),
  check (user_low < user_high),
  unique (user_low, user_high)
);
create index if not exists friendships_high_idx on public.friendships (user_high);

alter table public.friendships enable row level security;
drop policy if exists "friendships: read own" on public.friendships;
drop policy if exists "friendships: delete own" on public.friendships;
create policy "friendships: read own" on public.friendships
  for select to authenticated using ((select auth.uid()) in (user_low, user_high));
create policy "friendships: delete own" on public.friendships
  for delete to authenticated using ((select auth.uid()) in (user_low, user_high));
-- Inserts and updates only happen through the functions below.
revoke insert, update on public.friendships from anon, authenticated;

-- "Lock In" nudges between friends. Inserted by send_lock_in().
create table if not exists public.lock_ins (
  id         bigint generated always as identity primary key,
  from_user  uuid not null references auth.users (id) on delete cascade,
  to_user    uuid not null references auth.users (id) on delete cascade,
  message    text not null,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists lock_ins_to_idx on public.lock_ins (to_user, created_at desc);

alter table public.lock_ins enable row level security;
drop policy if exists "lock_ins: read own" on public.lock_ins;
drop policy if exists "lock_ins: mark read" on public.lock_ins;
create policy "lock_ins: read own" on public.lock_ins
  for select to authenticated using ((select auth.uid()) in (from_user, to_user));
create policy "lock_ins: mark read" on public.lock_ins
  for update to authenticated using ((select auth.uid()) = to_user) with check ((select auth.uid()) = to_user);
revoke insert, update on public.lock_ins from anon, authenticated;
grant update (read_at) on public.lock_ins to authenticated;

-- Web Push subscriptions (one per browser/device).
create table if not exists public.push_subscriptions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push: manage own" on public.push_subscriptions;
create policy "push: manage own" on public.push_subscriptions
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Send a friend request by @username. If they already asked you, this accepts.
create or replace function public.send_friend_request(target_username text)
returns public.friendships
language plpgsql security definer set search_path = public
as $$
declare
  me     uuid := auth.uid();
  target uuid;
  result public.friendships;
begin
  if me is null then raise exception 'not_signed_in'; end if;
  select user_id into target from public.user_public
   where username = lower(ltrim(trim(target_username), '@'));
  if target is null then raise exception 'user_not_found'; end if;
  if target = me then raise exception 'cannot_friend_self'; end if;

  insert into public.friendships (user_low, user_high, requested_by)
  values (least(me, target), greatest(me, target), me)
  on conflict (user_low, user_high) do update
    set status = case
      when public.friendships.status = 'pending' and public.friendships.requested_by <> me then 'accepted'
      else public.friendships.status
    end
  returning * into result;
  return result;
end $$;

-- Accept or decline a request sent to you. Declining (or unfriending) deletes the row.
create or replace function public.respond_friend_request(request_id bigint, accept boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not_signed_in'; end if;
  if accept then
    update public.friendships set status = 'accepted'
     where id = request_id and status = 'pending' and requested_by <> me and me in (user_low, user_high);
  else
    delete from public.friendships where id = request_id and me in (user_low, user_high);
  end if;
  if not found then raise exception 'request_not_found'; end if;
end $$;

-- Call when the user practices. Marks them active and grows every friend
-- streak where the friend also practiced within the last 24 hours
-- (at most once per UTC day; a missed day restarts the streak at 1).
create or replace function public.record_practice()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  me    uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
begin
  if me is null then return; end if;
  update public.user_public set last_practice_at = now() where user_id = me;

  update public.friendships f
     set streak = case when f.streak_date = today - 1 then f.streak + 1 else 1 end,
         streak_date = today
    from public.user_public p
   where f.status = 'accepted'
     and me in (f.user_low, f.user_high)
     and p.user_id = case when f.user_low = me then f.user_high else f.user_low end
     and p.last_practice_at > now() - interval '24 hours'
     and f.streak_date is distinct from today;
end $$;

-- Nudge a friend. One per friend every 4 hours. Returns the stored alert;
-- the lock-in Edge Function then pushes it to the friend's devices.
create or replace function public.send_lock_in(target uuid)
returns public.lock_ins
language plpgsql security definer set search_path = public
as $$
declare
  me       uuid := auth.uid();
  today    date := (now() at time zone 'utc')::date;
  pair     public.friendships;
  sender   text;
  days     integer;
  result   public.lock_ins;
begin
  if me is null then raise exception 'not_signed_in'; end if;
  select * into pair from public.friendships
   where user_low = least(me, target) and user_high = greatest(me, target) and status = 'accepted';
  if pair.id is null then raise exception 'not_friends'; end if;
  if exists (select 1 from public.lock_ins
              where from_user = me and to_user = target and created_at > now() - interval '4 hours') then
    raise exception 'already_locked_in';
  end if;

  select display_name into sender from public.user_public where user_id = me;
  days := case when pair.streak_date >= today - 1 then pair.streak else 0 end;

  insert into public.lock_ins (from_user, to_user, message)
  values (me, target, case
    when days > 0 then format('%s told you to Lock In! Keep your %s-day streak alive.', coalesce(sender, 'A friend'), days)
    else format('%s told you to Lock In! Start a streak together today.', coalesce(sender, 'A friend'))
  end)
  returning * into result;
  return result;
end $$;

revoke execute on function public.send_friend_request(text) from public, anon;
revoke execute on function public.respond_friend_request(bigint, boolean) from public, anon;
revoke execute on function public.record_practice() from public, anon;
revoke execute on function public.send_lock_in(uuid) from public, anon;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_friend_request(bigint, boolean) to authenticated;
grant execute on function public.record_practice() to authenticated;
grant execute on function public.send_lock_in(uuid) to authenticated;

-- Live in-app Lock In banners (Supabase Realtime).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lock_ins'
  ) then
    alter publication supabase_realtime add table public.lock_ins;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- Feedback: "Suggest a Feature / Report a Bug" (Help overlay).
-- Anyone using the site (guest or signed in) can ADD feedback; no one can read
-- it through the site. Read it in Supabase → Table Editor → feedback.
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users (id) on delete set null,
  kind       text not null check (kind in ('feature', 'bug')),
  body       text not null check (char_length(body) between 1 and 1000),
  view       text check (char_length(view) <= 20),
  client_id  text check (char_length(client_id) <= 40), -- the browser's entry id, so a retry never doubles up
  created_at timestamptz not null default now()
);
create unique index if not exists feedback_client_id_key on public.feedback (client_id);
alter table public.feedback enable row level security;
drop policy if exists "feedback: anyone can add" on public.feedback;
create policy "feedback: anyone can add" on public.feedback
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
-- No select/update/delete policies: entries are write-only from the site.
grant insert on public.feedback to anon, authenticated;


-- ---------------------------------------------------------------------------
-- "Delete my account" (Profile → Settings → Privacy & terms).
-- Removes the caller's sign-in record; every table above that references
-- auth.users cascades (profiles, settings, public profile, friendships,
-- Lock Ins, push subscriptions). Feedback keeps its text but loses the link
-- (on delete set null).
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not_signed_in'; end if;
  delete from auth.users where id = me;
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
