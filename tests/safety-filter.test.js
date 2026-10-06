const assert = require('assert');
// Same logic as the n8n "Parse Caption Gemini" expression
function parseSafe(text, userCaption) {
  const BAD = /(cheat|citer|cheater|hack|aimbot|aim ?bot|wallhack|wall ?hack|inject|mod ?apk|script|bug ?abuse|jual ?akun|giveaway|gratis|free ?(cash|diamond)|link ?di ?bio|gemini|chatgpt|openai|\bai\b|\bbot\b)/i;
  const clean = s => String(s ?? '')
    .replace(/auto ?headshot/gi, 'headshot')
    .replace(/(cheat|citer|cheater|hack|aimbot|aim ?bot|wallhack|wall ?hack|inject|script)/gi, 'trik')
    .replace(/\b(gemini|chatgpt|openai)\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim();
  try {
    const t = String(text ?? '').replace(/```json|```/g, '').trim();
    const o = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
    let tags = (Array.isArray(o.hashtags) ? o.hashtags : [])
      .map(h => ('#' + String(h).replace(/^#+/, '')).replace(/\s+/g, '').toLowerCase())
      .filter(h => h.length > 1 && !BAD.test(h));
    tags = [...new Set(['#fyp', ...tags])].slice(0, 6);
    return { title: clean(o.title).slice(0, 100), caption: clean(o.caption).slice(0, 2200), hashtags: tags };
  } catch (e) {
    return { title: clean(userCaption || 'Momen seru Point Blank').slice(0, 60), caption: clean(userCaption || 'Momen seru hari ini 🎮'), hashtags: ['#fyp', '#pointblank', '#gamingtiktok'] };
  }
}
const r = parseSafe('{"title":"Tips Aimbot SG Point Blank Auto Headshot!","caption":"Cheat aman? Nggak perlu, ini settingan jitu 🎯","hashtags":["#fyp","#pointblank","#PBGemini","#cheatpb","pbindonesia","#fyp"]}');
console.log(r);
assert.strictEqual(r.title, 'Tips trik SG Point Blank headshot!');
assert.ok(!/cheat|gemini|aimbot/i.test(JSON.stringify(r)));
assert.deepStrictEqual(r.hashtags, ['#fyp', '#pointblank', '#pbindonesia']);
console.log('SAFE OK');
