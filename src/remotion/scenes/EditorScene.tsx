import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { Background } from '../components/Background';
import { MockCard } from '../components/MockCard';
import { THEME, VIDEO } from '../lib/theme';
import { fadeInUp, slideInLeft, slideInRight, scaleIn } from '../lib/animations';

// Mock accordion section
const AccordionSection: React.FC<{
  title: string;
  startFrame: number;
  index: number;
  expanded?: boolean;
}> = ({ title, startFrame, index, expanded = false }) => {
  const frame = useCurrentFrame();
  const sectionStyle = fadeInUp(frame, startFrame + index * 8);

  return (
    <div
      style={{
        borderRadius: THEME.radii.md,
        border: `1px solid ${THEME.colors.borderColor}`,
        backgroundColor: THEME.colors.bgBody,
        marginBottom: 8,
        overflow: 'hidden',
        ...sectionStyle,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: expanded ? THEME.colors.bgMuted : 'transparent',
        }}
      >
        <span
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 13,
            fontWeight: 600,
            color: THEME.colors.textPrimary,
          }}
        >
          {title}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={THEME.colors.textTertiary}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Content preview */}
      {expanded && (
        <div style={{ padding: '8px 16px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 8, width: '90%', backgroundColor: THEME.colors.bgMuted, borderRadius: 4 }} />
            <div style={{ height: 8, width: '75%', backgroundColor: THEME.colors.bgMuted, borderRadius: 4 }} />
            <div style={{ height: 8, width: '85%', backgroundColor: THEME.colors.bgMuted, borderRadius: 4 }} />
          </div>
        </div>
      )}
    </div>
  );
};

// Mock PDF preview
const PdfPreview: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const style = slideInRight(frame, startFrame, 20);

  return (
    <div
      style={{
        backgroundColor: THEME.colors.bgBody,
        borderRadius: THEME.radii.lg,
        boxShadow: THEME.shadows.xl,
        padding: 24,
        height: 400,
        ...style,
      }}
    >
      {/* PDF header */}
      <div
        style={{
          height: 20,
          width: '60%',
          backgroundColor: THEME.colors.textPrimary,
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 12,
          width: '40%',
          backgroundColor: THEME.colors.textSecondary,
          borderRadius: 4,
          marginBottom: 20,
          opacity: 0.5,
        }}
      />

      {/* Contact line */}
      <div
        style={{
          height: 8,
          width: '80%',
          backgroundColor: THEME.colors.textTertiary,
          borderRadius: 4,
          marginBottom: 20,
          opacity: 0.3,
        }}
      />

      {/* Section headers and content */}
      {['Experience', 'Education', 'Skills'].map((_, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div
            style={{
              height: 12,
              width: '30%',
              backgroundColor: THEME.colors.accentColor,
              borderRadius: 4,
              marginBottom: 10,
              opacity: 0.8,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
            <div style={{ height: 6, width: '95%', backgroundColor: THEME.colors.borderColor, borderRadius: 3 }} />
            <div style={{ height: 6, width: '85%', backgroundColor: THEME.colors.borderColor, borderRadius: 3 }} />
            <div style={{ height: 6, width: '90%', backgroundColor: THEME.colors.borderColor, borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const EditorScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Mode toggle animation
  const toggleProgress = interpolate(
    frame,
    [100, 130],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const isAdvancedMode = toggleProgress > 0.5;

  return (
    <AbsoluteFill>
      <Background variant="gradient" animated />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 40,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            ...fadeInUp(frame, 0),
          }}
        >
          <div
            style={{
              fontFamily: THEME.fonts.sans,
              fontSize: 28,
              fontWeight: 600,
              color: THEME.colors.textPrimary,
            }}
          >
            Edit Your Tailored Resume
          </div>

          {/* Mode toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 16px',
              backgroundColor: THEME.colors.bgCard,
              borderRadius: THEME.radii.full,
              border: `1px solid ${THEME.colors.borderColor}`,
            }}
          >
            <span
              style={{
                fontFamily: THEME.fonts.sans,
                fontSize: 13,
                fontWeight: isAdvancedMode ? 400 : 600,
                color: isAdvancedMode ? THEME.colors.textTertiary : THEME.colors.accentColor,
              }}
            >
              Structured
            </span>
            <div
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                backgroundColor: THEME.colors.accentColor,
                padding: 2,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: THEME.colors.textInverse,
                  transform: `translateX(${toggleProgress * 18}px)`,
                  transition: 'transform 0.2s',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: THEME.fonts.sans,
                fontSize: 13,
                fontWeight: isAdvancedMode ? 600 : 400,
                color: isAdvancedMode ? THEME.colors.accentColor : THEME.colors.textTertiary,
              }}
            >
              Advanced
            </span>
          </div>
        </div>

        {/* Split screen */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            flex: 1,
          }}
        >
          {/* Left: Editor */}
          <div style={{ flex: 1, ...slideInLeft(frame, 15, 20) }}>
            <MockCard style={{ padding: 20, height: '100%' }}>
              <AccordionSection title="Personal Information" startFrame={30} index={0} expanded />
              <AccordionSection title="Professional Summary" startFrame={30} index={1} />
              <AccordionSection title="Work Experience" startFrame={30} index={2} />
              <AccordionSection title="Education" startFrame={30} index={3} />
              <AccordionSection title="Skills" startFrame={30} index={4} />
            </MockCard>
          </div>

          {/* Right: PDF Preview */}
          <div style={{ flex: 1 }}>
            <PdfPreview startFrame={25} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
