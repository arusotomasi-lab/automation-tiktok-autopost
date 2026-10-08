# CLAUDE.md

Otomasi posting video TikTok (niche Point Blank): **Telegram → Cloudflare R2 + Gemini → Supabase (gudang) → n8n → Buffer → TikTok**.
Status terkini, masalah terbuka, dan langkah berikutnya ada di [HANDOFF.md](HANDOFF.md). Baca itu dulu sebelum mulai kerja.

## Sumber kebenaran

- **Versi live di n8n dan Supabase adalah sumber kebenaran.** File `n8n/*.workflow.ts` dan `supabase/migrations/` di repo **tertinggal** (belum berisi `add_to_pool`, `claim_slot_posts`, node verifikasi Cloudflare, dsb.). Hanya untuk referensi. Selalu cek versi live lewat MCP sebelum menyimpulkan perilaku sistem.
- Sebagian isi [README.md](README.md) sudah usang: bagian "Mode saat ini: laporan saja", "Caption (Gemini)" dengan `offer`/`cta`/coaching, alur `enqueue_post`, dan batas 20 MB. Jika bertentangan, ikuti HANDOFF.md dan aturan di file ini.

## Alur sistem

1. Owner mengirim video (100–200 MB) ke bot Telegram. Bot memakai **Telegram Bot API self-hosted** (Railway `telegram-bot-api`, batas 2 GB).
2. **n8n 1. Ingest** (`qbvS8aQsVwvHzURm`): upload ke R2 `videos/yyyy/MM/dd/<file_unique_id>.mp4`, lalu Gemini membuat judul, caption, dan hashtag (teks saja, Gemini tidak melihat video). Setelah itu node *Parse Caption Gemini* menjalankan filter keamanan, lalu HEAD ke Cloudflare untuk mencocokkan ukuran file. RPC `add_to_pool` menyimpan baris `status = 'pending'`, lalu bot mengirim notif "📦 VIDEO MASUK GUDANG".
3. **n8n 2. Publish** (`JYX8Kd4ZX2JuLSkH`, tiap 1 menit): RPC `claim_slot_posts()` mengambil 1 video pending acak untuk slot yang jatuh tempo (jendela 30 menit). Video dikirim lewat Buffer `createPost` (shareNow), lalu ditandai posted/failed (retry maks 3x, jeda 10 menit). Setelah 3 menit, status dicek di Buffer dan notif ✅/⏳/❌ dikirim beserta link TikTok. Setelah 25 menit, file disalin ke `posted/` lalu dihapus dari `videos/`.
4. **n8n 3. Error Alert** (`laDi26b1feomGj9o`): kirim pesan Telegram jika workflow crash. Workflow ini belum dipasang sebagai `errorWorkflow` di Ingest dan Publish.

Slot ada di tabel `posting_slots`: 08:00 @cheatpointblank90, 12:00 @cheatpointblank198, 18:00 @citlahhh (WIB). ID channel Buffer tercatat di HANDOFF.md.

**Aturan keras: 1 video = 1 akun = 1 kali posting.** Video yang sudah diambil dari gudang tidak boleh kembali ke `pending` atau diposting ulang ke akun lain. Retry memakai video dan akun yang sama.

## Aturan konten caption (permintaan owner, wajib dipertahankan)

- Gaya: hook (misal "Main PB kerasa sulit?") lalu "optimalkan gameplay/setting/strategi biar makin jago". Santai, **bukan jualan**.
- **Dilarang**:
  - ajakan order, beli, DM, harga, promo;
  - ajakan ke platform lain (Telegram, WA, IG, Discord, YouTube, "link di bio", grup, nomor);
  - kata *panduan, tutorial, guide, tips*;
  - kata *cheat, hack, aimbot, helper, assistant, aplikasi, sistem, coaching*;
  - klaim auto-aim, anti-ban, atau pasti menang;
  - menyebut AI/Gemini.
- Jangan menulis caption yang mempromosikan atau menyamarkan cheat.
- Hashtag divariasikan, `#fyp` selalu ada, maksimal 6.
- Saat mengubah prompt Gemini atau node *Parse Caption Gemini*, filter keamanan (buang kalimat CTA/off-platform, ganti kata berisiko) harus tetap ada. Perbarui juga `tests/safety-filter.test.js` bila logikanya berubah.

## Aturan kerja

- Push hanya ke branch `claude/tiktok-auto-posting-fvvkek`. Jangan buat PR kecuali diminta.
- Push **tidak** otomatis deploy. Untuk deploy `telegram-bot-api`: push, lalu Railway `connect-service-source` ke branch ini.
- **Jangan pernah meminta atau menulis token, api_hash, API key, atau kode rahasia di chat maupun di repo.** Owner mengisinya langsung di Railway atau n8n.
- Publish workflow n8n mungkin diblokir untuk asisten. Jika gagal, minta owner klik Publish di n8n.
- `.mcp.json` berisi konfigurasi lokal dan sudah di-`.gitignore`. Jangan di-commit.
- Owner menerima notifikasi di chat Telegram `2008311661`. Hindari tes yang mengirim spam ke chat itu atau memposting ke akun TikTok sungguhan tanpa persetujuan.

## Perintah

```bash
node tests/expressions.test.js     # ekspresi n8n: body GraphQL Buffer, parser JSON Gemini, array Postgres
node tests/safety-filter.test.js   # filter keamanan caption & hashtag
```

Cek cepat via Supabase MCP (`execute_sql`):

```sql
select status, count(*) from tiktok_posts group by status;   -- enum post_status: pending, ready (alur lama), scheduled, posted, failed
select account_name, title, posted_at at time zone 'Asia/Jakarta'
  from tiktok_posts where status = 'posted' order by posted_at desc;
select * from posting_slots order by slot_time;
```

Baris `failed` (10 baris) dan 1 baris `posted` tanpa akun/judul adalah data uji lama. `claim_slot_posts` mengabaikannya, jadi jangan dihapus tanpa izin.

## Infrastruktur

| Komponen | Detail |
|---|---|
| n8n (Railway) | `https://n8n-production-97ba.up.railway.app`, timezone `Asia/Jakarta`, `N8N_DEFAULT_BINARY_DATA_MODE=filesystem`, `N8N_CONCURRENCY_PRODUCTION_LIMIT=1` (RAM ±1 GB, video diproses satu per satu) |
| Railway | project `giving-success`, service `n8n`, `telegram-bot-api`, `Postgres` (DB internal n8n) |
| telegram-bot-api | folder `telegram-bot-api/` (Dockerfile, nginx, `start.sh`). Alamat privat `http://telegram-bot-api.railway.internal:8080`. Volume hanya **500 MB**, sehingga `start.sh` menghapus media saat boot dan media > 1 menit tiap 20 detik. Jangan longgarkan pembersihan ini (volume penuh pernah membuat server crash). |
| Supabase | project `oykokptpfthfftlysels`. Tabel `tiktok_posts`, `posting_slots`, `automation_logs`. RPC bersifat security definer, RLS hanya untuk service_role. |
| Cloudflare R2 | bucket `tiktok-auto-post`, URL publik `https://pub-8bc2479eda66445b8647fffa32f2cdfc.r2.dev`. Node S3 `getAll` mengembalikan kosong, sedangkan copy/delete berfungsi. |
| Gemini | utama `gemini-3.5-flash-lite`, cadangan `gemini-3.1-flash-lite` |
| Buffer | GraphQL `https://api.buffer.com`, credential n8n "Buffer API" |
