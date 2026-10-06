# automation-tiktok-autopost

Otomasi posting video TikTok: **Telegram → Cloudflare R2 + Gemini → Supabase → n8n → Buffer → TikTok**.

## Arsitektur

```
[Kirim video ke bot Telegram]
        │  (opsional caption: "catatan @2026-10-07 19:00" → jadwal WIB)
        ▼
n8n 1. Ingest ──► Download file Telegram ──┬─► Upload ke R2 (videos/yyyy/MM/dd/<id>.mp4)
                                           └─► Gemini (teks, berdasarkan niche di Config) → judul + caption + hashtag JSON
                  ──► Supabase tiktok_posts (status=ready, scheduled_at)
                  ──► Kirim laporan ke Telegram (judul, caption, hashtag, link video)

n8n 2. Publish (tiap 1 menit)
        ──► ambil maks 3 baris ready & jatuh tempo ──► kunci (status=scheduled, attempts+1)
        ──► Buffer GraphQL createPost (TikTok, shareNow, video URL publik R2)
              ├─ sukses → status=posted, buffer_post_id, posted_at → notif Telegram
              └─ gagal  → status=failed, last_error            → notif Telegram
```

| Komponen | Resource |
|---|---|
| GitHub | repo ini (`n8n/`, `supabase/migrations/`, `tests/`) |
| Cloudflare R2 | bucket `tiktok-auto-post` (APAC) |
| Supabase | project `oykokptpfthfftlysels` — tabel `tiktok_posts`, `automation_logs` |
| n8n | `TikTok Autopost — 1. Ingest` (`qbvS8aQsVwvHzURm`), `TikTok Autopost — 2. Publish` (`JYX8Kd4ZX2JuLSkH`) |
| Gemini | HTTP `generateContent`: utama `gemini-3.5-flash-lite`, cadangan `gemini-3.1-flash-lite` (teks saja, berdasarkan `niche`) |
| Buffer | `https://api.buffer.com` (GraphQL) |

## Mode saat ini: laporan saja

Auto-post ke TikTok **dinonaktifkan** (workflow Publish tidak aktif). Setiap video yang dikirim ke bot diupload ke R2, Gemini membuat judul + caption + hashtag, data disimpan di Supabase (`status = ready`), lalu bot mengirim laporan ke Telegram. Untuk mengaktifkan posting nanti: perbaiki credential Buffer, isi `bufferChannelId`, lalu publish workflow 2.

## Status (`tiktok_posts.status`)

`ready` → `scheduled` (dikunci saat dikirim) → `posted` / `failed`.
Untuk retry: perbaiki penyebabnya, lalu set `status = 'ready'`.

## Setup yang masih harus dilakukan manual

1. **Credential n8n** (semua workflow sudah mereferensikan nama ini):
   - `Telegram Bot` — token dari @BotFather.
   - `Cloudflare R2` (tipe S3) — endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`, Access Key/Secret dari R2 API Token, aktifkan *Force path style*.
   - `Google Gemini API` — API key dari Google AI Studio.
   - `Supabase TikTok` — host `https://oykokptpfthfftlysels.supabase.co` + **service_role key** (RLS menolak anon).
   - `Buffer API` (Header Auth) — Name `Authorization`, Value `Bearer <API key Buffer>`.
2. **R2 akses publik**: aktifkan r2.dev subdomain atau custom domain di bucket `tiktok-auto-post` (Buffer mengambil video dari URL publik).
3. **Node `Config`** di kedua workflow: isi `r2PublicBaseUrl`, `allowedChatIds` / `ownerChatId`, `bufferChannelId` (ID channel TikTok di Buffer; dapatkan lewat query GraphQL `channels`).
4. Publish (aktifkan) kedua workflow di n8n.

## Catatan / batasan

- Telegram Bot API hanya bisa mengunduh file ≤ 20 MB.
- Body `createPost` sudah diverifikasi lewat introspeksi GraphQL Buffer (6 Okt 2026): `assets: [{ video: { url } }]`, `needsApproval` wajib, judul TikTok di `metadata.tiktok.title`. Dry-run dengan channel palsu mengembalikan `NotFoundError` (format valid).
- Channel TikTok di Buffer: `cheatpointblank90` (`6ac52d8e6a5c39ccb632b50f`), `cheatpointblank198` (`6ac52d5e6a5c39ccb632b2e7`), `citlahhh` (`6ac52d2e6a5c39ccb632b08b`).
- Jika Gemini gagal / output bukan JSON, caption fallback ke caption Telegram (atau `Video baru 🎬`) + `#fyp`.

## Test

```bash
node tests/expressions.test.js
```
Menguji logika ekspresi n8n: escape body GraphQL Buffer, parser JSON Gemini + fallback, literal array Postgres, regex jadwal.

## Catatan model Gemini (uji 7 Okt 2026, API key ini)

- `gemini-2.5-flash` / `2.5-flash-lite`: 404, tidak tersedia untuk pengguna baru.
- `gemini-3.5`–`3.8-flash`, `gemini-flash-latest`: 503 (high demand) saat diuji.
- `gemini-pro-latest`: 429 (kuota API habis; langganan Gemini Pro di aplikasi tidak berlaku untuk API).
- `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-flash-lite-latest`: OK.
