// QA helper: installs whisper.cpp + a multilingual model locally (gitignored .tools/whisper).
import { installWhisperCpp, downloadWhisperModel } from '@remotion/install-whisper-cpp';
import path from 'node:path';
const to = path.resolve('.tools/whisper');
await installWhisperCpp({ to, version: '1.5.5' });
await downloadWhisperModel({ model: 'small', folder: to });
console.log('whisper ready', to);
