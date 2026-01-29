import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { Background } from '../components/Background';
import { MockCard } from '../components/MockCard';
import { MockButton } from '../components/MockButton';
import { LightningIcon } from '../components/Icons';
import { THEME, VIDEO } from '../lib/theme';
import { fadeInUp, scaleIn, stagger } from '../lib/animations';

// Tone option pill
const TonePill: React.FC<{
  label: string;
  selected: boolean;
  startFrame: number;
  index: number;
}> = ({ label, selected, startFrame, index }) => {
  const frame = useCurrentFrame();
  const style = stagger(frame, startFrame, index, 4);

  return (
    <div
      style={{
        padding: '8px 16px',
        borderRadius: THEME.radii.full,
        fontFamily: THEME.fonts.sans,
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        backgroundColor: selected ? THEME.colors.accentColor : THEME.colors.bgMuted,
        color: selected ? THEME.colors.textInverse : THEME.colors.textSecondary,
        border: `1px solid ${selected ? THEME.colors.accentColor : THEME.colors.borderColor}`,
        ...style,
      }}
    >
      {label}
    </div>
  );
};

// Mock form field
const FormField: React.FC<{
  label: string;
  value: string;
  startFrame: number;
}> = ({ label, value, startFrame }) => {
  const frame = useCurrentFrame();
  const style = fadeInUp(frame, startFrame);

  return (
    <div style={{ ...style }}>
      <div
        style={{
          fontFamily: THEME.fonts.sans,
          fontSize: 13,
          fontWeight: 500,
          color: THEME.colors.textPrimary,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          padding: '12px 16px',
          borderRadius: THEME.radii.lg,
          border: `1px solid ${THEME.colors.borderColor}`,
          backgroundColor: THEME.colors.bgBody,
          fontFamily: THEME.fonts.sans,
          fontSize: 14,
          color: THEME.colors.textPrimary,
        }}
      >
        {value}
      </div>
    </div>
  );
};

// Cover letter preview
const CoverLetterPreview: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const y = interpolate(
    frame,
    [startFrame, startFrame + 20],
    [30, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        backgroundColor: THEME.colors.bgBody,
        borderRadius: THEME.radii.lg,
        boxShadow: THEME.shadows.lg,
        padding: 24,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      {/* Date */}
      <div
        style={{
          fontFamily: THEME.fonts.sans,
          fontSize: 12,
          color: THEME.colors.textTertiary,
          marginBottom: 16,
        }}
      >
        January 28, 2026
      </div>

      {/* Opening */}
      <div
        style={{
          fontFamily: THEME.fonts.sans,
          fontSize: 14,
          color: THEME.colors.textPrimary,
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        Dear Hiring Manager,
      </div>

      {/* Body paragraphs (mock lines) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ height: 8, width: '100%', backgroundColor: THEME.colors.borderColor, borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 8, width: '95%', backgroundColor: THEME.colors.borderColor, borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 8, width: '88%', backgroundColor: THEME.colors.borderColor, borderRadius: 4, marginBottom: 6 }} />
        <span
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 14,
            fontWeight: 600,
            color: THEME.colors.accentColor,
          }}
        >
          Google
        </span>
        <div style={{ height: 8, width: '70%', backgroundColor: THEME.colors.borderColor, borderRadius: 4, marginTop: 6 }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ height: 8, width: '92%', backgroundColor: THEME.colors.borderColor, borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 8, width: '85%', backgroundColor: THEME.colors.borderColor, borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 8, width: '78%', backgroundColor: THEME.colors.borderColor, borderRadius: 4 }} />
      </div>

      {/* Closing */}
      <div
        style={{
          fontFamily: THEME.fonts.sans,
          fontSize: 14,
          color: THEME.colors.textPrimary,
        }}
      >
        Best regards,
        <br />
        John Doe
      </div>
    </div>
  );
};

export const CoverLetterScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Animation phases
  const showForm = frame >= 0;
  const selectTone = frame >= 60; // Tone gets selected
  const clickGenerate = frame >= 90;
  const showPreview = frame >= 120;

  const tones = ['Professional', 'Formal', 'Confident', 'Enthusiastic', 'Casual'];

  return (
    <AbsoluteFill>
      <Background variant="gradient" animated />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 50,
        }}
      >
        {/* Header */}
        <div
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 36,
            fontWeight: 700,
            color: THEME.colors.textPrimary,
            textAlign: 'center',
            marginBottom: 8,
            ...fadeInUp(frame, 0),
          }}
        >
          Plus:{' '}
          <span
            style={{
              background: `linear-gradient(135deg, ${THEME.colors.accentColor} 0%, ${THEME.colors.accentHover} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Cover Letter Generation
          </span>
        </div>

        <div
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 18,
            color: THEME.colors.textSecondary,
            marginBottom: 30,
            ...fadeInUp(frame, 10),
          }}
        >
          Personalized cover letters in seconds
        </div>

        {/* Split layout */}
        <div
          style={{
            display: 'flex',
            gap: 30,
            width: '100%',
            maxWidth: 900,
          }}
        >
          {/* Left: Form */}
          <MockCard startFrame={20} style={{ flex: 1, padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormField label="Job Title" value="Senior Software Engineer" startFrame={30} />

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <FormField label="Company" value="Google" startFrame={40} />
                </div>
                <div style={{ flex: 1 }}>
                  <FormField label="Location" value="Mountain View, CA" startFrame={45} />
                </div>
              </div>

              {/* Tone selector */}
              <div style={{ ...fadeInUp(frame, 50) }}>
                <div
                  style={{
                    fontFamily: THEME.fonts.sans,
                    fontSize: 13,
                    fontWeight: 500,
                    color: THEME.colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Tone
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {tones.map((tone, i) => (
                    <TonePill
                      key={tone}
                      label={tone}
                      selected={selectTone && tone === 'Confident'}
                      startFrame={55}
                      index={i}
                    />
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <MockButton
                variant="primary"
                size="lg"
                startFrame={70}
                pulsing={clickGenerate && !showPreview}
                icon={<LightningIcon size={18} color={THEME.colors.textInverse} />}
                style={{ marginTop: 8 }}
              >
                {clickGenerate && !showPreview ? 'Generating...' : 'Generate Cover Letter'}
              </MockButton>
            </div>
          </MockCard>

          {/* Right: Preview */}
          <div style={{ flex: 1 }}>
            <CoverLetterPreview startFrame={120} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
