# Hasil uji caption saat publish (9 Okt 2026, ±01:15–01:32 WIB)

Diuji di workflow n8n terpisah **"TEST Caption Generator"** (`umVt1YsVYsAEISAJ`), tidak dipublish. Pengujian ini **tidak** memanggil Buffer, **tidak** menulis ke Supabase (hanya GET caption terakhir), dan **tidak** mengirim Telegram. Data baris `tiktok_posts` adalah data tiruan.

Code node di n8n memakai kode yang sama dengan `n8n/code/*.js`. Ini dibuktikan oleh `lib_hash` yang sama dengan `node tests/caption-publish.test.js`:
- v2 = `7b22ab4a` (12 run berantai di bawah);
- v3 = `3d0327` (versi final: qwen utama dan emoji dihitung per grapheme).

## Rantai 12 run (v2, berantai: hasil tiap run masuk ke daftar "caption terakhir" run berikutnya)

Model sengaja diselang-seling (lewat simulasi gagal) untuk membandingkan kualitas.

| # | Akun | Judul | Caption | Hashtag | Sumber / model | Waktu caption |
|---|---|---|---|---|---|---|
| 1 | @cheatpointblank90 | Recoil spray bikin mumet? | Udah nembak terus recoil malah ngacir? Coba atur sensitivitas, pola gerakan, dan timing tembakan biar spray tetap terkendali, jadi tiap lawan gampang dibidik kembali. 🎯🔥 | #fyp #pointblank #gamingtiktok #gamerindonesia #settingpb #pbzepetto | Groq gpt-oss-120b | 0,68 s |
| 2 | @citlahhh | Pernah Ngerasain Lag di PB? | Kalo lag bikin frustasi, coba cek setting mouse, sensitivitas, dan pola gerakan biar tiap tembakan makin mantap. 🎮💥 | #fyp #pointblank #gamingtiktok #gamerindonesia #settingpb #pbzepetto | Groq gpt-oss-120b | 0,38 s |
| 3 | @cheatpointblank198 | Aku Suka Punya Map Rotasi yang Bikin Poin | Aku kadang kebingungan lihat rotasi lawan di map, makanya belajar baca tiap sudut bikin langkah makin tepat. Atur sensi, posisikan angle, dan rasain perbedaannya! 🎮🔥 | #fyp #gamingtiktok #pointblank #pbindonesia #settingpb | Groq gpt-oss-120b | 1,00 s |
| 4 | @cheatpointblank90 | Senjata pilihanmu udah kepas? | Wah, senjata andalanmu udah sesuai sama gaya main kamu? Gak asal ambil saja, sesuaikan statistik biar performa makin mantap dan jago! 🎯🔥 | #fyp #pointblank #pbindonesia #gamingindonesia #fpsgame | Groq qwen3.8-27b (utama disimulasikan gagal) | 0,53 s |
| 5 | @citlahhh | Bom di PB: Dulu Gak Stabil, Sekarang Lebih Terkendali | Dulu pas pasang bom suka meleset, sekarang udah mantap berkat setting dan gerakan yang pas. Yuk, jernihkan strategi biar bommu selalu tepat sasaran! 🎯💥 | #fyp #pointblank #gamingtiktok #gamerindonesia #settingpb #pbzepetto | Groq gpt-oss-120b | 0,65 s |
| 6 | @cheatpointblank198 | Kesalahan kecil bikin rank turun? | Ronde-ronde kalah itu bahan evaluasi! Evaluasi kesalahanmu, perbaiki setting, dan rapikan strategi biar performa makin stabil dan jago. 🎮🔥 | #fyp #pointblank #pbindonesia #gamingindonesia #settingpb | Groq qwen3.8-27b | 0,85 s |
| 7 | @cheatpointblank90 | Kalah Refleks Pas Duel Itu Nyebelin | Sering emosi kalau telat respon saat duel satu lawan satu? Padahal sensitivitas dan strategi yang pas bikin gerakanmu jauh lebih luwes buat menangin duel. 🎮🔥 | #fyp #pointblank #pbindonesia #gamerindonesia #gamingindonesia | Gemini 3.1-flash-lite (kedua Groq disimulasikan gagal) | 1,93 s |
| 8 | @citlahhh | Ping Stabil, Main Lancar di PB | Bro, jangan biarin ping ngacir pas mabar. Cek koneksi, sesuaikan setting, terus rasain gerakan yang mulus biar tiap tembakan tepat sasaran. 🎮✨ | #fyp #pointblank #gamingtiktok #gamerindonesia #settingpb | Groq gpt-oss-120b | 1,90 s |
| 9 | @cheatpointblank198 | Tanganku Pegal Parah | Aku sering tanganku pegel gara-gara pegangan mouse gak pas. Coba atur kontrol biar lebih ergonomis, nyaman, dan presisi supaya main PB jadi lebih lancar. 🎮💪 | #fyp #pointblank #pbindonesia #gamerindonesia #fpsgame | Groq qwen3.8-27b | 0,66 s |
| 10 | @cheatpointblank90 | Selalu kena ciduk pas lagi rotasi? | Pernah gak sih ngerasa posisi kamu gampang kebaca lawan? Coba perhatikan lagi penempatan posisi dan cover biar gameplay makin optimal dan makin jago. 🎮🔥 | #fyp #pointblank #pbindonesia #gamingindonesia #fpsgame | Gemini 3.1-flash-lite | 9,78 s |
| 11 | @citlahhh | Ayo Buktikan Komunikasi Tim Lebih Kencang! | Mau tim lo jadi makin solid? Mulai dari callout yang jelas sampai koordinasi gerakan, semua bisa dioptimalkan biar tiap ronde terasa lebih terkontrol. 🎮🔥 | #fyp #gamingtiktok #gamerindonesia #pointblank #settingpb | Groq gpt-oss-120b | 1,25 s |
| 12 | @cheatpointblank198 | Mabar PB Jadi Merusak Mental? | Jangan biarin emosi nguasain mabar lo. Fokus ke kontrol diri, sesuaikan setting, dan rapikan strategi biar main PB makin tenang dan jago. 🧘‍♂️ | #fyp #pointblank #pbindonesia #gamingindonesia #settingpb #fpsgame | Groq qwen3.8-27b | 1,25 s |

Hasil pemeriksaan:
- 12 judul dan 12 caption semuanya berbeda.
- Tidak ada pembuka 3 kata yang sama.
- Semua hasil lolos regex larangan aturan D.
- Semua judul ≤ 60 karakter dan semua caption ≤ 180 karakter.
- Hashtag 5–6 per caption, `#fyp` selalu pertama, huruf kecil, tanpa duplikat.
- Total waktu eksekusi (termasuk GET Supabase) 1,1–10,7 detik.

Smoke test v3 (qwen utama): "Duel 1v1 Sering Kalah?" lolos dalam 0,5 detik, `lib_hash` `3d0327`.

## Uji fallback

| Uji | Simulasi | Hasil |
|---|---|---|
| (a) | Groq utama 404 | Groq cadangan dipakai (`groq_cadangan`) |
| (b) | Groq utama dan cadangan 404 | Gemini 3.1-flash-lite dipakai (`gemini`). Sebelumnya Gemini 3.5-flash-lite sempat 503, lalu rantai lanjut sendiri. |
| (c) | Groq dan Gemini 404, caption Ingest valid | Caption Ingest dipakai (`ingest`). Emoji `🧘‍♂️🎮🔥` dirapikan menjadi `🧘‍♂️🎮`. |
| (d) | Semua gagal, caption Ingest berisi "order/DM/link di bio" | Ingest ditolak (`melanggar: order, dm, link`), cadangan manual dipakai (`manual`) |
| retry | `retry=true` dan `publish_caption` sudah ada | Caption tersimpan dipakai ulang (`reuse`), tanpa memanggil model, 0,19 s |

Semua jalur menghasilkan caption. Tidak ada eksekusi yang error.

## Perbandingan model (subjektif, dari sampel di atas)

- **qwen/qwen3.8-27b**: bahasa gaul paling natural ("lo", "mabar") dan paling patuh pada sudut pandang yang diminta. Sesekali ada salah ketik ("kepas") atau kalimat kaku. Cepat (0,5–1,3 s). **Dipakai sebagai model utama.**
- **openai/gpt-oss-120b**: kosakata lebih kaya, tapi beberapa kali janggal ("Aku Suka Punya Map Rotasi yang Bikin Poin", "pasang bom suka meleset") dan kadang mengabaikan sudut pandang. Latensi bervariasi (0,4–1,9 s) karena token reasoning. **Dipakai sebagai cadangan.**
- **gemini-3.1-flash-lite**: paling rapi dan natural, tapi latensi 1,9–9,8 s, dan versi 3.5 sempat 503. Cocok sebagai lapis ketiga.

## Batas pemakaian Groq (dari header respons)

Per model: 1000 request/hari dan 8000 token/menit. Satu caption memakan ±1,0–1,9 ribu token. Kebutuhan 3 posting/hari (ditambah Ingest) jauh di bawah batas ini.

## Uji rollback: kedua node Groq di-*disable*

Node yang di-disable meneruskan input apa adanya. Akibatnya "Cek Groq Utama/Cadangan" menolak hasilnya ("respons tidak dikenal") dan alur pindah ke Gemini tanpa jeda.

Pada uji ini Gemini 3.1-flash-lite **timeout di 12 detik**. Caption tetap terbentuk dari cadangan manual dalam ±12 detik. Karena itu timeout Gemini dinaikkan ke **15 detik**.

Total waktu terburuk sekarang ±5 + 12 + 12 + 15 ≈ 44 detik. Rollback "pakai Gemini saja" tetap aman, tapi Gemini sendiri kadang lambat atau 503, jadi cadangan Ingest dan manual tetap diperlukan.
