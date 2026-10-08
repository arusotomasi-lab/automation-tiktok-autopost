import React from 'react';
import { Composition } from 'remotion';
import { Promo } from './Promo';
import { DURATION, FPS } from './timeline';
import { H, W } from './theme';

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{ withAudio: false }} />
    <Composition id="PromoWithAudio" component={Promo} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{ withAudio: true }} />
  </>
);
