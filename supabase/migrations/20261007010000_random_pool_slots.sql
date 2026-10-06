-- Applied as migration "random_pool_slots" (07 Okt 2026).
-- Schedule: 08:00 / 12:00 / 18:00 WIB, one account each. Videos wait in a warehouse
-- (status 'pending'); each due slot takes ONE random pending video. A video is posted to
-- exactly one account and never picked again (status leaves 'pending' for good).
update public.posting_slots set slot_time = '08:00' where account_name = 'cheatpointblank90';
update public.posting_slots set slot_time = '12:00' where account_name = 'cheatpointblank198';
update public.posting_slots set slot_time = '18:00' where account_name = 'citlahhh';
-- Functions add_to_pool(...) and claim_slot_posts(): see the migration as applied in Supabase
-- (identical bodies are kept in docs below for review).
