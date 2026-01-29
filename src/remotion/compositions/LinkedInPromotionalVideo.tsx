import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { HookScene } from '../scenes/HookScene';
import { SolutionScene } from '../scenes/SolutionScene';
import { UploadScene } from '../scenes/UploadScene';
import { ProcessingScene } from '../scenes/ProcessingScene';
import { EditorScene } from '../scenes/EditorScene';
import { CoverLetterScene } from '../scenes/CoverLetterScene';
import { PromoCTAScene } from '../scenes/PromoCTAScene';
import { BackgroundMusic } from '../components/BackgroundMusic';

// Scene timing for promotional video (no pricing, shorter)
const PROMO_SCENES = {
  hook: { start: 0, end: 120, duration: 120 },           // 0-4s
  solution: { start: 120, end: 240, duration: 120 },     // 4-8s
  upload: { start: 240, end: 450, duration: 210 },       // 8-15s
  processing: { start: 450, end: 570, duration: 120 },   // 15-19s
  editor: { start: 570, end: 780, duration: 210 },       // 19-26s
  coverLetter: { start: 780, end: 990, duration: 210 },  // 26-33s
  promoCta: { start: 990, end: 1170, duration: 180 },    // 33-39s (promo CTA)
} as const;

// Total duration: 1170 frames = 39 seconds

// Cross-fade wrapper component
const SceneWithFade: React.FC<{
  children: React.ReactNode;
  sceneEnd: number;
  fadeDuration?: number;
}> = ({ children, sceneEnd, fadeDuration = 15 }) => {
  const frame = useCurrentFrame();
  const fadeStart = sceneEnd - fadeDuration;

  let opacity = 1;
  if (frame >= fadeStart) {
    opacity = interpolate(
      frame,
      [fadeStart, sceneEnd],
      [1, 0],
      { extrapolateRight: 'clamp' }
    );
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

export const LinkedInPromotionalVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      {/* Background Music - uses same audio as main video */}
      <BackgroundMusic src="music/background.mp3" volume={0.25} />

      {/* Scene 1: Hook (0-4s) */}
      <Sequence from={PROMO_SCENES.hook.start} durationInFrames={PROMO_SCENES.hook.duration}>
        <SceneWithFade sceneEnd={PROMO_SCENES.hook.duration}>
          <HookScene />
        </SceneWithFade>
      </Sequence>

      {/* Scene 2: Solution (4-8s) */}
      <Sequence from={PROMO_SCENES.solution.start} durationInFrames={PROMO_SCENES.solution.duration}>
        <SceneWithFade sceneEnd={PROMO_SCENES.solution.duration}>
          <SolutionScene />
        </SceneWithFade>
      </Sequence>

      {/* Scene 3: Upload Demo (8-15s) */}
      <Sequence from={PROMO_SCENES.upload.start} durationInFrames={PROMO_SCENES.upload.duration}>
        <SceneWithFade sceneEnd={PROMO_SCENES.upload.duration}>
          <UploadScene />
        </SceneWithFade>
      </Sequence>

      {/* Scene 4: AI Processing (15-19s) */}
      <Sequence from={PROMO_SCENES.processing.start} durationInFrames={PROMO_SCENES.processing.duration}>
        <SceneWithFade sceneEnd={PROMO_SCENES.processing.duration}>
          <ProcessingScene />
        </SceneWithFade>
      </Sequence>

      {/* Scene 5: Editor Demo (19-26s) */}
      <Sequence from={PROMO_SCENES.editor.start} durationInFrames={PROMO_SCENES.editor.duration}>
        <SceneWithFade sceneEnd={PROMO_SCENES.editor.duration}>
          <EditorScene />
        </SceneWithFade>
      </Sequence>

      {/* Scene 6: Cover Letter (26-33s) */}
      <Sequence from={PROMO_SCENES.coverLetter.start} durationInFrames={PROMO_SCENES.coverLetter.duration}>
        <SceneWithFade sceneEnd={PROMO_SCENES.coverLetter.duration}>
          <CoverLetterScene />
        </SceneWithFade>
      </Sequence>

      {/* Scene 7: Promo CTA (33-39s) - Special promotional ending */}
      <Sequence from={PROMO_SCENES.promoCta.start} durationInFrames={PROMO_SCENES.promoCta.duration}>
        <PromoCTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Export the duration for registration
export const PROMO_DURATION_IN_FRAMES = 1170; // 39 seconds at 30fps
