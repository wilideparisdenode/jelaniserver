-- Feature release: tutor role, content expiry, and an events feed.
-- Run after 003_posts_comments.sql (uses public.touch_updated_at()).

-- ---------------------------------------------------------------- roles
-- Profiles may now be students, tutors (content authors) or admins.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'tutor', 'admin'));

-- ------------------------------------------------------ content expiry
-- Posts and announcements can carry an optional active-until timestamp. When set and
-- in the past, the public/student feeds hide the item; admins still see it in the dashboard.
alter table public.posts         add column if not exists expires_at timestamptz;
alter table public.announcements add column if not exists expires_at timestamptz;

-- ------------------------------------------------------------- events
-- Public events with an image and an optional video link (YouTube/Vimeo/mp4).
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  cover_image text,
  video_url   text,
  location    text,
  event_date  timestamptz,
  published   boolean not null default false,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists events_published_idx on public.events (published, event_date desc);

alter table public.events enable row level security;
drop policy if exists "public read published events" on public.events;
create policy "public read published events" on public.events for select using (published);

drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

-- Promote a signed-up user to tutor or admin:
--   update public.profiles set role = 'tutor' where id = '<auth user uuid>';
