// Shared caption logic. build.js prepends this file to each caption Code node in n8n,
// and tests/caption-publish.test.js loads it in a vm sandbox. Pure functions only:
// no n8n globals ($, $json) and no exports here.

const ACCOUNTS_HINT = 'akun TikTok gaming Point Blank';

const HASHTAG_POOL = ['#gamingtiktok', '#gamerindonesia', '#gamingindonesia', '#pointblank', '#pbindonesia',
  '#pointblankindonesia', '#pointblankzepetto', '#pbzepetto', '#settingpb', '#fpsgame'];

const ANGLES = [
  'sensitivitas dan crosshair yang pas', 'setting grafis biar FPS stabil', 'kontrol recoil saat spray',
  'rotasi dan cara baca map', 'pilih posisi dan cover yang aman', 'komunikasi dan callout bareng tim',
  'jaga mental saat main ranked', 'pemanasan sebelum masuk ranked', 'pilihan senjata andalan',
  'refleks saat duel satu lawan satu', 'strategi pasang dan jinakkan bom', 'evaluasi kesalahan sendiri tiap ronde',
  'koneksi dan ping yang stabil', 'kebiasaan kecil yang bikin sering kalah', 'konsisten latihan sedikit tiap hari',
  'atur kontrol biar tangan nyaman'
];

const HOOKS = [
  'buka dengan pertanyaan yang relatable', 'buka dengan curhat singkat ala pemain (pakai "aku")',
  'buka dengan fakta singkat yang bikin penasaran', 'buka dengan situasi kesel yang sering dialami pemain',
  'buka dengan kalimat ekspresif yang heboh tapi sopan', 'buka dengan tantangan ringan ke penonton',
  'buka dengan perbandingan dulu vs sekarang tanpa janji hasil instan', 'buka dengan pengingat santai ala teman mabar'
];

const MANUAL_POOL = [
  { title: 'Crosshair Udah Pas Belum?', caption: 'Sering meleset padahal udah fokus? Coba cek lagi crosshair sama sensitivitas kamu, kadang beda dikit aja udah kerasa banget pas duel 🎯' },
  { title: 'FPS Drop Pas Lagi War?', caption: 'Lagi seru-serunya war malah patah-patah. Rapikan setting grafis biar gameplay PB kamu makin stabil dan enak dipakai push 🎮' },
  { title: 'Rotasi Map Itu Penting', caption: 'Bukan cuma soal aim, posisi dan rotasi juga nentuin menang kalah. Biasain baca map biar main makin rapi dan makin jago 🔥' },
  { title: 'Recoil Masih Liar?', caption: 'Spray suka naik ke atas? Latih kontrol recoil pelan-pelan dan atur sensitivitas yang nyaman, nanti tembakan kamu makin konsisten 💪' },
  { title: 'Main Ranked Jangan Panik', caption: 'Kalah beruntun bikin emosi? Tarik napas, main lebih sabar, dan fokus ke strategi. Gameplay yang tenang biasanya lebih optimal 🎮' },
  { title: 'Pemanasan Sebelum Ranked', caption: 'Masuk ranked tanpa pemanasan bikin tangan kaku. Main santai beberapa ronde dulu biar aim dan refleks kamu makin siap 🔥' },
  { title: 'Komunikasi Tim Bikin Beda', caption: 'Satu callout yang jelas bisa nyelamatin satu ronde. Main bareng tim yang kompak bikin strategi PB kamu jalan lebih mulus 🎯' },
  { title: 'Setting Kecil, Efek Besar', caption: 'Kadang yang bikin main kerasa berat itu setting yang belum pas. Atur ulang kontrol dan grafis biar PB kamu makin nyaman dimainin 🎮' },
  { title: 'Posisi Aman Itu Kunci', caption: 'Sering kena tembak duluan? Pilih posisi yang lebih aman dan jangan asal maju. Strategi simpel kayak gini bikin kamu makin susah dikalahin 💪' },
  { title: 'Biar Duel Makin PD', caption: 'Duel satu lawan satu sering grogi? Kenali senjata andalan kamu dan atur sensitivitas yang pas, lama-lama makin percaya diri 🔥' },
  { title: 'Ping Stabil, Main Tenang', caption: 'Main PB paling kesel kalau lag pas momen penting. Rapikan koneksi dan setting dulu biar gameplay kamu makin lancar dan enak 🎮' },
  { title: 'Pelan-pelan Makin Jago', caption: 'Gak ada yang instan, tapi tiap ronde bisa jadi bahan belajar. Evaluasi permainan kamu sendiri biar makin optimal tiap harinya 🎯' }
];

// Rule D: any match rejects a model result (fallback sources are cleaned first, then checked).
const BANNED = [
  /cheat/i, /\bciter\b/i, /hack/i, /aim ?bot/i, /wall ?hack/i, /\binject/i, /\bscript/i, /\bmod\b/i, /mod ?apk/i,
  /bug ?abuse/i, /jual( ?beli)? ?akun/i, /beli ?akun/i, /giveaway/i, /gratis/i, /free ?(cash|diamond)/i,
  /helper/i, /assistant/i, /\basisten\b/i, /aplikasi/i, /\bapps?\b/i, /sistem/i, /software/i, /\btools?\b/i,
  /coach/i, /panduan/i, /tutorial/i, /\btuts\b/i, /\bguide\b/i, /\btips?\b/i,
  /seperti di video/i, /\bdi video\b/i, /\bvideo ini\b/i,
  /auto ?aim/i, /auto ?headshot/i, /tembus tembok/i, /pasti menang/i, /anti ?-?ban/i, /pasti naik rank/i, /langsung pro/i,
  /\bai\b/i, /gemini/i, /chat ?gpt/i, /openai/i, /\bgroq\b/i, /\bbot\b/i,
  /\border\b/i, /\bpesan\b/i, /\bbeli\b/i, /\bbayar\b/i, /harga/i, /\bdm\b/i, /inbox/i, /hubungi/i, /\bdaftar\b/i,
  /promo/i, /diskon/i, /kontak/i, /telegram/i, /whats ?app/i, /\bwa\b/i, /wa\.me/i, /\big\b/i, /instagram/i, /discord/i,
  /youtube/i, /\bgrup\b/i, /\bgroup\b/i, /\blink\b/i, /\bbio\b/i, /\bnomor\b/i, /shopee/i, /tokopedia/i,
  /anjing/i, /bangsat/i, /goblok/i, /tolol/i, /kontol/i, /memek/i, /\bbabi\b/i
];

const BAD_TAG = /(cheat|citer|hack|aimbot|wallhack|inject|script|apk|bug|jual|giveaway|gratis|free|helper|assist|aplikasi|sistem|software|tool|coach|panduan|tutorial|tuts|guide|tips|gemini|gpt|openai|groq|bot|order|beli|bayar|harga|inbox|promo|diskon|telegram|whatsapp|instagram|discord|youtube|grup|group|link|bio|nomor|shopee|tokopedia|antiban|auto)/;
const BAD_TAG_EXACT = ['#ai', '#wa', '#ig', '#dm', '#mod'];

const EMOJI_RE = /\p{Extended_Pictographic}/gu;
const EXTRA_EMOJI = ['🎮', '🔥', '🎯', '💪'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function norm(s) {
  return String(s ?? '').toLowerCase().replace(EMOJI_RE, ' ').replace(/#[\p{L}\p{N}_]+/gu, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(s) { return new Set(norm(s).split(' ').filter(w => w.length >= 3)); }
function jaccard(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

// First three words of a caption, normalized; used to reject repeated openings.
function opening(s) { const w = norm(s).split(' ').filter(Boolean); return w.length >= 3 ? w.slice(0, 3).join(' ') : ''; }

function violations(text) { return BANNED.filter(re => re.test(String(text ?? ''))).map(re => re.source); }

// The old Ingest cleaner (rewrites risky words) — used only for fallback sources.
function cleanLegacy(s) {
  return String(s ?? '').replace(/auto ?(headshot|aim)/gi, 'aim').replace(/anti ?ban/gi, '').replace(/seperti di video/gi, '')
    .replace(/(cheat|citer|cheater|hack|aimbot|aim ?bot|wallhack|wall ?hack|inject|script)/gi, 'trik')
    .replace(/\b(lewat|dengan|pakai) (panduan|tutorial)( khusus)?( dari kami)?/gi, '')
    .replace(/(helper|assistant|coaching|aplikasi|sistem|panduan|tutorial|tuts|guide)( khusus)?( dari kami)?/gi, '')
    .replace(/\b(gemini|chatgpt|openai)\b/gi, '').replace(/\s{2,}/g, ' ').replace(/\s+([!?.,])/g, '$1').trim();
}

function normTag(h) {
  const t = ('#' + String(h ?? '').replace(/^#+/, '')).replace(/\s+/g, '').toLowerCase();
  return /^#[a-z0-9_]{2,30}$/.test(t) && !BAD_TAG.test(t.slice(1)) && !BAD_TAG_EXACT.includes(t) ? t : null;
}

function finalizeTags(list) {
  let tags = [...new Set(['#fyp', ...(list || []).map(normTag).filter(Boolean)])].slice(0, 6);
  if (tags.length < 4) for (const t of shuffle(HASHTAG_POOL)) { if (tags.length >= 5) break; if (!tags.includes(t)) tags.push(t); }
  return tags;
}

// Keeps at most two emoji (counted per grapheme, so a ZWJ sequence like 🧘‍♂️ counts once) and adds one if none.
function fixEmoji(caption) {
  const isEmoji = g => /\p{Extended_Pictographic}/u.test(g);
  const graphemes = typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter('id', { granularity: 'grapheme' }).segment(caption)].map(x => x.segment)
    : Array.from(caption);
  const count = graphemes.filter(isEmoji).length;
  if (count > 2) { let n = 0; caption = graphemes.filter(g => !isEmoji(g) || ++n <= 2).join('').replace(/\s{2,}/g, ' ').trim(); }
  if (count === 0) { const e = pick(EXTRA_EMOJI); if ((caption + ' ' + e).length <= 180) caption = caption + ' ' + e; }
  return caption;
}

// Validates and normalizes a {title, caption, hashtags} candidate against rule D and the recent list.
// Returns { ok: true, cand } or { ok: false, reason }.
function validateCandidate(o, recent) {
  if (!o || typeof o !== 'object') return { ok: false, reason: 'bukan objek' };
  let title = String(o.title ?? '').replace(/\s+/g, ' ').trim();
  let caption = String(o.caption ?? '').replace(/\s+/g, ' ').trim();
  const capTags = caption.match(/#[\p{L}\p{N}_]+/gu) || [];
  caption = caption.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s{2,}/g, ' ').trim();
  title = title.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s{2,}/g, ' ').trim();
  if (title.length < 5 || title.length > 60) return { ok: false, reason: 'panjang judul ' + title.length };
  caption = fixEmoji(caption);
  if (caption.length < 40 || caption.length > 180) return { ok: false, reason: 'panjang caption ' + caption.length };
  const v = violations(title + ' \n ' + caption);
  if (v.length) return { ok: false, reason: 'melanggar: ' + v.slice(0, 3).join(', ') };
  const nt = norm(title), nc = norm(caption), open = opening(caption);
  for (const r of recent || []) {
    if (r.title && (norm(r.title) === nt || jaccard(r.title, title) >= 0.6)) return { ok: false, reason: 'judul mirip: ' + r.title };
    if (r.caption && (norm(r.caption) === nc || jaccard(r.caption, caption) >= 0.5)) return { ok: false, reason: 'caption mirip: ' + r.caption.slice(0, 40) };
    if (r.caption && open && opening(r.caption) === open) return { ok: false, reason: 'pembuka sama: ' + open };
  }
  const tags = finalizeTags([...(Array.isArray(o.hashtags) ? o.hashtags : []), ...capTags]);
  return { ok: true, cand: { title, caption, hashtags: tags } };
}

function parseJsonText(t) {
  const s = String(t ?? '').replace(/```json|```/g, '').trim();
  const i = s.indexOf('{'), j = s.lastIndexOf('}');
  if (i < 0 || j <= i) throw new Error('tidak ada JSON');
  return JSON.parse(s.slice(i, j + 1));
}

// Accepts a Groq (OpenAI-style) or Gemini response object. Returns { model, obj } or throws.
function parseModelResponse(r) {
  if (r && Array.isArray(r.choices)) return { model: r.model || 'groq', obj: parseJsonText(r.choices[0]?.message?.content) };
  if (r && Array.isArray(r.candidates)) {
    const text = (r.candidates[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text ?? '').join('');
    return { model: r.modelVersion || 'gemini', obj: parseJsonText(text) };
  }
  throw new Error(r?.error?.message ? 'error API: ' + String(r.error.message).slice(0, 120) : 'respons tidak dikenal');
}

function parseRecent(raw) {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return (Array.isArray(arr) ? arr : []).filter(r => r && (r.title || r.caption))
      .map(r => ({ title: String(r.title ?? ''), caption: String(r.caption ?? ''), account_name: r.account_name ?? null,
        angle: r.angle ?? null, hook: r.hook ?? null })).slice(0, 20);
  } catch (e) { return []; }
}

// Picks a random item, avoiding values used by the most recent posts when possible.
function pickFresh(list, used) { const fresh = list.filter(x => !used.includes(x)); return pick(fresh.length ? fresh : list); }

function manualFallback(recent) {
  for (const m of shuffle(MANUAL_POOL)) {
    const v = validateCandidate({ ...m, hashtags: shuffle(HASHTAG_POOL).slice(0, 4) }, recent);
    if (v.ok) return v.cand;
  }
  const m = pick(MANUAL_POOL);
  return { title: m.title, caption: m.caption, hashtags: finalizeTags(shuffle(HASHTAG_POOL).slice(0, 4)) };
}

const SYSTEM_PROMPT = [
  'Kamu penulis caption TikTok berbahasa Indonesia untuk ' + ACCOUNTS_HINT + '.',
  'Gaya: hook santai dan relatable tentang Point Blank, lalu pesan bahwa gameplay, setting, strategi, dan performa bisa dibuat makin optimal supaya makin jago. Informatif dan santai, BUKAN jualan. Bahasa gaul yang natural dan sopan.',
  'Kamu TIDAK melihat videonya: jangan menyebut, menebak, atau merujuk isi video.',
  'DILARANG: ajakan order, beli, bayar, harga, DM, inbox, hubungi, daftar, promo, diskon; ajakan ke platform lain (Telegram, WA/WhatsApp, IG/Instagram, Discord, YouTube, grup, link, link di bio, cek bio, nomor, Shopee, Tokopedia);',
  'kata panduan, tutorial, tuts, guide, tips; cheat, citer, hack, aimbot, wallhack, inject, script, mod, bug abuse, jual beli akun, giveaway, gratis diamond/cash; helper, assistant, aplikasi, sistem, software, tools, coaching, coach;',
  'frasa "seperti di video"; klaim auto aim, auto headshot, tembus tembok, pasti menang, anti-ban, pasti naik rank, langsung pro; menyebut AI, Gemini, ChatGPT, bot; kata kasar, SARA, provokasi, clickbait menyesatkan.',
  'Format: title maks 50 karakter tanpa hashtag; caption 80-170 karakter tanpa hashtag, berisi 1-2 emoji; hashtags 4-6 item huruf kecil tanpa spasi, wajib #fyp, sisanya relevan dengan Point Blank/gaming (boleh dari: ' + HASHTAG_POOL.join(' ') + ').',
  'Pakai bahasa Indonesia gaul yang wajar dan tanpa salah ketik; hindari istilah bahasa Inggris yang tidak perlu (tulis "sensitivitas", bukan "sensitivity").',
  'Tulis kalimat yang BENAR-BENAR BARU: jangan meniru, memparafrasekan, atau memakai pola pembuka yang sama dengan daftar caption terakhir yang diberikan.',
  'Balas HANYA JSON valid: {"title":"...","caption":"...","hashtags":["#fyp","..."]}'
].join('\n');

function buildUserPrompt(ctx) {
  const lines = (ctx.recent || []).filter(r => r.title && !violations(r.title + ' ' + r.caption).length).slice(0, 20).map((r, i) => (i + 1) + '. ' + r.title + ' — ' + r.caption);
  return [
    'Akun: @' + ctx.account + ' (slot ' + ctx.slot + ' WIB).',
    'Sudut pandang konten: ' + ctx.angle + '.',
    'Gaya pembuka: ' + ctx.hook + '.',
    lines.length ? 'Caption terakhir (JANGAN mirip, jangan pakai judul/pembuka yang sama):\n' + lines.join('\n') : 'Belum ada caption sebelumnya.',
    'Tulis 1 judul, 1 caption, dan hashtag sesuai aturan. Balas JSON saja.'
  ].join('\n\n');
}

// Fingerprint of this library (function sources + constants). Each Code node outputs it as lib_hash so
// the copy pasted into n8n can be compared with `node n8n/code/build.js` output.
function libHash() {
  const src = [pick, shuffle, norm, tokens, jaccard, violations, cleanLegacy, normTag, finalizeTags, fixEmoji,
    validateCandidate, parseJsonText, parseModelResponse, parseRecent, manualFallback, buildUserPrompt, opening, pickFresh].map(f => f.toString()).join('\n')
    + JSON.stringify([ACCOUNTS_HINT, HASHTAG_POOL, ANGLES, HOOKS, MANUAL_POOL, BANNED.map(String), String(BAD_TAG), BAD_TAG_EXACT,
      String(EMOJI_RE), EXTRA_EMOJI, SYSTEM_PROMPT]);
  let h = 0x811c9dc5;
  for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}
