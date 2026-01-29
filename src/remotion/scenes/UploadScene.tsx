import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { Background } from '../components/Background';
import { MockCard } from '../components/MockCard';
import { AnimatedCheck } from '../components/AnimatedCheck';
import { TypewriterText } from '../components/TypewriterText';
import { UploadIcon, PdfIcon } from '../components/Icons';
import { THEME, VIDEO } from '../lib/theme';
import { fadeInUp, scaleIn } from '../lib/animations';

export const UploadScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Animation phases
  const cardAppears = 0;
  const pdfDrops = 30;
  const pdfLands = 60;
  const checkAppears = 70;
  const jobDescStarts = 90;

  // PDF drop animation
  const pdfY = interpolate(
    frame,
    [pdfDrops, pdfLands],
    [-100, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const pdfScale = spring({
    frame: frame - pdfLands,
    fps: VIDEO.fps,
    config: { damping: 15, stiffness: 300 },
  });

  const showPdf = frame >= pdfDrops;
  const pdfLanded = frame >= pdfLands;

  // Upload zone state
  const showUploadZone = frame < pdfLands;
  const showSuccess = frame >= pdfLands;

  return (
    <AbsoluteFill>
      <Background variant="gradient" animated />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Scene title */}
        <div
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 32,
            fontWeight: 600,
            color: THEME.colors.textPrimary,
            marginBottom: 30,
            ...fadeInUp(frame, 0),
          }}
        >
          Upload Your Resume
        </div>

        {/* Form card */}
        <MockCard startFrame={10} style={{ width: 600, padding: 32 }}>
          {/* PDF Upload Zone */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontFamily: THEME.fonts.sans,
                fontSize: 14,
                fontWeight: 500,
                color: THEME.colors.textPrimary,
                marginBottom: 12,
              }}
            >
              Resume (PDF)
            </div>

            {/* Upload zone or success state */}
            {showSuccess ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderRadius: THEME.radii.lg,
                  border: `1px solid ${THEME.colors.success}30`,
                  backgroundColor: THEME.colors.successLight,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: THEME.radii.md,
                      backgroundColor: `${THEME.colors.success}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AnimatedCheck startFrame={checkAppears} size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: THEME.fonts.sans,
                        fontSize: 14,
                        fontWeight: 500,
                        color: THEME.colors.textPrimary,
                      }}
                    >
                      my-resume.pdf
                    </div>
                    <div
                      style={{
                        fontFamily: THEME.fonts.sans,
                        fontSize: 12,
                        color: THEME.colors.success,
                      }}
                    >
                      Ready to process
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  padding: 40,
                  borderRadius: THEME.radii.lg,
                  border: `2px dashed ${THEME.colors.borderColor}`,
                  backgroundColor: THEME.colors.bgMuted,
                  textAlign: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Upload icon */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    margin: '0 auto 12px',
                    borderRadius: THEME.radii.lg,
                    backgroundColor: THEME.colors.bgCard,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UploadIcon size={24} />
                </div>
                <div
                  style={{
                    fontFamily: THEME.fonts.sans,
                    fontSize: 14,
                    fontWeight: 500,
                    color: THEME.colors.textPrimary,
                  }}
                >
                  Drag and drop your resume
                </div>
                <div
                  style={{
                    fontFamily: THEME.fonts.sans,
                    fontSize: 12,
                    color: THEME.colors.textTertiary,
                    marginTop: 4,
                  }}
                >
                  or click to browse (PDF only)
                </div>

                {/* Dropping PDF */}
                {showPdf && !pdfLanded && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: pdfY,
                      transform: 'translateX(-50%)',
                      zIndex: 10,
                    }}
                  >
                    <PdfIcon size={48} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Job Description */}
          <div>
            <div
              style={{
                fontFamily: THEME.fonts.sans,
                fontSize: 14,
                fontWeight: 500,
                color: THEME.colors.textPrimary,
                marginBottom: 12,
              }}
            >
              Job Description
            </div>
            <div
              style={{
                padding: 16,
                borderRadius: THEME.radii.lg,
                border: `1px solid ${THEME.colors.borderColor}`,
                backgroundColor: THEME.colors.bgBody,
                minHeight: 100,
              }}
            >
              {frame >= jobDescStarts && (
                <TypewriterText
                  text="Looking for a Senior Software Engineer with 5+ years of experience in React, TypeScript, and Node.js..."
                  startFrame={jobDescStarts}
                  speed={1.5}
                  style={{
                    fontSize: 14,
                    color: THEME.colors.textPrimary,
                    lineHeight: 1.6,
                  }}
                />
              )}
            </div>
          </div>
        </MockCard>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
