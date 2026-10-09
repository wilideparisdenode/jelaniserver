-- ============================================================
-- Jelani Consulting LMS - full database setup.
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> Run.
-- Safe to run more than once (idempotent).
-- ============================================================

-- ---------- migrations\001_schema.sql ----------
-- OnlineRegistration LMS schema for Supabase (PostgreSQL).
-- Run in the Supabase SQL editor, or via `supabase db push`.
-- The Express API uses the service-role key (bypasses RLS). RLS is enabled
-- everywhere so the public anon key can only read published catalog data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now()
);

-- Auto-create a profile whenever a Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------- categories
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------- courses
create table if not exists public.courses (
  id                  text primary key check (id ~ '^[a-z0-9-]{2,80}$'),
  category_id         uuid references public.categories (id) on delete set null,
  title               text not null,
  description         text not null,
  duration            text not null,
  level               text not null,
  price_cents         int  not null check (price_cents >= 100),
  currency            text not null default 'usd',
  registration_start  date,
  image               text,
  syllabus            text[] not null default '{}',
  career_pathways     jsonb  not null default '[]'::jsonb, -- [{title, description}]
  published           boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists courses_published_idx on public.courses (published, created_at);

-- ---------------------------------------------------------------- branches
create table if not exists public.branches (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  mode       text not null check (mode in ('physical', 'virtual')),
  address    text,
  city       text,
  description text,
  sort_order int not null default 0
);

create table if not exists public.course_branches (
  course_id text not null references public.courses (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  primary key (course_id, branch_id)
);

-- ------------------------------------------------------- brand / marketing
create table if not exists public.partners (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  logo_url   text,
  website    text,
  sort_order int not null default 0
);

create table if not exists public.alumni (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  course_id  text references public.courses (id) on delete set null,
  role_title text not null,
  company    text,
  story      text not null,
  photo_url  text,
  sort_order int not null default 0
);

create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  author     text not null,
  course_id  text references public.courses (id) on delete set null,
  quote      text not null,
  rating     int not null default 5 check (rating between 1 and 5),
  published  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.staff (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  title      text not null,
  bio        text,
  photo_url  text,
  sort_order int not null default 0
);

-- -------------------------------------------------------------------- jobs
create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  company       text not null,
  location      text,
  description   text not null,
  apply_email   text not null,
  contact_name  text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------ orders / enrolment
create table if not exists public.orders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users (id) on delete restrict,
  course_id                   text not null references public.courses (id) on delete restrict,
  branch_id                   uuid references public.branches (id) on delete set null,
  student_name                text not null,
  email                       text not null,
  phone                       text,
  status                      text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'refunded')),
  subtotal_cents              int not null,
  fee_cents                   int not null default 0,
  total_cents                 int not null,
  currency                    text not null default 'usd',
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text unique,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
-- A student can hold only one live (pending/confirmed) order per course.
create unique index if not exists orders_one_live_per_course
  on public.orders (user_id, course_id) where status in ('pending', 'confirmed');

-- ------------------------------------------------------------ LMS content
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  course_id  text references public.courses (id) on delete cascade, -- null = all students
  title      text not null,
  body       text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id         uuid primary key default gen_random_uuid(),
  course_id  text not null references public.courses (id) on delete cascade,
  title      text not null,
  questions  jsonb not null default '[]'::jsonb, -- [{prompt, options[], answerIndex}]
  published  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references public.quizzes (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  score      int not null,
  total      int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.qa_questions (
  id         uuid primary key default gen_random_uuid(),
  course_id  text not null references public.courses (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  author     text not null,
  question   text not null,
  answer     text,
  answered_by uuid references auth.users (id) on delete set null,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- RLS policies
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.courses        enable row level security;
alter table public.branches       enable row level security;
alter table public.course_branches enable row level security;
alter table public.partners       enable row level security;
alter table public.alumni         enable row level security;
alter table public.testimonials   enable row level security;
alter table public.staff          enable row level security;
alter table public.jobs           enable row level security;
alter table public.orders         enable row level security;
alter table public.announcements  enable row level security;
alter table public.quizzes        enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.qa_questions   enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "public read published courses" on public.courses;
create policy "public read published courses" on public.courses for select using (published);
drop policy if exists "public read branches" on public.branches;
create policy "public read branches" on public.branches for select using (true);
drop policy if exists "public read course_branches" on public.course_branches;
create policy "public read course_branches" on public.course_branches for select using (true);
drop policy if exists "public read partners" on public.partners;
create policy "public read partners" on public.partners for select using (true);
drop policy if exists "public read alumni" on public.alumni;
create policy "public read alumni" on public.alumni for select using (true);
drop policy if exists "public read testimonials" on public.testimonials;
create policy "public read testimonials" on public.testimonials for select using (published);
drop policy if exists "public read staff" on public.staff;
create policy "public read staff" on public.staff for select using (true);
drop policy if exists "own orders read" on public.orders;
create policy "own orders read" on public.orders for select using (auth.uid() = user_id);
-- jobs, quizzes, quiz_attempts, qa_questions, announcements: server (service role) only.

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists courses_touch on public.courses;
create trigger courses_touch before update on public.courses
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- To make a user an admin after they sign up:
--   update public.profiles set role = 'admin' where id = '<auth user uuid>';


-- ---------- migrations\002_free_courses.sql ----------
-- Allow free ($0) courses alongside paid ones.
-- Original inline check required price_cents >= 100, which blocked free courses.

alter table public.courses drop constraint if exists courses_price_cents_check;
alter table public.courses add constraint courses_price_cents_check check (price_cents >= 0);


-- ---------- migrations\003_posts_comments.sql ----------
-- Public, commentable posts authored by admins, with admin-moderated comments.
-- Run after 001_schema.sql (uses public.touch_updated_at()).

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  excerpt     text,
  body        text not null,
  cover_image text,
  author_name text,
  published   boolean not null default false,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists posts_published_idx on public.posts (published, created_at desc);

-- Comments start unapproved until an admin moderates them.
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  author     text not null,
  body       text not null,
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, approved, created_at desc);
create index if not exists comments_approved_idx on public.comments (approved, created_at desc);

alter table public.posts    enable row level security;
alter table public.comments enable row level security;

-- Anonymous visitors may read published posts. Moderation and writes go through the
-- Express API using the service-role key.
drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts" on public.posts for select using (published);

-- A signed-in user can read their own comments (approved ones are served via the API).
drop policy if exists "own comments read" on public.comments;
create policy "own comments read" on public.comments for select using (auth.uid() = user_id);

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();


