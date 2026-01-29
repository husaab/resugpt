import React from 'react';
import { Audio, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { VIDEO } from '../lib/theme';

interface BackgroundMusicProps {
  // Path to audio file in public folder (e.g., "music/background.mp3")
  src: string;
  // Volume level (0-1)
  volume?: number;
  // Fade in duration in seconds
  fadeInDuration?: number;
  // Fade out duration in seconds
  fadeOutDuration?: number;
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  src,
  volume = 0.3,
  fadeInDuration = 1,
  fadeOutDuration = 2,
}) => {
  const frame = useCurrentFrame();

  // Calculate fade in/out
  const fadeInFrames = fadeInDuration * VIDEO.fps;
  const fadeOutFrames = fadeOutDuration * VIDEO.fps;
  const fadeOutStart = VIDEO.durationInFrames - fadeOutFrames;

  // Volume with fade in/out
  const adjustedVolume = interpolate(
    frame,
    [0, fadeInFrames, fadeOutStart, VIDEO.durationInFrames],
    [0, volume, volume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <Audio
      src={staticFile(src)}
      volume={adjustedVolume}
    />
  );
};
