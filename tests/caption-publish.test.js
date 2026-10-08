// Tests for the publish-time caption Code nodes. Runs the exact node code (lib + body) in a vm
// sandbox with a mocked n8n $() / $json, so what passes here is what runs in n8n.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dir = path.join(__dirname, '..', 'n8n', 'code');
const lib = fs.readFileSync(path.join(dir, 'caption-lib.js'), 'utf8');
const body = f => fs.readFileSync(path.join(dir, f), 'utf8');

const plain = x => JSON.parse(JSON.stringify(x));
// Lib functions in a plain sandbox.
const L = vm.createContext({});
vm.runInContext(lib + '\n;globalThis.__L = { ANGLE_RULES, HOOKS, libHash, opening, pickFresh, ANGLES, validateCandidate, violations, finalizeTags, normTag, jaccard, parseModelResponse, manualFallback, MANUAL_POOL, HASHTAG_POOL, cleanLegacy, SYSTEM_PROMPT, buildUserPrompt };', L);
const {
  validateCandidate, violations, finalizeTags, normTag, jaccard, parseModelResponse, manualFallback, MANUAL_POOL, cleanLegacy
} = L.__L;

// Runs a node body; nodes = { 'Node Name': json | undefined (unexecuted) }.
function runNode(file, $json, nodes) {
  const $ = name => {
    if (!(name in nodes) || nodes[name] === undefined) throw new Error('Referenced node is unexecuted: ' + name);
    return { item: { json: nodes[name] } };
  };
  const ctx = vm.createContext({ $, $json, Date, Math, JSON });
  return vm.runInContext('(function(){\n' + lib + '\n' + body(file) + '\n})()', ctx).json;
}

const RECENT = [
  { title: 'Biar Main PB Makin Enak dan Jago!', caption: 'Susah berkembang di PB? Tenang, gameplay kamu bisa makin optimal lewat setting dan strategi pas biar makin jago 🎮🔥' },
  { title: 'Crosshair Udah Pas Belum?', caption: 'Sering meleset padahal udah fokus? Coba cek lagi crosshair sama sensitivitas kamu, kadang beda dikit aja udah kerasa banget pas duel 🎯' }
];
const GOOD = { title: 'Recoil Bandel Pas Spray?', caption: 'Peluru suka naik pas spray? Coba atur sensitivitas pelan-pelan dan latih tarikan mouse, lama-lama tembakan makin rapi 🎯', hashtags: ['#fyp', '#pointblank', 'PBIndonesia', '#gamingtips', '#settingpb'] };

// --- validateCandidate ---
let v = validateCandidate(GOOD, RECENT);
assert.ok(v.ok, v.reason);
assert.deepStrictEqual(plain(v.cand.hashtags), ['#fyp', '#pointblank', '#pbindonesia', '#settingpb']); // #gamingtips dropped
for (const bad of ['Pakai cheat biar menang', 'Cek link di bio ya', 'DM aku buat setting', 'Ini tutorial setting PB', 'Dibuat pakai AI keren', 'Auto headshot tiap ronde', 'Seperti di video, atur ini', 'Join grup telegram kita', 'Tips setting PB terbaik', 'Pakai aplikasi ini']) {
  const r = validateCandidate({ ...GOOD, caption: bad + ' supaya gameplay kamu makin optimal dan makin jago tiap hari 🎮' }, []);
  assert.ok(!r.ok, 'harus ditolak: ' + bad);
}
assert.ok(!validateCandidate({ ...GOOD, title: 'x'.repeat(61) }, []).ok, 'judul > 60');
assert.ok(!validateCandidate({ ...GOOD, caption: 'a '.repeat(100) + '🎮' }, []).ok, 'caption > 180');
assert.ok(!validateCandidate({ ...GOOD, title: 'Biar Main PB Makin Enak dan Jago!' }, RECENT).ok, 'judul sama persis');
assert.ok(!validateCandidate({ ...GOOD, caption: RECENT[1].caption.replace('🎯', '🔥') }, RECENT).ok, 'caption hampir sama');
// hashtags inside caption are moved out; emoji capped at 2; missing emoji added
v = validateCandidate({ ...GOOD, caption: 'Spray suka naik? Atur sensitivitas pelan-pelan biar tembakan makin rapi dan konsisten 🎯🔥💪🎮 #pbzepetto' }, []);
assert.ok(v.ok, v.reason);
assert.ok(!v.cand.caption.includes('#'));
assert.strictEqual((v.cand.caption.match(/\p{Extended_Pictographic}/gu) || []).length, 2);
assert.ok(v.cand.hashtags.includes('#pbzepetto'));
v = validateCandidate({ ...GOOD, caption: 'Spray suka naik? Atur sensitivitas pelan-pelan biar tembakan makin rapi dan konsisten' }, []);
assert.ok(v.ok && /\p{Extended_Pictographic}/u.test(v.cand.caption));
// hashtags: lowercase, #fyp first, unique, max 6, padded to >= 4
assert.deepStrictEqual(plain(finalizeTags(['#FYP', '#a b', '#pbhack', '#ai', '#pointblank']).slice(0, 2)), ['#fyp', '#ab']);
assert.ok(finalizeTags([]).length >= 4 && finalizeTags([]).length <= 6 && finalizeTags([])[0] === '#fyp');
assert.ok(finalizeTags(['#a1', '#a2', '#a3', '#a4', '#a5', '#a6', '#a7']).length === 6);
assert.strictEqual(normTag('#cheatpb'), null);
assert.ok(jaccard('main pb makin jago', 'main pb makin jago') === 1);

// --- manual pool: every entry is valid on its own ---
for (const m of MANUAL_POOL) { const r = validateCandidate({ ...m, hashtags: ['#pointblank'] }, []); assert.ok(r.ok, m.title + ': ' + r.reason); }
const mf = manualFallback([{ title: MANUAL_POOL[0].title, caption: MANUAL_POOL[0].caption }]);
assert.notStrictEqual(mf.title, MANUAL_POOL[0].title);

// --- parseModelResponse ---
const groqResp = o => ({ model: 'openai/gpt-oss-120b', choices: [{ message: { content: JSON.stringify(o) } }] });
const geminiResp = o => ({ modelVersion: 'gemini-3.5-flash-lite', candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(o) + '\n```' }] } }] });
assert.strictEqual(parseModelResponse(groqResp(GOOD)).obj.title, GOOD.title);
assert.strictEqual(parseModelResponse(geminiResp(GOOD)).model, 'gemini-3.5-flash-lite');
assert.throws(() => parseModelResponse({ error: { message: 'model not found' } }), /model not found/);

// --- node bodies ---
const ROW = {
  id: 'row-1', account_name: 'citlahhh', scheduled_at: '2026-10-09T00:00:00+00:00', retry: false,
  title: 'Biar Main PB Makin Enak dan Jago!', caption: 'Susah berkembang di PB? Tenang, gameplay kamu bisa makin optimal lewat setting dan strategi pas biar makin jago 🎮🔥',
  hashtags: ['#fyp', '#pointblank'], gemini_raw: { ok: true, text: '{}', file_name: 'x.mp4' }
};
const prep = runNode('prepare-prompt.js', { recentRaw: JSON.stringify(RECENT) }, { 'Kunci Antrean': ROW });
const prepAngle = prep.angle;
prep.angle = 'kontrol recoil saat spray'; // fixed so the recoil sample captions below match the angle rule
assert.strictEqual(prep.slot, '07:00');
assert.strictEqual(prep.groqBody1.model, 'qwen/qwen3.8-27b');
assert.strictEqual(prep.groqBody1.reasoning_effort, 'none');
assert.strictEqual(prep.groqBody2.model, 'openai/gpt-oss-120b');
assert.strictEqual(prep.groqBody2.include_reasoning, false);
assert.strictEqual(prep.groqBody1.response_format.type, 'json_object');
assert.ok(prep.groqBody1.messages[1].content.includes('Crosshair Udah Pas Belum?'));
assert.ok(!/Main PB kerasa sulit|Susah berkembang di PB\?"/.test(prep.groqBody1.messages[0].content), 'tanpa hook tetap');
assert.strictEqual(prep.recent.length, 2);
assert.strictEqual(runNode('prepare-prompt.js', { recentRaw: 'not json' }, { 'Kunci Antrean': ROW }).recent.length, 0);

const chk = runNode('check-candidate.js', groqResp(GOOD), { 'Siapkan Prompt Caption': prep });
assert.ok(chk.ok && chk.model === 'openai/gpt-oss-120b');
const chkBad = runNode('check-candidate.js', groqResp({ ...GOOD, caption: 'Order sekarang lewat DM ya, setting PB makin optimal dan makin jago 🎮' }), { 'Siapkan Prompt Caption': prep });
assert.ok(!chkBad.ok && /melanggar/.test(chkBad.reason));
assert.ok(!runNode('check-candidate.js', { error: { message: 'boom' } }, { 'Siapkan Prompt Caption': prep }).ok);

const base = { 'Kunci Antrean': ROW, 'Siapkan Prompt Caption': prep };
// (normal) Groq utama OK
let fin = runNode('caption-final.js', chk, { ...base, 'Cek Groq Utama': chk });
assert.strictEqual(fin.source, 'groq_utama');
assert.strictEqual(fin.patch.gemini_raw.file_name, 'x.mp4', 'gemini_raw digabung, tidak ditimpa');
assert.strictEqual(fin.patch.gemini_raw.ingest_caption.title, ROW.title);
assert.strictEqual(fin.patch.gemini_raw.publish_caption.source, 'groq_utama');
// (a) utama gagal (HTTP error) -> cadangan
const chk2 = runNode('check-candidate.js', { ...groqResp({ ...GOOD, title: 'Spray Rapi Itu Latihan' }), model: 'qwen/qwen3.8-27b' }, { 'Siapkan Prompt Caption': prep });
fin = runNode('caption-final.js', chk2, { ...base, 'Groq Caption Utama': { error: { message: '404 not found' } }, 'Cek Groq Cadangan': chk2 });
assert.strictEqual(fin.source, 'groq_cadangan');
assert.match(fin.trail[0].reason, /404/);
// (b) kedua Groq gagal -> Gemini
const gem = geminiResp({ ...GOOD, title: 'Atur Tarikan Mouse Kamu' });
fin = runNode('caption-final.js', gem, { ...base, 'Groq Caption Utama': { error: { message: '404' } }, 'Groq Caption Cadangan': { error: { message: '404' } }, 'Gemini Caption': gem });
assert.strictEqual(fin.source, 'gemini');
// (c) semua model gagal -> caption Ingest (dibersihkan + divalidasi; ROW caption tidak ada di recent)
const prepNoRecent = { ...prep, recent: [] };
fin = runNode('caption-final.js', { error: {} }, { ...base, 'Siapkan Prompt Caption': prepNoRecent, 'Groq Caption Utama': { error: { message: 'x' } }, 'Groq Caption Cadangan': { error: { message: 'x' } }, 'Gemini Caption': { error: { message: 'x' } } });
assert.strictEqual(fin.source, 'ingest');
// (d) semua gagal + caption Ingest melanggar -> manual
const badRow = { ...ROW, caption: 'Order cheat PB sekarang, DM aja ya! Dijamin auto headshot 🎮', title: 'Cheat PB Murah' };
const prepBad = runNode('prepare-prompt.js', { recentRaw: '[]' }, { 'Kunci Antrean': badRow });
fin = runNode('caption-final.js', { error: {} }, { 'Kunci Antrean': badRow, 'Siapkan Prompt Caption': prepBad, 'Groq Caption Utama': { error: { message: 'x' } }, 'Groq Caption Cadangan': { error: { message: 'x' } }, 'Gemini Caption': { error: { message: 'x' } } });
assert.strictEqual(fin.source, 'manual');
assert.ok(MANUAL_POOL.some(m => m.title === fin.title));
assert.ok(violations(fin.title + ' ' + fin.caption).length === 0);
// retry with stored publish caption -> reuse, no prompt node
const retryRow = { ...ROW, retry: true, gemini_raw: { ...ROW.gemini_raw, publish_caption: { source: 'groq_utama', model: 'openai/gpt-oss-120b' } } };
fin = runNode('caption-final.js', retryRow, { 'Kunci Antrean': retryRow });
assert.strictEqual(fin.source, 'reuse');
assert.strictEqual(fin.caption, ROW.caption);
assert.ok(fin.patch.gemini_raw.publish_caption.reused_at);
// unexpected crash inside -> still returns manual caption
fin = runNode('caption-final.js', {}, { 'Kunci Antrean': { ...ROW, gemini_raw: null }, 'Siapkan Prompt Caption': { recent: 'not-an-array' } });
assert.ok(fin.title && fin.caption && fin.hashtags[0] === '#fyp');
// cleanLegacy still rewrites risky words for the Ingest fallback
assert.ok(!/cheat/i.test(cleanLegacy('pakai cheat')));

// emoji counted per grapheme: a ZWJ sequence is one emoji and is kept whole
v = validateCandidate({ ...GOOD, caption: 'Jangan biarin emosi nguasain mabar lo, fokus ke kontrol diri biar main makin tenang 🧘‍♂️🎮🔥' }, []);
assert.ok(v.ok, v.reason);
assert.ok(v.cand.caption.endsWith('🧘‍♂️🎮'), v.cand.caption);
// opening dedupe: same first three words as a recent caption is rejected
const L2 = L.__L;
assert.strictEqual(L2.opening('Pernah ngerasa aim meleset? 🎯'), 'pernah ngerasa aim');
const sameOpen = validateCandidate({ ...GOOD, caption: 'Pernah ngerasa aim meleset terus pas war? Rapikan lagi kontrol dan posisi biar tiap duel makin percaya diri 🎮' },
  [{ title: 'x', caption: 'Pernah ngerasa aim goyang waktu spray? Atur sensitivitas pelan-pelan 🎯' }]);
assert.ok(!sameOpen.ok && /pembuka sama/.test(sameOpen.reason));
// pickFresh avoids used values while any fresh value is left
for (let i = 0; i < 50; i++) assert.notStrictEqual(L2.pickFresh(['a', 'b'], ['a']), 'a');
assert.strictEqual(L2.pickFresh(['a'], ['a']), 'a');
// prepare-prompt avoids angles of the last posts and drops rule-breaking recent captions from the prompt
const used = L2.ANGLES.slice(0, 8);
const prepAvoid = runNode('prepare-prompt.js', { recentRaw: JSON.stringify(used.map((a, i) => ({ title: 'Judul ' + i, caption: 'Caption nomor ' + i + ' tentang PB', angle: a })).concat([{ title: 'Order sekarang', caption: 'DM aja buat order ya' }])) }, { 'Kunci Antrean': ROW });
assert.ok(!used.includes(prepAvoid.angle), 'angle baru');
assert.ok(!prepAvoid.groqBody1.messages[1].content.includes('DM aja'), 'caption melanggar tidak masuk prompt');
assert.ok(/sensitivitas", bukan "sensitivity/.test(prepAvoid.groqBody1.messages[0].content));
// caption-final records the hook for the next run's avoidance
fin = runNode('caption-final.js', chk, { ...base, 'Cek Groq Utama': chk });
assert.strictEqual(fin.patch.gemini_raw.publish_caption.hook, prep.hook);
assert.ok(L.__L.ANGLE_RULES[prepAngle], 'angle acak punya aturan');

// owner rules (9 Okt): no first person, no before/after or result claims, typos, angle must match
const base2 = { title: 'Spray Rapi Itu Latihan', hashtags: ['#pointblank'] };
for (const bad of [
  'Aku sering pegel pas main lama, coba atur kontrol biar lebih nyaman dan presisi tiap ronde 🎮',
  'Tanganku pegel parah pas push, atur kontrol biar posisi tangan lebih nyaman tiap ronde 🎮',
  'Dulu sering kalah duel, sekarang udah mantap karena setting yang pas buat tiap ronde 🎯',
  'Spray makin rapi berkat setting yang pas, coba atur pelan-pelan biar makin stabil 🎯',
  'Atur recoil kamu sekarang dan langsung jago di tiap ronde ranked yang kamu mainin 🎯',
  'Senjata pilihanmu udah kepas sama gaya main kamu? Coba cek lagi biar makin enak dipakai 🎯',
  'Gasss terus pas spray, atur tarikan recoil biar tembakan makin rapi dan konsisten 🎯',
  'Biar matchRanked makin enak, atur tarikan recoil dan spray biar tembakan makin rapi 🎯',
  'Seruduk tanpa ilmu? Cakap aja. Atur tarikan recoil biar spray kamu makin rapi tiap ronde 🎯'
]) assert.ok(!validateCandidate({ ...base2, caption: bad }, []).ok, 'harus ditolak: ' + bad);
assert.ok(validateCandidate({ ...base2, caption: 'Ping suka naik pas war? Cek koneksi internet dan turunin setting grafis biar main tetap lancar 🎮' }, [], 'koneksi dan ping yang stabil').ok);
assert.match(validateCandidate({ ...base2, caption: 'Kalo lag bikin frustasi, coba cek setting mouse dan sensitivitas biar tiap tembakan makin mantap 🎮' }, [], 'koneksi dan ping yang stabil').reason, /keluar topik/);
assert.match(validateCandidate({ ...base2, title: 'Main Makin Enak Tiap Hari', caption: 'Main PB makin enak kalau setting kamu udah pas dan nyaman dipakai tiap hari 🎮' }, [], 'kontrol recoil saat spray').reason, /tidak nyambung/);
assert.ok(!L.__L.HOOKS.some(h => /aku|dulu vs sekarang/i.test(h)), 'hook orang pertama / dulu-sekarang dihapus');
const prepRule = runNode('prepare-prompt.js', { recentRaw: '[]' }, { 'Kunci Antrean': ROW });
assert.ok(prepRule.groqBody1.messages[1].content.includes('(fokus: '), 'fokus sudut pandang ada di prompt');
assert.ok(/DILARANG sudut pandang orang pertama/.test(prepRule.groqBody1.messages[0].content));
assert.strictEqual(prepRule.groqBody1.temperature, 0.7);
assert.ok(validateCandidate({ ...base2, caption: 'Main PvP bareng tim? Atur tarikan recoil dan spray biar tembakan makin rapi tiap ronde 🎯' }, []).ok, 'PvP bukan camelCase');

console.log('CAPTION PUBLISH OK');
console.log('lib_hash', L.__L.libHash());
