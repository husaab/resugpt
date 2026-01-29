import React from 'react';
import { useCurrentFrame } from 'remotion';
import { THEME } from '../lib/theme';
import { fadeInUp, pulse } from '../lib/animations';

interface MockButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  startFrame?: number;
  animated?: boolean;
  pulsing?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

export const MockButton: React.FC<MockButtonProps> = ({
  children,
  variant = 'primary',
  size = 'lg',
  startFrame = 0,
  animated = true,
  pulsing = false,
  icon,
  style,
}) => {
  const frame = useCurrentFrame();

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontFamily: THEME.fonts.sans,
    fontWeight: 600,
    borderRadius: THEME.radii.lg,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    md: {
      padding: '12px 24px',
      fontSize: 16,
    },
    lg: {
      padding: '16px 32px',
      fontSize: 18,
    },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: THEME.colors.accentColor,
      color: THEME.colors.textInverse,
      boxShadow: THEME.shadows.md,
    },
    secondary: {
      backgroundColor: THEME.colors.bgCard,
      color: THEME.colors.textPrimary,
      border: `1px solid ${THEME.colors.borderColor}`,
    },
  };

  const animStyle = animated ? fadeInUp(frame, startFrame) : {};
  const pulseStyle = pulsing ? pulse(frame, startFrame) : {};

  return (
    <div
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...animStyle,
        ...pulseStyle,
        ...style,
      }}
    >
      {icon}
      {children}
    </div>
  );
};
