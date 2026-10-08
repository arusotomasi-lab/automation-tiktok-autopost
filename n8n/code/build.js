// Builds the jsCode strings for the caption Code nodes (lib + node body) so they are never hand-escaped.
// Usage: node n8n/code/build.js            -> writes n8n/code/dist/caption-nodes.json
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const lib = fs.readFileSync(path.join(dir, 'caption-lib.js'), 'utf8');
const body = f => fs.readFileSync(path.join(dir, f), 'utf8');
const code = f => lib + '\n// ---- node body: ' + f + ' ----\n' + body(f);
const out = {
  'Siapkan Prompt Caption': code('prepare-prompt.js'),
  'Cek Groq Utama': code('check-candidate.js'),
  'Cek Groq Cadangan': code('check-candidate.js'),
  'Caption Final': code('caption-final.js')
};
fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
fs.writeFileSync(path.join(dir, 'dist', 'caption-nodes.json'), JSON.stringify(out, null, 2));
for (const [k, v] of Object.entries(out)) console.log(k, v.length, 'chars');
