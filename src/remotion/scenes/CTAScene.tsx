import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { Background } from '../components/Background';
import { Logo } from '../components/Logo';
import { MockButton } from '../components/MockButton';
import { THEME, VIDEO } from '../lib/theme';
import { fadeInUp, bounceIn, pulse } from '../lib/animations';

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Animation phases
  const headlineAppears = 10;
  const subheadAppears = 40;
  const buttonAppears = 60;
  const logoAppears = 100;
  const urlAppears = 120;

  // Headline with bounce
  const headlineStyle = bounceIn(frame, headlineAppears);

  // Button pulse starts after it appears
  const buttonPulseActive = frame >= buttonAppears + 30;

  return (
    <AbsoluteFill>
      <Background variant="gradient" animated />

      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${THEME.colors.accentLight} 0%, transparent 70%)`,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${THEME.colors.successLight} 0%, transparent 70%)`,
          opacity: 0.3,
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Main headline */}
        <div
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 64,
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 20,
            ...headlineStyle,
          }}
        >
          <span style={{ color: THEME.colors.textPrimary }}>Land Your</span>
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${THEME.colors.accentColor} 0%, ${THEME.colors.success} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Dream Job
          </span>
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 24,
            color: THEME.colors.textSecondary,
            textAlign: 'center',
            marginBottom: 40,
            ...fadeInUp(frame, subheadAppears),
          }}
        >
          Start with <span style={{ fontWeight: 700, color: THEME.colors.success }}>3 free credits</span>
        </div>

        {/* CTA Button */}
        <MockButton
          variant="primary"
          size="lg"
          startFrame={buttonAppears}
          pulsing={buttonPulseActive}
          style={{
            fontSize: 22,
            padding: '20px 48px',
            borderRadius: THEME.radii.xl,
          }}
        >
          Get Started Free
        </MockButton>

        {/* Logo lockup */}
        <div
          style={{
            marginTop: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            ...fadeInUp(frame, logoAppears),
          }}
        >
          <Logo size="md" animated={false} />
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: 20,
            fontFamily: THEME.fonts.mono,
            fontSize: 20,
            fontWeight: 500,
            color: THEME.colors.accentColor,
            letterSpacing: '0.05em',
            ...fadeInUp(frame, urlAppears),
          }}
        >
          resugpt.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
