import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// GPU-backed Chromium (ANGLE) keeps 3D transforms and blur fast on Windows.
Config.setChromiumOpenGlRenderer('angle');
