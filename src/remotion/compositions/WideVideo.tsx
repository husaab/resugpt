import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { HookScene } from '../scenes/HookScene';
import { SolutionScene } from '../scenes/SolutionScene';
import { UploadScene } from '../scenes/UploadScene';
import { ProcessingScene } from '../scenes/ProcessingScene';
import { EditorScene } from '../scenes/EditorScene';
import { CoverLetterScene } from '../scenes/CoverLetterScene';
import { PricingScene } from '../scenes/PricingScene';
import { CTAScene } from '../scenes/CTAScene';
import { BackgroundMusic } from '../components/BackgroundMusic';
import { SCENES, VIDEO } from '../lib/theme';

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

// Wide format wrapper - scales and centers content designed for 1080x1080
const WideWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Calculate scale to fit 1080 height content in 1080 height, centered horizontally
  // Content is 1080x1080, container is 1920x1080
  // We keep height the same and center horizontally
  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: VIDEO.width,
          height: VIDEO.height,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const WideVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      {/* Background Music - uncomment and add your audio file to public/music/ */}
      {/* <BackgroundMusic src="music/background.mp3" volume={0.25} /> */}

      <WideWrapper>
        {/* Scene 1: Hook (0-4s, frames 0-120) */}
        <Sequence from={SCENES.hook.start} durationInFrames={SCENES.hook.duration}>
          <SceneWithFade sceneEnd={SCENES.hook.duration}>
            <HookScene />
          </SceneWithFade>
        </Sequence>

        {/* Scene 2: Solution (4-8s, frames 120-240) */}
        <Sequence from={SCENES.solution.start} durationInFrames={SCENES.solution.duration}>
          <SceneWithFade sceneEnd={SCENES.solution.duration}>
            <SolutionScene />
          </SceneWithFade>
        </Sequence>

        {/* Scene 3: Upload Demo (8-15s, frames 240-450) */}
        <Sequence from={SCENES.upload.start} durationInFrames={SCENES.upload.duration}>
          <SceneWithFade sceneEnd={SCENES.upload.duration}>
            <UploadScene />
          </SceneWithFade>
        </Sequence>

        {/* Scene 4: AI Processing (15-19s, frames 450-570) */}
        <Sequence from={SCENES.processing.start} durationInFrames={SCENES.processing.duration}>
          <SceneWithFade sceneEnd={SCENES.processing.duration}>
            <ProcessingScene />
          </SceneWithFade>
        </Sequence>

        {/* Scene 5: Editor Demo (19-26s, frames 570-780) */}
        <Sequence from={SCENES.editor.start} durationInFrames={SCENES.editor.duration}>
          <SceneWithFade sceneEnd={SCENES.editor.duration}>
            <EditorScene />
          </SceneWithFade>
        </Sequence>

        {/* Scene 6: Cover Letter (26-33s, frames 780-990) */}
        <Sequence from={SCENES.coverLetter.start} durationInFrames={SCENES.coverLetter.duration}>
          <SceneWithFade sceneEnd={SCENES.coverLetter.duration}>
            <CoverLetterScene />
          </SceneWithFade>
        </Sequence>

        {/* Scene 7: Pricing (33-39s, frames 990-1170) */}
        <Sequence from={SCENES.pricing.start} durationInFrames={SCENES.pricing.duration}>
          <SceneWithFade sceneEnd={SCENES.pricing.duration}>
            <PricingScene />
          </SceneWithFade>
        </Sequence>

        {/* Scene 8: CTA (39-45s, frames 1170-1350) */}
        <Sequence from={SCENES.cta.start} durationInFrames={SCENES.cta.duration}>
          <CTAScene />
        </Sequence>
      </WideWrapper>
    </AbsoluteFill>
  );
};
