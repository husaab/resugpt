import React from 'react';
import { useCurrentFrame } from 'remotion';
import { THEME } from '../lib/theme';
import { scaleIn } from '../lib/animations';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  startFrame?: number;
  animated?: boolean;
}

const sizes = {
  sm: { fontSize: 32, gap: 4 },
  md: { fontSize: 48, gap: 6 },
  lg: { fontSize: 64, gap: 8 },
  xl: { fontSize: 80, gap: 10 },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'lg',
  startFrame = 0,
  animated = true,
}) => {
  const frame = useCurrentFrame();
  const { fontSize, gap } = sizes[size];

  const animStyle = animated ? scaleIn(frame, startFrame) : { opacity: 1, transform: 'scale(1)' };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: THEME.fonts.sans,
        fontWeight: 700,
        fontSize,
        letterSpacing: '-0.02em',
        ...animStyle,
      }}
    >
      <span style={{ color: THEME.colors.textPrimary }}>Resu</span>
      <span
        style={{
          background: `linear-gradient(135deg, ${THEME.colors.accentColor} 0%, ${THEME.colors.accentHover} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginLeft: gap,
        }}
      >
        GPT
      </span>
    </div>
  );
};
