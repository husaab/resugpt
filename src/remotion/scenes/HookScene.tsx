import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { Background } from '../components/Background';
import { THEME, VIDEO, SCENES } from '../lib/theme';
import { fadeInUp, stagger } from '../lib/animations';

// Falling resume icons
const FallingResume: React.FC<{
  index: number;
  startX: number;
}> = ({ index, startX }) => {
  const frame = useCurrentFrame();
  const delay = index * 8;

  // Falling animation
  const y = interpolate(
    frame,
    [delay, delay + 60],
    [-100, 600],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Rotation for falling effect
  const rotation = interpolate(
    frame,
    [delay, delay + 60],
    [0, 15 + index * 5],
    { extrapolateRight: 'clamp' }
  );

  // Fade out at bottom
  const opacity = interpolate(
    frame,
    [delay + 40, delay + 60],
    [0.6, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: startX,
        top: y,
        width: 60,
        height: 80,
        backgroundColor: THEME.colors.bgElevated,
        border: `1px solid ${THEME.colors.borderColor}`,
        borderRadius: THEME.radii.sm,
        boxShadow: THEME.shadows.sm,
        transform: `rotate(${rotation}deg)`,
        opacity,
      }}
    >
      {/* Resume lines */}
      <div style={{ padding: 8 }}>
        <div style={{ height: 6, width: '80%', backgroundColor: THEME.colors.bgMuted, borderRadius: 2, marginBottom: 4 }} />
        <div style={{ height: 4, width: '100%', backgroundColor: THEME.colors.bgMuted, borderRadius: 2, marginBottom: 3 }} />
        <div style={{ height: 4, width: '90%', backgroundColor: THEME.colors.bgMuted, borderRadius: 2, marginBottom: 3 }} />
        <div style={{ height: 4, width: '70%', backgroundColor: THEME.colors.bgMuted, borderRadius: 2 }} />
      </div>
    </div>
  );
};

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Text animations
  const mainTextStyle = fadeInUp(frame, 20, 20);
  const statStyle = fadeInUp(frame, 50, 20);

  // Falling resumes positions
  const resumePositions = [150, 300, 450, 600, 750, 900];

  return (
    <AbsoluteFill>
      <Background variant="gradient" animated />

      {/* Falling resume icons */}
      {resumePositions.map((x, i) => (
        <FallingResume key={i} index={i} startX={x} />
      ))}

      {/* Main content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Main hook text */}
        <div
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 56,
            fontWeight: 700,
            color: THEME.colors.textPrimary,
            textAlign: 'center',
            lineHeight: 1.2,
            ...mainTextStyle,
          }}
        >
          Tired of sending
          <br />
          <span style={{ color: THEME.colors.error }}>generic</span> resumes?
        </div>

        {/* Stat */}
        <div
          style={{
            marginTop: 40,
            fontFamily: THEME.fonts.sans,
            fontSize: 24,
            color: THEME.colors.textSecondary,
            textAlign: 'center',
            ...statStyle,
          }}
        >
          <span style={{ fontWeight: 700, color: THEME.colors.accentColor, fontSize: 32 }}>
            85%
          </span>{' '}
          of resumes never get past ATS
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
