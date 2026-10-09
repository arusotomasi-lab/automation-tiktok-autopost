"""V3 voice-over with Microsoft Edge TTS (edge-tts), voice id-ID-ArdiNeural.
Usage:
  edge_vo.py test            -> settings grid on 3 test lines -> cache/voice/v3/edge_test/<rate>_<pitch>_<id>.mp3
  edge_vo.py all RATE PITCH  -> all lines of src/audio/voiceover_v3.json -> cache/voice/v3/edge/<id>.mp3
"""
import asyncio
import json
import os
import sys
import edge_tts

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
VOICE = 'id-ID-ArdiNeural'
VO = json.load(open(os.path.join(ROOT, 'src', 'audio', 'voiceover_v3.json'), encoding='utf-8'))['lines']


async def say(text, path, rate, pitch):
    await edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch).save(path)


async def main():
    mode = sys.argv[1]
    if mode == 'test':
        out = os.path.join(ROOT, 'cache', 'voice', 'v3', 'edge_test')
        os.makedirs(out, exist_ok=True)
        tests = [l for l in VO if l['id'] in ('01_open', '03_pick', '05_ai')]
        for rate in ('-5%', '+0%'):
            for pitch in ('-2Hz', '-5Hz'):
                for l in tests:
                    await say(l['say'], os.path.join(out, f"{rate}_{pitch}_{l['id']}.mp3"), rate, pitch)
        print('test ok')
    else:
        rate, pitch = sys.argv[2], sys.argv[3]
        out = os.path.join(ROOT, 'cache', 'voice', 'v3', 'edge')
        os.makedirs(out, exist_ok=True)
        for l in VO:
            await say(l.get('edge', l['say']), os.path.join(out, f"{l['id']}.mp3"), rate, pitch)
            print('line', l['id'])
        json.dump({'voice': VOICE, 'rate': rate, 'pitch': pitch}, open(os.path.join(out, 'settings.json'), 'w'))


asyncio.run(main())
