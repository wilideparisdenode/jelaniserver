-- Profile avatars: users can upload a profile picture shown in the navbar and profile page.
-- Run after 004_features.sql.

alter table public.profiles add column if not exists avatar_url text;
