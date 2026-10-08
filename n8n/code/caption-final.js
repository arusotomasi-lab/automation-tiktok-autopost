// Code node "Caption Final" (Run Once for Each Item). caption-lib.js is prepended by build.js.
// Picks the caption actually sent to Buffer, in order:
// reuse (retry) → Groq utama → Groq cadangan → Gemini → caption Ingest → cadangan manual.
// Never throws: any unexpected error falls back to the manual pool.
const row = $('Kunci Antrean').item.json;
const nodeJson = name => { try { return $(name).item.json; } catch (e) { return null; } };
const errOf = j => j ? String(j.error?.message ?? j.error ?? j.reason ?? 'gagal').slice(0, 160) : 'tidak dijalankan';
const trail = [];
let out = null;
let p = null;
try {
  p = nodeJson('Siapkan Prompt Caption');
  const recent = p?.recent || [];
  const gr = row.gemini_raw || {};
  if (!p && gr.publish_caption) {
    out = { title: row.title, caption: row.caption, hashtags: row.hashtags, source: 'reuse', model: gr.publish_caption.model || '' };
  }
  if (!out && p) {
    const checks = [['groq_utama', 'Cek Groq Utama', 'Groq Caption Utama'], ['groq_cadangan', 'Cek Groq Cadangan', 'Groq Caption Cadangan']];
    for (const [step, checkNode, httpNode] of checks) {
      const c = nodeJson(checkNode);
      if (c) trail.push({ step, ok: !!c.ok, model: c.model || '', reason: c.reason || '' });
      else trail.push({ step, ok: false, reason: errOf(nodeJson(httpNode)) });
      if (c && c.ok && c.cand) { out = { ...c.cand, source: step, model: c.model || '' }; break; }
    }
    if (!out) {
      const g = nodeJson('Gemini Caption');
      try {
        if (!g) throw new Error('tidak dijalankan');
        const r = parseModelResponse(g);
        const v = validateCandidate(r.obj, recent);
        trail.push({ step: 'gemini', ok: v.ok, model: r.model, reason: v.reason || '' });
        if (v.ok) out = { ...v.cand, source: 'gemini', model: r.model };
      } catch (e) { trail.push({ step: 'gemini', ok: false, reason: String(e && e.message || e).slice(0, 160) }); }
    }
  }
  if (!out) {
    const ing = p?.ingest || gr.ingest_caption || { title: row.title, caption: row.caption, hashtags: row.hashtags };
    const v = validateCandidate({ title: cleanLegacy(ing.title), caption: cleanLegacy(ing.caption), hashtags: ing.hashtags }, recent);
    trail.push({ step: 'ingest', ok: v.ok, reason: v.reason || '' });
    if (v.ok) out = { ...v.cand, source: 'ingest', model: '' };
  }
  if (!out) out = { ...manualFallback(recent), source: 'manual', model: '' };
} catch (e) {
  trail.push({ step: 'error', ok: false, reason: String(e && e.message || e).slice(0, 160) });
  out = { ...manualFallback([]), source: 'manual', model: '' };
}
const gr0 = row.gemini_raw || {};
const ingestCaption = gr0.ingest_caption || { title: row.title ?? null, caption: row.caption ?? null, hashtags: row.hashtags ?? [] };
const now = new Date().toISOString();
const publishCaption = out.source === 'reuse'
  ? { ...gr0.publish_caption, reused_at: now }
  : { source: out.source, model: out.model, at: now, angle: p?.angle ?? null, hook: p?.hook ?? null, trail };
return {
  json: {
    title: out.title, caption: out.caption, hashtags: out.hashtags, source: out.source, model: out.model, trail, lib_hash: libHash(),
    elapsed_ms: p?.t0 ? Date.now() - p.t0 : null,
    patch: { title: out.title, caption: out.caption, hashtags: out.hashtags,
      gemini_raw: { ...gr0, ingest_caption: ingestCaption, publish_caption: publishCaption } }
  }
};
