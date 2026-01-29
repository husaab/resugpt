import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { THEME } from '../lib/theme';

interface BackgroundProps {
  variant?: 'default' | 'gradient' | 'accent';
  animated?: boolean;
}

export const Background: React.FC<BackgroundProps> = ({
  variant = 'default',
  animated = false,
}) => {
  const frame = useCurrentFrame();

  // Subtle gradient animation
  const gradientOffset = animated
    ? interpolate(frame, [0, 300], [0, 30], {
        extrapolateRight: 'clamp',
      })
    : 0;

  const backgrounds: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: THEME.colors.bgBody,
    },
    gradient: {
      background: `linear-gradient(${135 + gradientOffset}deg,
        ${THEME.colors.bgBody} 0%,
        ${THEME.colors.accentLighter} 50%,
        ${THEME.colors.bgBody} 100%)`,
    },
    accent: {
      background: `linear-gradient(135deg,
        ${THEME.colors.accentColor} 0%,
        ${THEME.colors.accentHover} 100%)`,
    },
  };

  return (
    <AbsoluteFill style={backgrounds[variant]}>
      {/* Subtle grid pattern for texture */}
      {variant === 'gradient' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(${THEME.colors.borderColor} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: 0.3,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
