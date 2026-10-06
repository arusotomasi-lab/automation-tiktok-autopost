-- Applied as migration "posting_slots_and_queue" (07 Okt 2026).
-- Posting slots: one TikTok account (Buffer channel) per time of day (WIB)
create table public.posting_slots (
  id bigint generated always as identity primary key,
  slot_time time not null,
  buffer_channel_id text not null,
  account_name text not null,
  active boolean not null default true,
  unique (slot_time)
);
alter table public.posting_slots enable row level security;
revoke all on public.posting_slots from anon, authenticated;

insert into public.posting_slots (slot_time, buffer_channel_id, account_name) values
  ('09:00', '6ac52d8e6a5c39ccb632b50f', 'cheatpointblank90'),
  ('13:00', '6ac52d5e6a5c39ccb632b2e7', 'cheatpointblank198'),
  ('19:00', '6ac52d2e6a5c39ccb632b08b', 'citlahhh');

alter table public.tiktok_posts
  add column if not exists buffer_channel_id text,
  add column if not exists account_name text;

-- Atomically pick the next free slot and insert the post (no double-booking).
create or replace function public.enqueue_post(
  p_telegram_chat_id bigint, p_telegram_file_id text, p_r2_key text, p_video_url text,
  p_title text, p_caption text, p_hashtags text[],
  p_gemini_raw jsonb default null, p_scheduled_at timestamptz default null
) returns public.tiktok_posts
language plpgsql security definer set search_path = '' as $$
declare
  v_slot record; v_ts timestamptz; v_row public.tiktok_posts;
  v_today date := (now() at time zone 'Asia/Jakarta')::date; d int;
begin
  perform pg_advisory_xact_lock(hashtext('enqueue_post'));
  if p_scheduled_at is not null then
    select s.buffer_channel_id, s.account_name into v_slot
    from public.posting_slots s where s.active
    order by (select count(*) from public.tiktok_posts t
              where t.buffer_channel_id = s.buffer_channel_id and t.status in ('ready','scheduled')), s.slot_time
    limit 1;
    v_ts := greatest(p_scheduled_at, now());
  else
    for d in 0..60 loop
      for v_slot in select s.slot_time, s.buffer_channel_id, s.account_name
                    from public.posting_slots s where s.active order by s.slot_time loop
        v_ts := ((v_today + d) + v_slot.slot_time) at time zone 'Asia/Jakarta';
        continue when v_ts <= now();
        continue when exists (select 1 from public.tiktok_posts t
          where t.scheduled_at = v_ts and t.status in ('ready','scheduled','posted'));
        exit;
      end loop;
      exit when v_ts > now() and not exists (select 1 from public.tiktok_posts t
          where t.scheduled_at = v_ts and t.status in ('ready','scheduled','posted'));
    end loop;
  end if;
  if v_slot.buffer_channel_id is null then raise exception 'Tidak ada posting_slots yang aktif'; end if;
  insert into public.tiktok_posts
    (source, telegram_chat_id, telegram_file_id, r2_key, video_url, title, caption, hashtags,
     gemini_raw, status, scheduled_at, buffer_channel_id, account_name)
  values ('telegram', p_telegram_chat_id, p_telegram_file_id, p_r2_key, p_video_url, p_title, p_caption,
     coalesce(p_hashtags, '{}'), p_gemini_raw, 'ready', v_ts, v_slot.buffer_channel_id, v_slot.account_name)
  returning * into v_row;
  return v_row;
end $$;

-- Auto-retry: failed posts (max 3 attempts, 10 min cooldown) go back to the queue.
create or replace function public.requeue_failed() returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  update public.tiktok_posts set status = 'ready', scheduled_at = now()
   where status = 'failed' and attempts < 3
     and updated_at < now() - interval '10 minutes'
     and coalesce(last_error, '') not like 'Data uji%';
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.enqueue_post(bigint, text, text, text, text, text, text[], jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.requeue_failed() from public, anon, authenticated;
grant execute on function public.enqueue_post(bigint, text, text, text, text, text, text[], jsonb, timestamptz) to service_role;
grant execute on function public.requeue_failed() to service_role;
