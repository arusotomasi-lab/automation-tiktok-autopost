# Audit sistem untuk video promo

Sumber: `CLAUDE.md`, `HANDOFF.md`, `README.md`, `n8n/code/`, `supabase/backups/`, dan cek MCP **read-only** (9 Okt 2026, 02:3x WIB).
Tidak ada perubahan apa pun pada n8n, Supabase, Cloudflare, Buffer, TikTok, atau Railway.

## Alur nyata (yang divisualkan)

1. Owner kirim video ke bot Telegram → n8n **Ingest** upload ke Cloudflare R2 `videos/yyyy/MM/dd/<file_unique_id>.mp4`, verifikasi ukuran file (HEAD), simpan ke Supabase `tiktok_posts` status `pending` (= gudang / antrean).
2. n8n **Publish** (cek tiap menit): `claim_slot_posts()` mengambil **1 video pending acak** untuk slot yang jatuh tempo dan **mengunci** barisnya (status `scheduled`).
3. Caption dibuat saat posting: Groq (qwen) → Groq cadangan → Gemini → caption Ingest → cadangan manual. Judul, caption, hashtag (#fyp selalu ada), unik per posting dan dicek terhadap caption terakhir.
4. Buffer `createPost` → TikTok. Status `posted` / `failed` (retry maks 3x, akun & video sama).
5. Notif Telegram ✅/⏳/❌ + link TikTok. File disalin ke `posted/` lalu dihapus dari `videos/` (arsip, bukan hilang).
6. Gudang kosong → notif Telegram. Workflow crash → Error Alert.

## Fakta yang dipakai di video

| Item | Nilai nyata | Di video |
|---|---|---|
| Akun | 3 akun TikTok | ACCOUNT 01/02/03 (tanpa nama asli) |
| Jadwal | 06:00, 07:00, 08:00 WIB | 06:00 / 07:00 / 08:00 WIB |
| Stok gudang | 39 video pending | 39 VIDEOS READY |
| Anti duplikat | `file_unique_id`, kunci baris + status, aturan 1 video = 1 akun = 1 kali posting | VIDEO ID ✓, POSTING HISTORY ✓, STATUS ✓, LOCK ✓ |
| Arsip | `videos/` → `posted/` | QUEUE → POSTED ARCHIVE |
| Caption | AI, Bahasa Indonesia, hashtag #fyp | contoh caption dari uji nyata (patuh aturan konten) |

## Perbedaan dengan brief

- Brief menulis jadwal 08:00/12:00/18:00; sistem live 06:00/07:00/08:00. Brief menyatakan repo adalah sumber kebenaran, jadi video memakai jadwal live. Lirik "pagi, siang, sore" diganti "jam enam, tujuh, delapan".
- Brief menyebut "90 VIDEOS" dan FILE HASH; sistem nyata 39 video dan tanpa hash file, jadi dipakai angka 39 dan cek VIDEO ID / STATUS / LOCK.
- **Peringatan stok menipis (ambang 9)** belum ada di production; yang ada notifikasi *gudang kosong*. Adegan 10 diwajibkan brief, jadi tetap ditampilkan sebagai konsep pemantauan stok. Ini catatan untuk owner, bukan perubahan sistem.
- Contoh caption brief diganti contoh yang patuh aturan konten (tanpa kata terlarang, #fyp di depan).

## Keputusan owner (10 Okt 2026)

Untuk video promo, **brief kreatif adalah source of truth**, bukan nilai live production. Angka di video adalah ilustrasi marketing, bukan snapshot sistem:
- Jadwal: ACCOUNT 01 → 08:00, ACCOUNT 02 → 12:00, ACCOUNT 03 → 18:00 WIB (lirik: "Pagi, siang, sore, semua terjadwal").
- Gudang: 90 VIDEOS READY; adegan stok: 90 → 9 VIDEOS LEFT, alur VIDEO STOCK → THRESHOLD DETECTED → AUTOMATION → TELEGRAM ALERT.
- Cek duplikat: VIDEO ID, FILE HASH, POSTING HISTORY, LOCK.
Tabel dan catatan perbedaan di atas tetap sebagai catatan audit; tidak ada perubahan production.
