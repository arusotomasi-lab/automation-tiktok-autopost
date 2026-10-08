-- Backup sebelum perubahan "caption unik per video + jadwal baru per akun"
-- Diambil 9 Okt 2026 ±00:50 WIB dari project Supabase oykokptpfthfftlysels (read-only).
-- Definisi fungsi = hasil pg_get_functiondef() apa adanya. File ini BUKAN migrasi; hanya untuk rollback/referensi.
--
-- Struktur tabel (ringkas, dari information_schema):
--   tiktok_posts(id uuid pk default gen_random_uuid(), source text not null default 'telegram',
--     telegram_chat_id bigint, telegram_file_id text, r2_key text not null, video_url text not null,
--     caption text, hashtags text[] not null default '{}', gemini_raw jsonb,
--     status post_status not null default 'pending', scheduled_at timestamptz not null default now(),
--     buffer_post_id text, posted_at timestamptz, attempts int not null default 0, last_error text,
--     created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
--     title text, buffer_channel_id text, account_name text)
--   enum post_status = {pending, ready, scheduled, posted, failed}
--   index tiktok_posts_due_idx on (scheduled_at) where status = 'ready'
--   trigger tiktok_posts_updated_at BEFORE UPDATE -> set_updated_at()
--   posting_slots(id bigint pk, slot_time time not null UNIQUE, buffer_channel_id text not null,
--     account_name text not null, active boolean not null default true)
--   automation_logs(id bigint pk, post_id uuid fk -> tiktok_posts on delete cascade, stage text not null,
--     level text not null default 'info' check in (info,warn,error), message text, payload jsonb,
--     created_at timestamptz not null default now())
--   RLS aktif di ketiga tabel, tanpa policy (hanya service_role). EXECUTE fungsi: postgres + service_role.
--   Status per 9 Okt 00:52 WIB: pending 40, posted 8, failed 10 (semua 'Data uji ...'), scheduled 0.

-- ===== Snapshot posting_slots =====
-- id | slot_time | buffer_channel_id        | account_name       | active
--  1 | 08:00:00  | 6ac52d8e6a5c39ccb632b50f | cheatpointblank90  | true
--  2 | 12:00:00  | 6ac52d5e6a5c39ccb632b2e7 | cheatpointblank198 | true
--  3 | 18:00:00  | 6ac52d2e6a5c39ccb632b08b | citlahhh           | true
--  6 | 02:28:00  | 6ac52d8e6a5c39ccb632b50f | cheatpointblank90  | false
--
-- Rollback jadwal (urutan penting karena UNIQUE(slot_time); jalankan dalam satu transaksi):
--   begin;
--   update public.posting_slots set slot_time = '18:00' where id = 3;
--   update public.posting_slots set slot_time = '12:00' where id = 2;
--   update public.posting_slots set slot_time = '08:00' where id = 1;
--   commit;

-- ===== add_to_pool =====
CREATE OR REPLACE FUNCTION public.add_to_pool(p_telegram_chat_id bigint, p_telegram_file_id text, p_r2_key text, p_video_url text, p_title text, p_caption text, p_hashtags text[], p_gemini_raw jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_row public.tiktok_posts; v_pool int;
begin
  insert into public.tiktok_posts
    (source, telegram_chat_id, telegram_file_id, r2_key, video_url, title, caption, hashtags, gemini_raw, status, scheduled_at)
  values ('telegram', p_telegram_chat_id, p_telegram_file_id, p_r2_key, p_video_url, p_title, p_caption,
          coalesce(p_hashtags, '{}'), p_gemini_raw, 'pending', now())
  returning * into v_row;
  select count(*) into v_pool from public.tiktok_posts where status = 'pending';
  return to_jsonb(v_row) || jsonb_build_object('pool_count', v_pool);
end $function$
;

-- ===== claim_slot_posts =====
CREATE OR REPLACE FUNCTION public.claim_slot_posts()
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s record; v_ts timestamptz; v_row public.tiktok_posts;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  perform pg_advisory_xact_lock(hashtext('claim_slot_posts'));

  for v_row in
    update public.tiktok_posts set status = 'scheduled', attempts = attempts + 1
     where status = 'failed' and attempts < 3 and buffer_channel_id is not null
       and updated_at < now() - interval '10 minutes'
       and coalesce(last_error, '') not like 'Data uji%'
    returning *
  loop
    return next to_jsonb(v_row) || jsonb_build_object('kind', 'post', 'retry', true);
  end loop;

  for s in select * from public.posting_slots where active order by slot_time loop
    v_ts := (v_today + s.slot_time) at time zone 'Asia/Jakarta';
    continue when v_ts > now() or now() - v_ts > interval '30 minutes';
    continue when exists (select 1 from public.tiktok_posts t
      where t.scheduled_at = v_ts and t.buffer_channel_id = s.buffer_channel_id
        and t.status in ('scheduled', 'posted', 'failed'));

    select * into v_row from public.tiktok_posts
     where status = 'pending' order by random() limit 1 for update skip locked;

    if not found then
      if not exists (select 1 from public.automation_logs
                      where stage = 'empty_pool' and payload->>'slot' = v_ts::text) then
        insert into public.automation_logs (stage, level, message, payload)
        values ('empty_pool', 'warn', 'Gudang video kosong saat slot',
                jsonb_build_object('slot', v_ts::text, 'account', s.account_name));
        return next jsonb_build_object('kind', 'empty_pool', 'account_name', s.account_name, 'scheduled_at', v_ts);
      end if;
      continue;
    end if;

    update public.tiktok_posts
       set status = 'scheduled', scheduled_at = v_ts, buffer_channel_id = s.buffer_channel_id,
           account_name = s.account_name, attempts = attempts + 1
     where id = v_row.id
    returning * into v_row;
    return next to_jsonb(v_row) || jsonb_build_object('kind', 'post', 'retry', false);
  end loop;
end $function$
;

-- ===== enqueue_post (alur lama, tidak dipakai workflow live) =====
CREATE OR REPLACE FUNCTION public.enqueue_post(p_telegram_chat_id bigint, p_telegram_file_id text, p_r2_key text, p_video_url text, p_title text, p_caption text, p_hashtags text[], p_gemini_raw jsonb DEFAULT NULL::jsonb, p_scheduled_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS tiktok_posts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_slot record;
  v_ts timestamptz;
  v_row public.tiktok_posts;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  d int;
begin
  perform pg_advisory_xact_lock(hashtext('enqueue_post'));

  if p_scheduled_at is not null then
    -- explicit time: use the account with the fewest queued posts
    select s.buffer_channel_id, s.account_name into v_slot
    from public.posting_slots s
    where s.active
    order by (select count(*) from public.tiktok_posts t
              where t.buffer_channel_id = s.buffer_channel_id and t.status in ('ready','scheduled')), s.slot_time
    limit 1;
    v_ts := greatest(p_scheduled_at, now());
  else
    for d in 0..60 loop
      for v_slot in
        select s.slot_time, s.buffer_channel_id, s.account_name
        from public.posting_slots s where s.active order by s.slot_time
      loop
        v_ts := ((v_today + d) + v_slot.slot_time) at time zone 'Asia/Jakarta';
        continue when v_ts <= now();
        continue when exists (
          select 1 from public.tiktok_posts t
          where t.scheduled_at = v_ts and t.status in ('ready','scheduled','posted'));
        exit;
      end loop;
      exit when v_ts > now() and not exists (
          select 1 from public.tiktok_posts t
          where t.scheduled_at = v_ts and t.status in ('ready','scheduled','posted'));
    end loop;
  end if;

  if v_slot.buffer_channel_id is null then
    raise exception 'Tidak ada posting_slots yang aktif';
  end if;

  insert into public.tiktok_posts
    (source, telegram_chat_id, telegram_file_id, r2_key, video_url, title, caption, hashtags,
     gemini_raw, status, scheduled_at, buffer_channel_id, account_name)
  values
    ('telegram', p_telegram_chat_id, p_telegram_file_id, p_r2_key, p_video_url, p_title, p_caption,
     coalesce(p_hashtags, '{}'), p_gemini_raw, 'ready', v_ts, v_slot.buffer_channel_id, v_slot.account_name)
  returning * into v_row;
  return v_row;
end $function$
;

-- ===== requeue_failed (alur lama, tidak dipakai workflow live) =====
CREATE OR REPLACE FUNCTION public.requeue_failed()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare n integer;
begin
  update public.tiktok_posts
     set status = 'ready', scheduled_at = now()
   where status = 'failed'
     and attempts < 3
     and updated_at < now() - interval '10 minutes'
     and coalesce(last_error, '') not like 'Data uji%';
  get diagnostics n = row_count;
  return n;
end $function$
;

-- ===== set_updated_at =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin new.updated_at = now(); return new; end $function$
;
