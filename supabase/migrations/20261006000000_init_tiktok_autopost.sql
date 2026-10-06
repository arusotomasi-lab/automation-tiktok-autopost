-- Applied to Supabase project oykokptpfthfftlysels as migration "init_tiktok_autopost".
create type public.post_status as enum ('pending','ready','scheduled','posted','failed');

create table public.tiktok_posts (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'telegram',
  telegram_chat_id bigint,
  telegram_file_id text,
  r2_key text not null,
  video_url text not null,
  caption text,
  hashtags text[] not null default '{}',
  gemini_raw jsonb,
  status public.post_status not null default 'pending',
  scheduled_at timestamptz not null default now(),
  buffer_post_id text,
  posted_at timestamptz,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tiktok_posts_due_idx on public.tiktok_posts (scheduled_at) where status = 'ready';

create table public.automation_logs (
  id bigint generated always as identity primary key,
  post_id uuid references public.tiktok_posts(id) on delete cascade,
  stage text not null,
  level text not null default 'info' check (level in ('info','warn','error')),
  message text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index automation_logs_post_idx on public.automation_logs (post_id);

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger tiktok_posts_updated_at before update on public.tiktok_posts
for each row execute function public.set_updated_at();

-- Only service_role (n8n backend) may access; RLS on with no public policies.
alter table public.tiktok_posts enable row level security;
alter table public.automation_logs enable row level security;
revoke all on public.tiktok_posts, public.automation_logs from anon, authenticated;
