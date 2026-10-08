import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { Background } from './components/Background';
import { Finish, Hud, Lyrics } from './components/Overlay';
import { SceneSlot } from './components/SceneShell';
import { S01Opening } from './scenes/S01Opening';
import { S02Warehouse } from './scenes/S02Warehouse';
import { S03Selection } from './scenes/S03Selection';
import { S04Duplicate } from './scenes/S04Duplicate';
import { S05Caption } from './scenes/S05Caption';
import { S06Schedule } from './scenes/S06Schedule';
import { S07Publish } from './scenes/S07Publish';

export const Promo: React.FC<{ withAudio?: boolean }> = ({ withAudio }) => (
  <AbsoluteFill style={{ backgroundColor: '#040508' }}>
    <Background />
    <SceneSlot k="opening" enter={false}><S01Opening /></SceneSlot>
    <SceneSlot k="warehouse"><S02Warehouse /></SceneSlot>
    <SceneSlot k="selection"><S03Selection /></SceneSlot>
    <SceneSlot k="duplicate"><S04Duplicate /></SceneSlot>
    <SceneSlot k="caption"><S05Caption /></SceneSlot>
    <SceneSlot k="schedule"><S06Schedule /></SceneSlot>
    <SceneSlot k="publish"><S07Publish /></SceneSlot>
    <Hud />
    <Lyrics />
    <Finish />
    {withAudio && <Audio src={staticFile('audio/final-mix.wav')} />}
  </AbsoluteFill>
);
