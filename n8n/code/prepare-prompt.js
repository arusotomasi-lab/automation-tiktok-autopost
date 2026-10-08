// Code node "Siapkan Prompt Caption" (Run Once for Each Item). caption-lib.js is prepended by build.js.
// Input $json: response of "Ambil Caption Terakhir" ({ recentRaw: "<json array>" }).
// Groq models in fallback order (verified via GET /openai/v1/models). Swap the two lines to change the primary.
const GROQ_MODEL_1 = 'qwen/qwen3.8-27b';
const GROQ_MODEL_2 = 'openai/gpt-oss-120b';
// Per-model reasoning settings so the reply holds only the JSON answer.
const MODEL_PARAMS = {
  'openai/gpt-oss-120b': { reasoning_effort: 'low', include_reasoning: false },
  'qwen/qwen3.8-27b': { reasoning_effort: 'none', reasoning_format: 'hidden' }
};
const t0 = Date.now();
const row = $('Kunci Antrean').item.json;
const recent = parseRecent($json.recentRaw ?? $json.data ?? '[]');
const gr = row.gemini_raw || {};
const ingest = gr.ingest_caption || { title: row.title, caption: row.caption, hashtags: row.hashtags };
let slot = '';
try { slot = new Date(row.scheduled_at).toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) {}
const usedAngles = recent.slice(0, 8).map(r => r.angle).filter(Boolean);
const usedHooks = recent.slice(0, 3).map(r => r.hook).filter(Boolean);
const ctx = { account: row.account_name || 'pointblank', slot, angle: pickFresh(ANGLES, usedAngles), hook: pickFresh(HOOKS, usedHooks), recent };
const user = buildUserPrompt(ctx);
const seed = Math.floor(Math.random() * 1000000);
const messages = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: user }];
const groqBody = model => ({ model, messages, temperature: 0.95, max_completion_tokens: 1024, seed,
  response_format: { type: 'json_object' }, ...(MODEL_PARAMS[model] || {}) });
return {
  json: {
    id: row.id, account: ctx.account, slot, angle: ctx.angle, hook: ctx.hook, recent, ingest, t0, lib_hash: libHash(),
    groqBody1: groqBody(GROQ_MODEL_1),
    groqBody2: groqBody(GROQ_MODEL_2),
    geminiBody: { systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 1, maxOutputTokens: 1024, seed } }
  }
};
