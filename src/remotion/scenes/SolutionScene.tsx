import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { Logo } from '../components/Logo';
import { THEME } from '../lib/theme';
import { fadeInUp, scaleIn } from '../lib/animations';

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Logo animates in first
  const logoStyle = scaleIn(frame, 10);

  // Tagline fades in after logo
  const taglineStyle = fadeInUp(frame, 40, 20);

  return (
    <AbsoluteFill>
      <Background variant="gradient" animated />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 30,
        }}
      >
        {/* Logo with animation */}
        <div style={logoStyle}>
          <Logo size="xl" animated={false} />
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 36,
            fontWeight: 500,
            color: THEME.colors.textSecondary,
            textAlign: 'center',
            ...taglineStyle,
          }}
        >
          Create{' '}
          <span
            style={{
              background: `linear-gradient(135deg, ${THEME.colors.accentColor} 0%, ${THEME.colors.accentHover} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
            }}
          >
            Perfect Resumes
          </span>{' '}
          with AI
        </div>

        {/* Subtle decorative elements */}
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${THEME.colors.accentLight} 0%, transparent 70%)`,
            opacity: 0.5,
            zIndex: -1,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
