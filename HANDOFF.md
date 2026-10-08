# HANDOFF — TikTok Auto-Post (Point Blank)

Catatan serah-terima untuk sesi/engineer berikutnya. Kondisi per **7 Okt 2026 ±23:20 WIB**.
Sumber kebenaran: workflow live di n8n dan fungsi live di Supabase. File `n8n/*.workflow.ts` di repo **tertinggal** dari versi live (hanya referensi).

---

## 1. Tujuan project

Pemilik cukup mengirim video ke bot Telegram. Sistem lalu:

1. Menyimpan video ke **gudang** (Cloudflare R2 `videos/` + baris Supabase `status = 'pending'`).
2. Membuat **judul, caption, hashtag** lewat Gemini (teks saja, Gemini tidak melihat video; berbasis niche).
3. Pada slot **08:00 / 12:00 / 18:00 WIB**, mengambil **1 video acak** dari gudang dan memposting ke akun TikTok slot itu lewat **Buffer**.
4. Aturan keras: **1 video = 1 akun = 1 kali posting**, tidak pernah diposting ulang.
5. Setelah diposting, file dipindah ke R2 `posted/`.
6. Notifikasi Telegram ke owner (chat `2008311661`): akun, judul, caption, hashtag, link TikTok; plus notifikasi error dan retry otomatis.

Video berukuran 100–200 MB, sehingga dipakai **Telegram Bot API self-hosted** (batas 2 GB; Bot API cloud hanya 20 MB).

### Aturan konten caption (permintaan owner, wajib dipertahankan)
- Gaya: hook ("Main PB kerasa sulit?") + "optimalkan gameplay/setting/strategi biar makin jago". Santai, **bukan jualan**.
- **Dilarang**: ajakan order/beli/DM/harga/promo; ajakan ke platform lain (Telegram, WA, IG, Discord, YouTube, link di bio, grup, nomor); kata *panduan, tutorial, guide, tips*; *cheat, hack, aimbot, helper, assistant, aplikasi, sistem, coaching*; klaim auto-aim/anti-ban/pasti menang; menyebut AI/Gemini.
- Jangan menulis caption yang mempromosikan atau menyamarkan cheat.

---

## 2. Arsitektur

```
Telegram (owner kirim video)
   │  webhook
   ▼
telegram-bot-api (Railway, self-hosted --local, nginx :8080)
   │
   ▼
n8n 1. Ingest ──► Download file ──┬─► Upload ke R2  videos/yyyy/MM/dd/<file_unique_id>.mp4
                                  └─► Gemini (utama → cadangan) → Parse + filter keamanan
              ──► Cek File di Cloudflare (HEAD, cocokkan ukuran, retry 5x)
              ──► Supabase RPC add_to_pool (status pending)
              ──► Telegram "📦 VIDEO MASUK GUDANG … Aman, silakan kirim video berikutnya"

n8n 2. Publish (tiap 1 menit)
   ──► RPC claim_slot_posts()  (kunci slot jatuh tempo, pilih 1 video pending acak)
   ──► Switch: post → Buffer createPost (shareNow)  |  empty_pool → notif gudang kosong
   ──► Tandai Posted / Tandai Gagal (+ notif gagal, retry maks 3x jeda 10 menit)
   ──► Tunggu 3 menit → Cek status di Buffer → Notif ✅/⏳/❌ + link TikTok
   ──► Tunggu 25 menit → Salin ke posted/ → Hapus dari videos/

n8n 3. Error Alert  → pesan Telegram bila workflow crash
```

### Komponen & ID

| Komponen | Detail |
|---|---|
| **n8n** (Railway) | `https://n8n-production-97ba.up.railway.app` — Ingest `qbvS8aQsVwvHzURm`, Publish `JYX8Kd4ZX2JuLSkH`, Error Alert `laDi26b1feomGj9o`. Timezone workflow `Asia/Jakarta`, `executionOrder v1`. |
| **Railway** | Project `giving-success` (`28e0645c-b114-43be-bc0f-3f135ebd6df2`), env production (`34a3f5fa-0dcb-4893-95ea-c18ce9822f61`). Service: `n8n` (`31da58f2-…`), `telegram-bot-api` (`54ddd8ef-…`), `Postgres` (DB internal n8n). |
| **telegram-bot-api** | Folder `telegram-bot-api/` (Dockerfile, nginx.conf, start.sh). Image `aiogram/telegram-bot-api` + nginx. Alamat privat `http://telegram-bot-api.railway.internal:8080`. Volume `telegram-bot-api-data` **500 MB** di `/var/lib/telegram-bot-api`. Variabel `TELEGRAM_API_ID`/`TELEGRAM_API_HASH`. Bot sudah `logOut` dari cloud. |
| **Supabase** | Project `oykokptpfthfftlysels`. Tabel `tiktok_posts`, `posting_slots`, `automation_logs`. RPC `add_to_pool(...)`, `claim_slot_posts()` (security definer, advisory lock, `for update skip locked`, RLS service_role only). |
| **Cloudflare R2** | Bucket `tiktok-auto-post`, publik `https://pub-8bc2479eda66445b8647fffa32f2cdfc.r2.dev`. Folder `videos/yyyy/MM/dd/` (gudang) dan `posted/yyyy/MM/dd/` (arsip). n8n credential S3 "S3 account". |
| **Gemini** | HTTP `generateContent`: utama `gemini-3.5-flash-lite`, cadangan `gemini-3.1-flash-lite` (credential googlePalmApi). |
| **Buffer** | GraphQL `https://api.buffer.com`, credential Header Auth "Buffer API" (`Authorization: Bearer …`). |
| **GitHub** | Repo `arusotomasi-lab/automation-tiktok-autopost`, branch kerja `claude/tiktok-auto-posting-fvvkek`. Push **tidak** otomatis deploy; Railway dipicu ulang via "connect service source" ke branch ini. |

### Slot posting (`posting_slots`)

| id | Jam WIB | Akun | Buffer channel | active |
|---|---|---|---|---|
| 1 | 08:00 | @cheatpointblank90 | `6ac52d8e6a5c39ccb632b50f` | true |
| 2 | 12:00 | @cheatpointblank198 | `6ac52d5e6a5c39ccb632b2e7` | true |
| 3 | 18:00 | @citlahhh | `6ac52d2e6a5c39ccb632b08b` | true |
| 6 | 02:28 | (slot tes) | — | false |

`claim_slot_posts()` mengisi slot yang jatuh tempo dalam jendela 30 menit; gudang kosong → log `empty_pool` + satu notifikasi per slot.

### Setting Railway n8n yang penting
`N8N_DEFAULT_BINARY_DATA_MODE=filesystem`, `GENERIC_TIMEZONE` & `TZ` = `Asia/Jakarta`, `N8N_CONCURRENCY_PRODUCTION_LIMIT=1` (RAM n8n ±1 GB; video diproses satu per satu).

---

## 3. Yang sudah selesai ✅

- Alur end-to-end terbukti: Telegram → R2 → Gemini → gudang → slot → Buffer → **tayang di TikTok**.
  - 07 Okt 08:00 @cheatpointblank90 → https://tiktok.com/@cheatpointblank90/video/7693724588227824916
  - 07 Okt 12:00 @cheatpointblank198 → https://tiktok.com/@cheatpointblank198/video/7693786446087425300
  - 07 Okt 18:00 @citlahhh → terkirim ke Buffer (status "sending" saat dicek 3 menit; link tidak tercatat)
  - Ketiganya otomatis dipindah ke `posted/2026/10/07/` (copy + delete sukses di log n8n).
- Telegram Bot API self-hosted (video sampai 2 GB), log nginx tanpa token.
- Gudang acak + jadwal 3 slot + retry otomatis + notif gudang kosong.
- Publish versi baru (notif dengan link TikTok, pindah ke `posted/` setelah 25 menit) **sudah dipublish**.
- Caption versi baru: tanpa ajakan order/DM, tanpa ajakan ke platform lain, tanpa "panduan/tutorial"; hashtag divariasikan. Filter keamanan di node *Parse Caption Gemini* membuang kalimat CTA/off-platform. 4 video lama di gudang sudah direvisi manual.
- Perbaikan crash server Telegram (volume 500 MB penuh pada 7 Okt 16:51 WIB): `start.sh` kini menghapus semua media saat boot dan media > 1 menit tiap 20 detik (commit `a0ee74a`, `db8ca08`, deploy SUCCESS).
- Gudang per 7 Okt 23:20 WIB: **8 video pending** (0712(12)-1 (1), 0712(13)-1, 0712(15)-1, 0712(16)-1, 0807-1, 0807(1)-1, 0807(2)-1, 0807(3)-1); **4 posted** (termasuk 1 tes 02:28). Ada 1 baris `posted` tanpa akun/judul dan 10 baris `failed` = data uji lama (diabaikan oleh `claim_slot_posts`).

---

## 4. Yang belum selesai ⏳

1. **Publish ulang workflow Ingest** — perubahan terakhir ("Verifikasi file di Cloudflare sebelum masuk gudang & notifikasi": node *Cek File di Cloudflare* → *Ukuran File Cocok?* → *Simpan ke Supabase*, *Notif Gagal Verifikasi*, nama file asli di notif & `gemini_raw.file_name`) **masih draft**. Asisten tidak bisa publish (diblokir); owner harus klik Publish di n8n. Lalu tes 1 video: notif harus berisi "✅ Terverifikasi di Cloudflare" dan "Aman, silakan kirim video berikutnya".
2. **Error workflow belum dipasang** sebagai `errorWorkflow` di setting Ingest & Publish (Error Alert `laDi26b1feomGj9o` aktif tapi tidak direferensikan).
3. **Repo tertinggal**: `n8n/*.workflow.ts` dan migrasi `20261007010000_random_pool_slots.sql` belum berisi definisi live (`add_to_pool`, `claim_slot_posts`, node baru Ingest/Publish). Perlu ekspor ulang dari n8n/Supabase.
4. **Pengecekan duplikat** (ditawarkan, belum disetujui owner): tolak video dengan `file_name` + ukuran sama dengan yang sudah pernah masuk.
5. **Retensi `posted/`** (ditawarkan, belum disetujui): hapus otomatis arsip > 30 hari (±8 GB/bulan pada 3 video/hari).

---

## 5. Masalah yang belum terpecahkan ⚠️

- **MCP n8n, Railway, Cloudflare gagal tersambung** pada sesi terakhir (dan Supabase menolak `execute_sql` dengan "permission"). Owner perlu reconnect di claude.ai → Settings → Connectors sebelum pekerjaan lanjut.
- **Notifikasi saat server Telegram mati hilang**: node notif memakai `onError: continueRegularOutput`, jadi jika telegram-bot-api down (seperti 7 Okt 16:51–23:12), notifikasi gagal diam-diam (posting tetap jalan). Pertimbangkan retry pada node notif atau Error Alert lewat jalur lain.
- **Status 18:00 belum dikonfirmasi tayang** di @citlahhh (Buffer masih "sending" pada pengecekan 3 menit). Minta owner cek manual.
- **Volume telegram-bot-api hanya 500 MB** dan ukurannya tidak bisa diubah lewat MCP; mitigasinya pembersihan agresif di `start.sh`. Bila upload massal 200 MB bermasalah lagi, naikkan volume di dashboard Railway.
- **RAM n8n ±1 GB** (puncak 1,27 GB saat proses video 100 MB). Concurrency=1 menahan ini; upload massal butuh ±20–60 detik per video.
- **Listing R2 via node S3 `getAll` mengembalikan kosong** (copy/delete berfungsi). Isi folder tidak bisa diverifikasi otomatis; proxy sandbox asisten juga memblokir r2.dev.
- **Token bot Telegram sempat tercatat di log nginx** (sudah diperbaiki). Disarankan `/revoke` token di @BotFather lalu perbarui credential n8n "Telegram account".
- **Risiko kebijakan TikTok** di luar caption: nama akun @cheatpointblank90/@cheatpointblank198 mengandung "cheat" dan isi video tidak dicek sistem.
- **r2.dev** dibatasi rate & bukan untuk produksi; sebaiknya custom domain R2.

---

## 6. Langkah berikutnya

1. Owner reconnect MCP **n8n, Railway, Supabase** (dan Cloudflare opsional).
2. Owner **publish ulang "TikTok Autopost — 1. Ingest"**; kirim 1 video tes dan pastikan notif verifikasi muncul. Cek eksekusi n8n tidak error.
3. Pasang `errorWorkflow = laDi26b1feomGj9o` di setting Ingest & Publish (`update_workflow` → `setWorkflowSettings`), lalu owner publish.
4. Tambah `retryOnFail` (3x, 5 detik) pada node notif Telegram di Publish.
5. Konfirmasi status posting 18:00 di @citlahhh; pantau slot 8 Okt (08:00/12:00/18:00) di eksekusi n8n & tabel `tiktok_posts`.
6. Sinkronkan repo: ekspor workflow live ke `n8n/` dan definisi fungsi `add_to_pool` / `claim_slot_posts` ke migrasi Supabase.
7. Tanya owner soal pengecekan duplikat & retensi `posted/`; implementasi jika disetujui.
8. Opsional: revoke token bot, custom domain R2, ganti nama akun TikTok yang mengandung "cheat".

### Cara cek cepat
```sql
-- isi gudang & riwayat
select status, count(*) from tiktok_posts group by status;
select account_name, title, posted_at at time zone 'Asia/Jakarta'
  from tiktok_posts where status = 'posted' order by posted_at desc;
-- jadwal
select * from posting_slots order by slot_time;
```

### Konvensi kerja
- Push hanya ke `claude/tiktok-auto-posting-fvvkek`; jangan buat PR kecuali diminta.
- Deploy telegram-bot-api: push → Railway `connect-service-source` ke branch ini.
- Jangan minta/menulis token, api_hash, atau kode di chat; owner mengisinya langsung di Railway/n8n.
- Tes lokal: `node tests/expressions.test.js`, `node tests/safety-filter.test.js`.
