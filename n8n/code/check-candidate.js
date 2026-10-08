// Code node "Cek Groq Utama" / "Cek Groq Cadangan" (Run Once for Each Item). caption-lib.js is prepended by build.js.
// Input $json: Groq chat completion response. Output { ok, cand, reason, model } for the following IF node.
const p = $('Siapkan Prompt Caption').item.json;
try {
  const r = parseModelResponse($json);
  const v = validateCandidate(r.obj, p.recent);
  return { json: { ok: v.ok, cand: v.cand || null, reason: v.reason || '', model: r.model, lib_hash: libHash() } };
} catch (e) {
  return { json: { ok: false, cand: null, reason: String(e && e.message || e).slice(0, 200), model: $json.model || '' } };
}
