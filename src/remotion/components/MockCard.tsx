import React from 'react';
import { useCurrentFrame } from 'remotion';
import { THEME } from '../lib/theme';
import { fadeInUp, scaleIn } from '../lib/animations';

interface MockCardProps {
  children: React.ReactNode;
  startFrame?: number;
  animated?: boolean;
  animationType?: 'fadeInUp' | 'scaleIn';
  highlighted?: boolean;
  style?: React.CSSProperties;
}

export const MockCard: React.FC<MockCardProps> = ({
  children,
  startFrame = 0,
  animated = true,
  animationType = 'fadeInUp',
  highlighted = false,
  style,
}) => {
  const frame = useCurrentFrame();

  const animStyle = animated
    ? animationType === 'scaleIn'
      ? scaleIn(frame, startFrame)
      : fadeInUp(frame, startFrame)
    : {};

  return (
    <div
      style={{
        backgroundColor: THEME.colors.bgElevated,
        borderRadius: THEME.radii.xl,
        border: highlighted
          ? `2px solid ${THEME.colors.accentColor}`
          : `1px solid ${THEME.colors.borderColor}`,
        boxShadow: highlighted ? THEME.shadows.lg : THEME.shadows.md,
        overflow: 'hidden',
        ...animStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
