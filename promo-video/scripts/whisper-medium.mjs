// QA helper: adds the multilingual "medium" whisper.cpp model (better Indonesian judge) to .tools/whisper.
import { downloadWhisperModel } from '@remotion/install-whisper-cpp';
import path from 'node:path';
await downloadWhisperModel({ model: 'medium', folder: path.resolve('.tools/whisper') });
console.log('medium ready');
