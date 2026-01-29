import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background';
import { Logo } from '../components/Logo';
import { MockButton } from '../components/MockButton';
import { THEME, VIDEO } from '../lib/theme';
import { fadeInUp, bounceIn } from '../lib/animations';

export const PromoCTAScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Animation phases
  const headlineAppears = 10;
  const promoAppears = 50;
  const buttonAppears = 80;
  const logoAppears = 120;
  const urlAppears = 140;
  const urgencyAppears = 160;

  // Headline with bounce
  const headlineStyle = bounceIn(frame, headlineAppears);

  // Button pulse starts after it appears
  const buttonPulseActive = frame >= buttonAppears + 30;

  // Urgency flash effect
  const urgencyOpacity = frame >= urgencyAppears
    ? interpolate(
        (frame - urgencyAppears) % 60,
        [0, 30, 60],
        [1, 0.7, 1],
        { extrapolateRight: 'clamp' }
      )
    : 0;

  return (
    <AbsoluteFill>
      <Background variant="gradient" animated />

      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '5%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${THEME.colors.accentLight} 0%, transparent 70%)`,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '5%',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${THEME.colors.successLight} 0%, transparent 70%)`,
          opacity: 0.4,
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 50,
        }}
      >
        {/* Main headline */}
        <div
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 58,
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 16,
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

        {/* Promo offer - highlighted */}
        <div
          style={{
            backgroundColor: THEME.colors.warningLight,
            border: `2px solid ${THEME.colors.warning}`,
            borderRadius: THEME.radii.xl,
            padding: '16px 32px',
            marginBottom: 24,
            ...fadeInUp(frame, promoAppears),
          }}
        >
          <div
            style={{
              fontFamily: THEME.fonts.sans,
              fontSize: 26,
              fontWeight: 700,
              color: THEME.colors.textPrimary,
              textAlign: 'center',
            }}
          >
            🎉 First <span style={{ color: THEME.colors.accentColor }}>20 users</span> get
          </div>
          <div
            style={{
              fontFamily: THEME.fonts.sans,
              fontSize: 32,
              fontWeight: 800,
              color: THEME.colors.success,
              textAlign: 'center',
            }}
          >
            50 FREE Credits!
          </div>
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
          Claim Your Spot Now
        </MockButton>

        {/* Urgency text */}
        <div
          style={{
            marginTop: 20,
            fontFamily: THEME.fonts.sans,
            fontSize: 16,
            fontWeight: 600,
            color: THEME.colors.error,
            opacity: urgencyOpacity,
            ...fadeInUp(frame, urgencyAppears),
          }}
        >
          ⚡ Limited Time Offer - Don't Miss Out!
        </div>

        {/* Logo lockup */}
        <div
          style={{
            marginTop: 40,
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
            marginTop: 16,
            fontFamily: THEME.fonts.mono,
            fontSize: 22,
            fontWeight: 600,
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
