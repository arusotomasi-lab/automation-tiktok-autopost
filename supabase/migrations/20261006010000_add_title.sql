-- Applied as migration "add_title_to_tiktok_posts".
alter table public.tiktok_posts add column if not exists title text;
