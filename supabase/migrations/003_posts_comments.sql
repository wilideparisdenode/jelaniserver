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
