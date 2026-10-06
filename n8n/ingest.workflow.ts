import { workflow, node, trigger, sticky, newCredential, merge, ifElse, expr } from '@n8n/workflow-sdk';

const telegramIn = trigger({
  type: 'n8n-nodes-base.telegramTrigger',
  version: 1.5,
  config: {
    name: 'Telegram Video Masuk',
    parameters: { updates: ['message'], additionalFields: { download: false } },
    credentials: { telegramApi: newCredential('Telegram Bot') }
  },
  output: [{ message: { message_id: 1, chat: { id: 123456789 }, from: { id: 123456789 }, caption: 'tips masak cepat', video: { file_id: 'BAACAgUAAx', file_unique_id: 'AgADxyz', mime_type: 'video/mp4', file_size: 5000000 } } }]
});

const config = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Config',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'cfg-bucket', name: 'r2Bucket', value: 'tiktok-auto-post', type: 'string' },
          { id: 'cfg-public', name: 'r2PublicBaseUrl', value: 'https://pub-8bc2479eda66445b8647fffa32f2cdfc.r2.dev', type: 'string' },
          { id: 'cfg-owner', name: 'allowedChatIds', value: '2008311661', type: 'string' },
          { id: 'cfg-delay', name: 'defaultDelayMinutes', value: 0, type: 'number' },
          { id: 'cfg-niche', name: 'niche', value: 'Gaming – Point Blank (tips, trik & gameplay)', type: 'string' }
        ]
      }
    }
  },
  output: [{ r2Bucket: 'tiktok-auto-post', r2PublicBaseUrl: 'https://pub-xxx.r2.dev', allowedChatIds: '123456789', defaultDelayMinutes: 30 }]
});

const onlyOwnerVideo = node({
  type: 'n8n-nodes-base.filter',
  version: 2.2,
  config: {
    name: 'Hanya Video dari Owner',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [
          { leftValue: expr("{{ $('Telegram Video Masuk').item.json.message.video?.file_id ?? ($('Telegram Video Masuk').item.json.message.document?.mime_type?.startsWith('video/') ? $('Telegram Video Masuk').item.json.message.document.file_id : '') }}"), operator: { type: 'string', operation: 'notEmpty', singleValue: true }, rightValue: '' },
          { leftValue: expr("{{ $json.allowedChatIds.split(',').map(s => s.trim()).includes(String($('Telegram Video Masuk').item.json.message.chat.id)) }}"), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }
        ],
        combinator: 'and'
      }
    }
  },
  output: [{ r2Bucket: 'tiktok-auto-post' }]
});

const buildMeta = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Siapkan Metadata',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'm-file', name: 'fileId', value: expr("{{ $('Telegram Video Masuk').item.json.message.video?.file_id ?? $('Telegram Video Masuk').item.json.message.document.file_id }}"), type: 'string' },
          { id: 'm-uniq', name: 'fileUniqueId', value: expr("{{ $('Telegram Video Masuk').item.json.message.video?.file_unique_id ?? $('Telegram Video Masuk').item.json.message.document.file_unique_id }}"), type: 'string' },
          { id: 'm-chat', name: 'chatId', value: expr("{{ $('Telegram Video Masuk').item.json.message.chat.id }}"), type: 'string' },
          { id: 'm-hint', name: 'userCaption', value: expr("{{ $('Telegram Video Masuk').item.json.message.caption ?? '' }}"), type: 'string' },
          { id: 'm-key', name: 'r2Key', value: expr("{{ 'videos/' + $now.toFormat('yyyy/MM/dd') + '/' + ($('Telegram Video Masuk').item.json.message.video?.file_unique_id ?? $('Telegram Video Masuk').item.json.message.document.file_unique_id) + '.mp4' }}"), type: 'string' },
          { id: 'm-size', name: 'fileSize', value: expr("{{ $('Telegram Video Masuk').item.json.message.video?.file_size ?? $('Telegram Video Masuk').item.json.message.document?.file_size ?? 0 }}"), type: 'number' },
          { id: 'm-when', name: 'scheduledAt', value: expr("{{ (() => { const m = ($('Telegram Video Masuk').item.json.message.caption ?? '').match(/@(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2})/); return m ? DateTime.fromFormat(m[1], 'yyyy-MM-dd HH:mm', { zone: 'Asia/Jakarta' }).toISO() : $now.plus($('Config').item.json.defaultDelayMinutes, 'minutes').toISO(); })() }}"), type: 'string' }
        ]
      }
    }
  },
  output: [{ fileId: 'BAACAgUAAx', fileUniqueId: 'AgADxyz', chatId: '123456789', userCaption: 'tips masak cepat', r2Key: 'videos/2026/10/06/AgADxyz.mp4', scheduledAt: '2026-10-06T17:00:00.000+07:00', r2Bucket: 'tiktok-auto-post', r2PublicBaseUrl: 'https://pub-xxx.r2.dev' }]
});

const sizeOk = ifElse({
  version: 2.2,
  config: {
    name: 'Ukuran ≤ 20MB?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.fileSize }}'), operator: { type: 'number', operation: 'lte' }, rightValue: 20000000 }],
        combinator: 'and'
      }
    }
  },
  output: [{ fileSize: 2436174 }]
});

const notifyTooBig = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Notif Video Terlalu Besar',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $json.chatId }}'),
      text: expr("⚠️ <b>Video terlalu besar</b> ({{ ($json.fileSize / 1048576).toFixed(1) }} MB)\n\nBot Telegram hanya bisa mengambil file maksimal 20 MB.\nSolusi: kirim sebagai <b>Video</b> biasa (bukan File/Dokumen) supaya Telegram mengompresnya otomatis, atau kompres dulu videonya."),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Telegram Bot') }
  },
  output: [{ ok: true }]
});

const notifyDownloadFail = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Notif Gagal Download',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr("{{ $('Siapkan Metadata').item.json.chatId }}"),
      text: expr("❌ <b>Gagal mengambil video dari Telegram</b>\n\nError: {{ ($json.error?.message ?? $json.error ?? 'unknown').toString().replace(/</g,'&lt;').slice(0, 300) }}\n\nCoba kirim ulang videonya."),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Telegram Bot') }
  },
  output: [{ ok: true }]
});

const downloadVideo = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Download Video Telegram',
    onError: 'continueErrorOutput',
    parameters: { resource: 'file', operation: 'get', fileId: expr('{{ $json.fileId }}'), download: true, additionalFields: { mimeType: 'video/mp4' } },
    credentials: { telegramApi: newCredential('Telegram Bot') }
  },
  output: [{ ok: true, result: { file_id: 'BAACAgUAAx', file_path: 'videos/file_1.mp4', file_size: 5000000 } }]
});

const uploadR2 = node({
  type: 'n8n-nodes-base.s3',
  version: 1,
  config: {
    name: 'Upload ke R2',
    onError: 'continueErrorOutput',
    parameters: {
      resource: 'file',
      operation: 'upload',
      bucketName: expr("{{ $('Siapkan Metadata').item.json.r2Bucket }}"),
      fileName: expr("{{ $('Siapkan Metadata').item.json.r2Key }}"),
      binaryData: true,
      binaryPropertyName: 'data'
    },
    credentials: { s3: newCredential('Cloudflare R2') }
  },
  output: [{ success: true }]
});

const notifyR2Fail = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Notif Gagal Upload R2',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr("{{ $('Siapkan Metadata').item.json.chatId }}"),
      text: expr("❌ <b>Upload ke Cloudflare R2 gagal</b>\n\nFile: {{ $('Siapkan Metadata').item.json.r2Key }}\nError: {{ ($json.error?.message ?? $json.error ?? 'unknown').toString().replace(/</g,'&lt;').slice(0, 300) }}\n\nData belum disimpan. Periksa credential R2 (S3 account) lalu kirim ulang video."),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Telegram Bot') }
  },
  output: [{ ok: true }]
});

const geminiCaption = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Gemini Buat Caption',
    onError: 'continueErrorOutput',
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    parameters: {
      method: 'POST',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ { contents: [{ parts: [ { text: 'Kamu adalah social media specialist TikTok Indonesia untuk akun dengan niche: ' + $('Config').item.json.niche + '. Kamu TIDAK bisa melihat videonya, jadi buat teks yang UMUM dan cocok untuk video gameplay apa pun di niche ini' + ($('Siapkan Metadata').item.json.userCaption ? ' (catatan dari pemilik: \"' + $('Siapkan Metadata').item.json.userCaption + '\")' : '') + '. Sudut cerita untuk konten ini: ' + (['ajakan mabar malam ini', 'nostalgia main PB dari dulu sampai sekarang', 'semangat push rank', 'healing santai sepulang kerja/sekolah', 'main bareng squad/teman tongkrongan', 'motivasi biar makin jago pelan-pelan', 'vibe akhir pekan', 'pertanyaan seru ke sesama player', 'rekomendasi buat player baru yang mau mulai'])[Math.floor(Math.random()*9)] + '.\\n\\nOUTPUT:\\n1) title: judul TikTok singkat & menarik, maks 60 karakter.\\n2) caption: maks 150 karakter, hook kuat & orisinal di awal (hindari pembuka klise seperti \"Fokus serunya aja\"), nuansa santai & positif (main jadi makin enak, seru, nagih), akhiri dengan ajakan interaksi ringan di komentar, boleh 1-2 emoji.\\n3) hashtags: 4-6 hashtag huruf kecil tanpa spasi: 1-2 hashtag luas (#fyp, #gamingtiktok, #gamerindonesia) + 3-4 hashtag spesifik niche yang dipakai komunitasnya (mis. #pointblank, #pbindonesia, #pointblankindonesia, #pbzepetto).\\n\\nATURAN WAJIB:\\n- JANGAN menyebut atau mengasumsikan isi video: nama senjata, map, mode, skor, jumlah kill, clutch, momen lucu/gagal, setting tertentu, atau kejadian tertentu.\\n- DILARANG memakai kata/ide: cheat, citer, hack, helper, aimbot, wallhack, auto headshot, inject, script, mod, tools, bug abuse, jual beli akun, giveaway, gratis diamond/cash, link di bio, ajakan beli atau klik link.\\n- DILARANG menyebut AI, Gemini, ChatGPT, bot, atau nama tools apa pun.\\n- Tanpa kata kasar, SARA, provokasi, klaim palsu/clickbait menyesatkan, atau janji hasil instan.\\n- Jangan pakai hashtag spam/tidak relevan dan jangan ulangi hashtag.\\n\\nBalas HANYA JSON valid: {\"title\": \"...\", \"caption\": \"...\", \"hashtags\": [\"#fyp\", \"...\"]}' } ] }], generationConfig: { responseMimeType: 'application/json', temperature: 1, seed: Math.floor(Math.random()*1000000), maxOutputTokens: 2048 } } }}"),
      options: { timeout: 60000 }
    },
    credentials: { googlePalmApi: newCredential('Google Gemini API') }
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{"title":"Tips Headshot","caption":"Gini caranya 🔥","hashtags":["#fyp","#pointblank"]}' }] } }] }]
});

const geminiFallback = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Gemini Cadangan',
    onError: 'continueRegularOutput',
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    parameters: {
      method: 'POST',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googlePalmApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ { contents: [{ parts: [ { text: 'Kamu adalah social media specialist TikTok Indonesia untuk akun dengan niche: ' + $('Config').item.json.niche + '. Kamu TIDAK bisa melihat videonya, jadi buat teks yang UMUM dan cocok untuk video gameplay apa pun di niche ini' + ($('Siapkan Metadata').item.json.userCaption ? ' (catatan dari pemilik: \"' + $('Siapkan Metadata').item.json.userCaption + '\")' : '') + '. Sudut cerita untuk konten ini: ' + (['ajakan mabar malam ini', 'nostalgia main PB dari dulu sampai sekarang', 'semangat push rank', 'healing santai sepulang kerja/sekolah', 'main bareng squad/teman tongkrongan', 'motivasi biar makin jago pelan-pelan', 'vibe akhir pekan', 'pertanyaan seru ke sesama player', 'rekomendasi buat player baru yang mau mulai'])[Math.floor(Math.random()*9)] + '.\\n\\nOUTPUT:\\n1) title: judul TikTok singkat & menarik, maks 60 karakter.\\n2) caption: maks 150 karakter, hook kuat & orisinal di awal (hindari pembuka klise seperti \"Fokus serunya aja\"), nuansa santai & positif (main jadi makin enak, seru, nagih), akhiri dengan ajakan interaksi ringan di komentar, boleh 1-2 emoji.\\n3) hashtags: 4-6 hashtag huruf kecil tanpa spasi: 1-2 hashtag luas (#fyp, #gamingtiktok, #gamerindonesia) + 3-4 hashtag spesifik niche yang dipakai komunitasnya (mis. #pointblank, #pbindonesia, #pointblankindonesia, #pbzepetto).\\n\\nATURAN WAJIB:\\n- JANGAN menyebut atau mengasumsikan isi video: nama senjata, map, mode, skor, jumlah kill, clutch, momen lucu/gagal, setting tertentu, atau kejadian tertentu.\\n- DILARANG memakai kata/ide: cheat, citer, hack, helper, aimbot, wallhack, auto headshot, inject, script, mod, tools, bug abuse, jual beli akun, giveaway, gratis diamond/cash, link di bio, ajakan beli atau klik link.\\n- DILARANG menyebut AI, Gemini, ChatGPT, bot, atau nama tools apa pun.\\n- Tanpa kata kasar, SARA, provokasi, klaim palsu/clickbait menyesatkan, atau janji hasil instan.\\n- Jangan pakai hashtag spam/tidak relevan dan jangan ulangi hashtag.\\n\\nBalas HANYA JSON valid: {\"title\": \"...\", \"caption\": \"...\", \"hashtags\": [\"#fyp\", \"...\"]}' } ] }], generationConfig: { responseMimeType: 'application/json', temperature: 1, seed: Math.floor(Math.random()*1000000), maxOutputTokens: 2048 } } }}"),
      options: { timeout: 60000 }
    },
    credentials: { googlePalmApi: newCredential('Google Gemini API') }
  },
  output: [{ candidates: [{ content: { parts: [{ text: '{"title":"Tips Headshot","caption":"Gini caranya 🔥","hashtags":["#fyp","#pointblank"]}' }] } }] }]
});

const joinResults = merge({
  version: 3.2,
  config: { name: 'Gabung Hasil', parameters: { mode: 'combine', combineBy: 'combineByPosition' } }
});

const prepareRow = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Parse Caption Gemini',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'p-raw', name: 'geminiText', value: expr("{{ $json.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text ?? '').join('') ?? '' }}"), type: 'string' },
          { id: 'p-obj', name: 'ai', value: expr("{{ (() => { const BAD = /(cheat|citer|cheater|hack|helper|aimbot|aim ?bot|wallhack|wall ?hack|inject|mod ?apk|script|bug ?abuse|jual ?akun|giveaway|gratis|free ?(cash|diamond)|link ?di ?bio|gemini|chatgpt|openai|\\bai\\b|\\bbot\\b)/i; const clean = s => String(s ?? '').replace(/auto ?headshot/gi, 'headshot').replace(/(cheat|citer|cheater|hack|helper|aimbot|aim ?bot|wallhack|wall ?hack|inject|script)/gi, 'trik').replace(/\\b(gemini|chatgpt|openai)\\b/gi, '').replace(/\\s{2,}/g, ' ').trim(); const u = $('Siapkan Metadata').item.json.userCaption; try { const t = ($json.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text ?? '').join('') ?? '').replace(/```json|```/g, '').trim(); const o = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); let tags = (Array.isArray(o.hashtags) ? o.hashtags : []).map(h => ('#' + String(h).replace(/^#+/, '')).replace(/\\s+/g, '').toLowerCase()).filter(h => h.length > 1 && !BAD.test(h)); tags = [...new Set(['#fyp', ...tags])].slice(0, 6); return { title: clean(o.title).slice(0, 100), caption: clean(o.caption).slice(0, 2200), hashtags: tags }; } catch (e) { return { title: clean(u || 'Momen seru Point Blank').slice(0, 60), caption: clean(u || 'Momen seru hari ini 🎮'), hashtags: ['#fyp', '#pointblank', '#gamingtiktok'] }; } })() }}"), type: 'object' },
          { id: 'p-ok', name: 'geminiOk', value: expr('{{ !!$json.candidates?.[0]?.content }}'), type: 'boolean' }
        ]
      }
    }
  },
  output: [{ geminiText: '{"caption":"Masak 5 menit jadi! 🍳","hashtags":["#fyp","#resepmudah"]}', ai: { caption: 'Masak 5 menit jadi! 🍳', hashtags: ['#fyp', '#resepmudah'] }, geminiOk: true }]
});

const saveRow = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  config: {
    name: 'Simpan ke Supabase',
    parameters: {
      resource: 'row',
      operation: 'create',
      tableId: 'tiktok_posts',
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'source', fieldValue: 'telegram' },
          { fieldId: 'telegram_chat_id', fieldValue: expr("{{ $('Siapkan Metadata').item.json.chatId }}") },
          { fieldId: 'telegram_file_id', fieldValue: expr("{{ $('Siapkan Metadata').item.json.fileId }}") },
          { fieldId: 'r2_key', fieldValue: expr("{{ $('Siapkan Metadata').item.json.r2Key }}") },
          { fieldId: 'video_url', fieldValue: expr("{{ $('Siapkan Metadata').item.json.r2PublicBaseUrl.replace(/\\/$/, '') + '/' + $('Siapkan Metadata').item.json.r2Key }}") },
          { fieldId: 'title', fieldValue: expr('{{ $json.ai.title }}') },
          { fieldId: 'caption', fieldValue: expr('{{ $json.ai.caption }}') },
          { fieldId: 'hashtags', fieldValue: expr("{{ '{' + $json.ai.hashtags.map(h => '\"' + h.replace(/\"/g, '') + '\"').join(',') + '}' }}") },
          { fieldId: 'gemini_raw', fieldValue: expr('{{ JSON.stringify({ text: $json.geminiText, ok: $json.geminiOk }) }}') },
          { fieldId: 'status', fieldValue: 'ready' },
          { fieldId: 'scheduled_at', fieldValue: expr("{{ $('Siapkan Metadata').item.json.scheduledAt }}") }
        ]
      }
    },
    credentials: { supabaseApi: newCredential('Supabase TikTok') }
  },
  output: [{ id: 'ef7b30b4-7131-4824-b347-aae08cba6807', caption: 'Masak 5 menit jadi! 🍳', hashtags: ['#fyp', '#resepmudah'], scheduled_at: '2026-10-06T10:00:00+00:00', status: 'ready' }]
});

const replyOk = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Kirim Laporan Telegram',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr("{{ $('Siapkan Metadata').item.json.chatId }}"),
      text: expr("📊 <b>LAPORAN VIDEO</b>\n\n✅ Status: Berhasil diupload ke penyimpanan (Cloudflare R2) &amp; siap diposting\n⚠️ Belum diposting ke TikTok (auto-post dinonaktifkan)\n\n🎬 <b>Judul:</b> {{ ($json.title ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;') }}\n📝 <b>Caption:</b> {{ ($json.caption ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;') }}\n🏷️ <b>Hashtag:</b> {{ ($json.hashtags || []).join(' ') }}\n\n🔗 Video: {{ $json.video_url }}\n🆔 ID: {{ $json.id }}\n🕒 {{ DateTime.fromISO($json.created_at).setZone('Asia/Jakarta').toFormat('dd LLL yyyy HH:mm') }} WIB"),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Telegram Bot') }
  },
  output: [{ ok: true }]
});

const guide = sticky('## Ingest TikTok\nKirim video (≤20MB, batas Bot API) ke bot Telegram. Opsional: tulis caption `@2026-10-07 19:00` untuk jadwal (WIB). Default: langsung diposting.\n\nIsi node **Config**: domain publik R2 & chat ID Telegram Anda.', [config, buildMeta], { color: 4 });

export default workflow('tiktok-ingest', 'TikTok Autopost — 1. Ingest (Telegram → R2 + Gemini → Supabase)')
  .add(telegramIn)
  .to(config)
  .to(onlyOwnerVideo)
  .to(buildMeta)
  .to(sizeOk.onTrue(downloadVideo.onError(notifyDownloadFail)).onFalse(notifyTooBig))
  .add(downloadVideo)
  .to(uploadR2.to(joinResults.input(0)))
  .add(uploadR2)
  .onError(notifyR2Fail)
  .add(downloadVideo)
  .to(geminiCaption.to(joinResults.input(1)))
  .add(geminiCaption)
  .onError(geminiFallback.to(joinResults.input(1)))
  .add(joinResults)
  .to(prepareRow)
  .to(saveRow)
  .to(replyOk)
  .add(guide)
  .group('Simpan & Konfirmasi', [prepareRow, saveRow, replyOk], { description: 'Parse JSON Gemini (fallback ke caption user), insert ke tiktok_posts status ready, balas ke Telegram' });
