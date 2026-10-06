import { workflow, node, trigger, sticky, newCredential, merge, expr } from '@n8n/workflow-sdk';

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
          { id: 'cfg-delay', name: 'defaultDelayMinutes', value: 30, type: 'number' }
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
          { id: 'm-when', name: 'scheduledAt', value: expr("{{ (() => { const m = ($('Telegram Video Masuk').item.json.message.caption ?? '').match(/@(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2})/); return m ? DateTime.fromFormat(m[1], 'yyyy-MM-dd HH:mm', { zone: 'Asia/Jakarta' }).toISO() : $now.plus($('Config').item.json.defaultDelayMinutes, 'minutes').toISO(); })() }}"), type: 'string' }
        ]
      }
    }
  },
  output: [{ fileId: 'BAACAgUAAx', fileUniqueId: 'AgADxyz', chatId: '123456789', userCaption: 'tips masak cepat', r2Key: 'videos/2026/10/06/AgADxyz.mp4', scheduledAt: '2026-10-06T17:00:00.000+07:00', r2Bucket: 'tiktok-auto-post', r2PublicBaseUrl: 'https://pub-xxx.r2.dev' }]
});

const downloadVideo = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Download Video Telegram',
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

const geminiCaption = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: {
    name: 'Gemini Buat Caption',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'video',
      operation: 'analyze',
      modelId: { __rl: true, mode: 'id', value: 'models/gemini-flash-latest' },
      inputType: 'binary',
      binaryPropertyName: 'data',
      text: expr("Kamu adalah copywriter TikTok Indonesia. Tonton video ini lalu buat caption TikTok yang menarik (maks 150 karakter, boleh 1-2 emoji, ada hook di awal) dan 3-6 hashtag relevan termasuk #fyp. Catatan dari pemilik: \"{{ $('Siapkan Metadata').item.json.userCaption }}\". Balas HANYA JSON valid tanpa markdown dengan format: {\"caption\": \"...\", \"hashtags\": [\"#fyp\", \"...\"]}"),
      simplify: true,
      options: { maxOutputTokens: 600 }
    },
    credentials: { googlePalmApi: newCredential('Google Gemini API') }
  },
  output: [{ content: { parts: [{ text: '{"caption":"Masak 5 menit jadi! 🍳","hashtags":["#fyp","#resepmudah"]}' }], role: 'model' } }]
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
          { id: 'p-raw', name: 'geminiText', value: expr("{{ $('Gemini Buat Caption').item.json.content?.parts?.[0]?.text ?? $('Gemini Buat Caption').item.json.text ?? '' }}"), type: 'string' },
          { id: 'p-obj', name: 'ai', value: expr("{{ (() => { try { const t = ($('Gemini Buat Caption').item.json.content?.parts?.[0]?.text ?? $('Gemini Buat Caption').item.json.text ?? '').replace(/```json|```/g, '').trim(); const o = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); return { caption: String(o.caption ?? ''), hashtags: Array.isArray(o.hashtags) ? o.hashtags.map(h => (String(h).startsWith('#') ? String(h) : '#' + h).replace(/\\s+/g, '')) : [] }; } catch (e) { return { caption: $('Siapkan Metadata').item.json.userCaption || 'Video baru 🎬', hashtags: ['#fyp'] }; } })() }}"), type: 'object' },
          { id: 'p-ok', name: 'geminiOk', value: expr("{{ !$('Gemini Buat Caption').item.json.error }}"), type: 'boolean' }
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
    name: 'Balas Konfirmasi',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr("{{ $('Siapkan Metadata').item.json.chatId }}"),
      text: expr("✅ Video diterima & disimpan.\n\n📝 Caption: {{ $json.caption }}\n🏷️ {{ ($json.hashtags || []).join(' ') }}\n⏰ Jadwal: {{ DateTime.fromISO($json.scheduled_at).setZone('Asia/Jakarta').toFormat('dd LLL yyyy HH:mm') }} WIB\n🆔 {{ $json.id }}"),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Telegram Bot') }
  },
  output: [{ ok: true }]
});

const guide = sticky('## Ingest TikTok\nKirim video (≤20MB, batas Bot API) ke bot Telegram. Opsional: tulis caption `@2026-10-07 19:00` untuk jadwal (WIB). Default: +30 menit.\n\nIsi node **Config**: domain publik R2 & chat ID Telegram Anda.', [config, buildMeta], { color: 4 });

export default workflow('tiktok-ingest', 'TikTok Autopost — 1. Ingest (Telegram → R2 + Gemini → Supabase)')
  .add(telegramIn)
  .to(config)
  .to(onlyOwnerVideo)
  .to(buildMeta)
  .to(downloadVideo)
  .add(downloadVideo)
  .to(uploadR2.to(joinResults.input(0)))
  .add(downloadVideo)
  .to(geminiCaption.to(joinResults.input(1)))
  .add(joinResults)
  .to(prepareRow)
  .to(saveRow)
  .to(replyOk)
  .add(guide)
  .group('Penyimpanan & AI', [downloadVideo, uploadR2, geminiCaption, joinResults], { description: 'Download video dari Telegram, upload ke R2, dan Gemini membuat caption + hashtag secara paralel' })
  .group('Simpan & Konfirmasi', [prepareRow, saveRow, replyOk], { description: 'Parse JSON Gemini (fallback ke caption user), insert ke tiktok_posts status ready, balas ke Telegram' });
