-- Allow free ($0) courses alongside paid ones.
-- Original inline check required price_cents >= 100, which blocked free courses.

alter table public.courses drop constraint if exists courses_price_cents_check;
alter table public.courses add constraint courses_price_cents_check check (price_cents >= 0);
