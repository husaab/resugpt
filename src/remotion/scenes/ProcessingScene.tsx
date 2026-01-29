import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background';
import { LightningIcon } from '../components/Icons';
import { THEME, VIDEO } from '../lib/theme';
import { fadeInUp, glowPulse, orbit, scaleIn } from '../lib/animations';

// Particle component for orbiting effect
const Particle: React.FC<{
  index: number;
  radius: number;
  size: number;
  color: string;
  speed: number;
}> = ({ index, radius, size, color, speed }) => {
  const frame = useCurrentFrame();
  const { x, y } = orbit(frame, 0, index, radius, speed);

  const opacity = interpolate(
    frame,
    [0, 15],
    [0, 0.8],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        transform: `translate(${x}px, ${y}px)`,
        opacity,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
    />
  );
};

export const ProcessingScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Lightning icon animation
  const iconStyle = scaleIn(frame, 10);
  const glowStyle = glowPulse(frame, 10);

  // Text animation
  const textStyle = fadeInUp(frame, 30);

  // Pulsing circle behind icon
  const pulseScale = 1 + Math.sin(frame * 0.1) * 0.1;
  const pulseOpacity = 0.3 + Math.sin(frame * 0.1) * 0.1;

  // Particles configuration
  const particles = [
    { radius: 100, size: 8, color: THEME.colors.accentColor, speed: 0.08 },
    { radius: 100, size: 6, color: THEME.colors.accentHover, speed: 0.08 },
    { radius: 100, size: 8, color: THEME.colors.accentColor, speed: 0.08 },
    { radius: 100, size: 6, color: THEME.colors.accentHover, speed: 0.08 },
    { radius: 140, size: 6, color: `${THEME.colors.accentColor}80`, speed: 0.05 },
    { radius: 140, size: 4, color: `${THEME.colors.accentHover}80`, speed: 0.05 },
    { radius: 140, size: 6, color: `${THEME.colors.accentColor}80`, speed: 0.05 },
    { radius: 140, size: 4, color: `${THEME.colors.accentHover}80`, speed: 0.05 },
  ];

  return (
    <AbsoluteFill>
      <Background variant="gradient" animated />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Central lightning container */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 300,
            height: 300,
          }}
        >
          {/* Pulsing background circle */}
          <div
            style={{
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: '50%',
              backgroundColor: THEME.colors.accentLight,
              transform: `scale(${pulseScale})`,
              opacity: pulseOpacity,
            }}
          />

          {/* Second pulsing ring */}
          <div
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: `2px solid ${THEME.colors.accentColor}`,
              transform: `scale(${1 + Math.sin(frame * 0.08 + 1) * 0.08})`,
              opacity: 0.2,
            }}
          />

          {/* Orbiting particles */}
          {particles.map((p, i) => (
            <Particle key={i} index={i} {...p} />
          ))}

          {/* Lightning icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: THEME.colors.accentColor,
              boxShadow: THEME.shadows.lg,
              ...iconStyle,
              ...glowStyle,
            }}
          >
            <LightningIcon size={50} color={THEME.colors.textInverse} />
          </div>
        </div>

        {/* Processing text */}
        <div
          style={{
            marginTop: 40,
            fontFamily: THEME.fonts.sans,
            fontSize: 28,
            fontWeight: 600,
            color: THEME.colors.textPrimary,
            textAlign: 'center',
            ...textStyle,
          }}
        >
          AI Tailoring Your Resume
          <span style={{ color: THEME.colors.accentColor }}>...</span>
        </div>

        {/* Sub-text with progress dots */}
        <div
          style={{
            marginTop: 16,
            fontFamily: THEME.fonts.sans,
            fontSize: 16,
            color: THEME.colors.textSecondary,
            ...fadeInUp(frame, 50),
          }}
        >
          Matching keywords & optimizing for ATS
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
