const assert = require('assert');
// Buffer body (same logic as jsonBody expression)
function body($json, ch){ return { query: 'mutation { createPost(input: { text: ' + JSON.stringify(($json.caption ?? '') + '\n\n' + ($json.hashtags ?? []).join(' ')) + ', channelId: ' + JSON.stringify(ch) + ', schedulingType: automatic, mode: shareNow, assets: { videos: [{ url: ' + JSON.stringify($json.video_url) + ' }] } }) { __typename ... on PostActionSuccess { post { id status dueAt } } ... on MutationError { message } } }' }; }
const b = body({caption:'Tips "hemat" \\ listrik 🍳', hashtags:['#fyp','#a'], video_url:'https://x/a.mp4'}, 'ch1');
console.log(b.query);
assert(b.query.includes('text: "Tips \\"hemat\\" \\\\ listrik 🍳\\n\\n#fyp #a"'));
// Gemini parse
function parse(text, userCaption){ try { const t = (text ?? '').replace(/```json|```/g, '').trim(); const o = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); return { caption: String(o.caption ?? ''), hashtags: Array.isArray(o.hashtags) ? o.hashtags.map(h => (String(h).startsWith('#') ? String(h) : '#' + h).replace(/\s+/g, '')) : [] }; } catch (e) { return { caption: userCaption || 'Video baru 🎬', hashtags: ['#fyp'] }; } }
assert.deepStrictEqual(parse('```json\n{"caption":"Hai","hashtags":["fyp","#resep enak"]}\n```'), {caption:'Hai',hashtags:['#fyp','#resepenak']});
assert.deepStrictEqual(parse('maaf saya tidak bisa', 'catatan'), {caption:'catatan',hashtags:['#fyp']});
assert.deepStrictEqual(parse(''), {caption:'Video baru 🎬',hashtags:['#fyp']});
// Postgres array literal for hashtags
const lit = ['#fyp','#a"b'].map(h => '"' + h.replace(/"/g, '') + '"').join(',');
assert.strictEqual('{' + lit + '}', '{"#fyp","#ab"}');
// schedule regex
const m = 'resep @2026-10-07 19:00'.match(/@(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/); assert.strictEqual(m[1], '2026-10-07 19:00');
console.log('ALL OK');

// Title-aware parser (Ingest "Parse Caption Gemini")
function parse2(text, u){ try { const t = (text ?? '').replace(/```json|```/g, '').trim(); const o = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); return { title: String(o.title ?? '').slice(0, 100), caption: String(o.caption ?? ''), hashtags: Array.isArray(o.hashtags) ? o.hashtags.map(h => (String(h).startsWith('#') ? String(h) : '#' + h).replace(/\s+/g, '')) : [] }; } catch (e) { return { title: (u || 'Video baru').slice(0, 60), caption: u || 'Video baru 🎬', hashtags: ['#fyp'] }; } }
assert.deepStrictEqual(parse2('{"title":"Nasi Goreng Kilat","caption":"Cuma 5 menit!","hashtags":["fyp"]}'), {title:'Nasi Goreng Kilat',caption:'Cuma 5 menit!',hashtags:['#fyp']});
assert.deepStrictEqual(parse2('error', 'resep nasi'), {title:'resep nasi',caption:'resep nasi',hashtags:['#fyp']});
// Telegram HTML escaping used in report
const esc = s => (s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
assert.strictEqual(esc('A & B <3'), 'A &amp; B &lt;3');
console.log('ALL OK (title/report)');
