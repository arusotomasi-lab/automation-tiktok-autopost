import { workflow, node, trigger, sticky, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const everyTenMin = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Setiap 1 Menit',
    parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 1 }] }, misfirePolicy: 'coalesce' }
  },
  output: [{}]
});

const config = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Config',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'cfg-channel', name: 'bufferChannelId', value: 'REPLACE_WITH_BUFFER_TIKTOK_CHANNEL_ID', type: 'string' },
          { id: 'cfg-owner', name: 'ownerChatId', value: '2008311661', type: 'string' },
          { id: 'cfg-batch', name: 'maxPerRun', value: 3, type: 'number' }
        ]
      }
    }
  },
  output: [{ bufferChannelId: '65f0abc123', ownerChatId: '123456789', maxPerRun: 3 }]
});

const getDue = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  config: {
    name: 'Ambil Post Jatuh Tempo',
    parameters: {
      resource: 'row',
      operation: 'getAll',
      tableId: 'tiktok_posts',
      returnAll: false,
      limit: expr('{{ $json.maxPerRun }}'),
      orderBy: 'scheduled_at.asc',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          { keyName: 'status', condition: 'eq', keyValue: 'ready' },
          { keyName: 'scheduled_at', condition: 'lte', keyValue: expr('{{ $now.toUTC().toISO() }}') }
        ]
      }
    },
    credentials: { supabaseApi: newCredential('Supabase TikTok') }
  },
  output: [{ id: 'ef7b30b4-7131-4824-b347-aae08cba6807', telegram_chat_id: 123456789, r2_key: 'videos/2026/10/06/AgADxyz.mp4', video_url: 'https://pub-xxx.r2.dev/videos/2026/10/06/AgADxyz.mp4', caption: 'Masak 5 menit jadi! 🍳', hashtags: ['#fyp', '#resepmudah'], status: 'ready', attempts: 0, scheduled_at: '2026-10-06T10:00:00+00:00' }]
});

const lockRow = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  config: {
    name: 'Kunci Antrean',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'tiktok_posts',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: {
        conditions: [
          { keyName: 'id', condition: 'eq', keyValue: expr('{{ $json.id }}') },
          { keyName: 'status', condition: 'eq', keyValue: 'ready' }
        ]
      },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'status', fieldValue: 'scheduled' },
          { fieldId: 'attempts', fieldValue: expr('{{ ($json.attempts ?? 0) + 1 }}') }
        ]
      }
    },
    credentials: { supabaseApi: newCredential('Supabase TikTok') }
  },
  output: [{ id: 'ef7b30b4-7131-4824-b347-aae08cba6807', telegram_chat_id: 123456789, video_url: 'https://pub-xxx.r2.dev/videos/2026/10/06/AgADxyz.mp4', caption: 'Masak 5 menit jadi! 🍳', hashtags: ['#fyp', '#resepmudah'], status: 'scheduled', attempts: 1 }]
});

const postBuffer = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Kirim ke Buffer (TikTok)',
    onError: 'continueErrorOutput',
    parameters: {
      method: 'POST',
      url: 'https://api.buffer.com',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ { query: 'mutation { createPost(input: { text: ' + JSON.stringify(($json.caption ?? '') + '\\n\\n' + ($json.hashtags ?? []).join(' ')) + ', channelId: ' + JSON.stringify($('Config').first().json.bufferChannelId) + ', schedulingType: automatic, mode: shareNow, assets: { videos: [{ url: ' + JSON.stringify($json.video_url) + ' }] } }) { __typename ... on PostActionSuccess { post { id status dueAt } } ... on MutationError { message } } }' } }}"),
      options: { timeout: 60000 }
    },
    credentials: { httpHeaderAuth: newCredential('Buffer API') }
  },
  output: [{ data: { createPost: { __typename: 'PostActionSuccess', post: { id: '6703buf123', status: 'sending', dueAt: '2026-10-06T10:00:00Z' } } } }]
});

const isSuccess = ifElse({
  version: 2.2,
  config: {
    name: 'Buffer Berhasil?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [
          { leftValue: expr('{{ $json.data?.createPost?.post?.id ?? "" }}'), operator: { type: 'string', operation: 'notEmpty', singleValue: true }, rightValue: '' }
        ],
        combinator: 'and'
      }
    }
  },
  output: [{ data: { createPost: { post: { id: '6703buf123' } } } }]
});

const markPosted = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  config: {
    name: 'Tandai Posted',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'tiktok_posts',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr("{{ $('Kunci Antrean').item.json.id }}") }] },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'status', fieldValue: 'posted' },
          { fieldId: 'buffer_post_id', fieldValue: expr('{{ $json.data.createPost.post.id }}') },
          { fieldId: 'posted_at', fieldValue: expr('{{ $now.toUTC().toISO() }}') },
          { fieldId: 'last_error', fieldValue: '' }
        ]
      }
    },
    credentials: { supabaseApi: newCredential('Supabase TikTok') }
  },
  output: [{ id: 'ef7b30b4-7131-4824-b347-aae08cba6807', status: 'posted', buffer_post_id: '6703buf123', caption: 'Masak 5 menit jadi! 🍳' }]
});

const notifyPosted = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Notif Berhasil',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr("{{ $('Kunci Antrean').item.json.telegram_chat_id || $('Config').first().json.ownerChatId }}"),
      text: expr("🚀 Terkirim ke TikTok via Buffer\n\n📝 {{ $('Kunci Antrean').item.json.caption }}\n🆔 Buffer: {{ $json.buffer_post_id }}"),
      additionalFields: { appendAttribution: false }
    },
    credentials: { telegramApi: newCredential('Telegram Bot') }
  },
  output: [{ ok: true }]
});

const markFailed = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  config: {
    name: 'Tandai Gagal',
    parameters: {
      resource: 'row',
      operation: 'update',
      tableId: 'tiktok_posts',
      filterType: 'manual',
      matchType: 'allFilters',
      filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr("{{ $('Kunci Antrean').item.json.id }}") }] },
      dataToSend: 'defineBelow',
      fieldsUi: {
        fieldValues: [
          { fieldId: 'status', fieldValue: 'failed' },
          { fieldId: 'last_error', fieldValue: expr('{{ ($json.error?.message ?? $json.data?.createPost?.message ?? JSON.stringify($json.errors ?? $json.data ?? $json)).slice(0, 1000) }}') }
        ]
      }
    },
    credentials: { supabaseApi: newCredential('Supabase TikTok') }
  },
  output: [{ id: 'ef7b30b4-7131-4824-b347-aae08cba6807', status: 'failed', last_error: 'Invalid channel', attempts: 1 }]
});

const notifyFailed = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Notif Gagal',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr("{{ $('Kunci Antrean').item.json.telegram_chat_id || $('Config').first().json.ownerChatId }}"),
      text: expr("❌ Gagal posting ke Buffer\n\n🆔 {{ $json.id }}\n⚠️ {{ $json.last_error }}\n\nPerbaiki lalu ubah status ke 'ready' di Supabase untuk mencoba lagi."),
      additionalFields: { appendAttribution: false }
    },
    credentials: { telegramApi: newCredential('Telegram Bot') }
  },
  output: [{ ok: true }]
});

const guide = sticky('## Publish TikTok\nTiap 1 menit ambil maks 3 baris `ready` yang sudah jatuh tempo, kunci (status `scheduled`), kirim ke Buffer GraphQL `createPost` (mode shareNow, video dari URL publik R2).\n\nIsi **Config**: channel ID TikTok di Buffer & chat ID Telegram.', [config, getDue], { color: 4 });

export default workflow('tiktok-publish', 'TikTok Autopost — 2. Publish (Supabase → Buffer → Telegram)')
  .add(everyTenMin)
  .to(config)
  .to(getDue)
  .to(lockRow)
  .to(postBuffer.onError(markFailed))
  .add(postBuffer)
  .to(isSuccess
    .onTrue(markPosted.to(notifyPosted))
    .onFalse(markFailed.to(notifyFailed)))
  .add(guide)
  .group('Hasil Sukses', [markPosted, notifyPosted], { description: 'Simpan buffer_post_id + posted_at lalu kabari owner di Telegram' })
  .group('Hasil Gagal', [markFailed, notifyFailed], { description: 'Simpan pesan error di last_error (status failed) lalu kabari owner di Telegram' });
