// Design tokens ported from globals.css for Remotion videos
// These match the ResUGPT design system exactly

export const THEME = {
  colors: {
    // Backgrounds
    bgBody: '#ffffff',
    bgCard: '#fafafa',
    bgElevated: '#ffffff',
    bgMuted: '#f5f5f5',

    // Text colors
    textPrimary: '#0a0a0a',
    textSecondary: '#525252',
    textTertiary: '#a3a3a3',
    textInverse: '#ffffff',

    // Border colors
    borderColor: '#e5e5e5',
    borderHover: '#d4d4d4',
    borderFocus: '#005b96',

    // Accent/Brand colors
    accentColor: '#005b96',
    accentHover: '#004578',
    accentLight: '#e8f4fc',
    accentLighter: '#f0f8ff',

    // State colors
    success: '#22c55e',
    successLight: '#dcfce7',
    error: '#ef4444',
    errorLight: '#fef2f2',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.06)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.10)',
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fonts: {
    sans: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'Geist Mono, "SF Mono", Monaco, Consolas, monospace',
  },
} as const;

// Video constants
export const VIDEO = {
  fps: 30,
  durationInFrames: 1350, // 45 seconds
  width: 1080,
  height: 1080,
  wideWidth: 1920,
  wideHeight: 1080,
} as const;

// Scene timing (in frames)
export const SCENES = {
  hook: { start: 0, end: 120, duration: 120 },           // 0-4s
  solution: { start: 120, end: 240, duration: 120 },     // 4-8s
  upload: { start: 240, end: 450, duration: 210 },       // 8-15s
  processing: { start: 450, end: 570, duration: 120 },   // 15-19s
  editor: { start: 570, end: 780, duration: 210 },       // 19-26s
  coverLetter: { start: 780, end: 990, duration: 210 },  // 26-33s
  pricing: { start: 990, end: 1170, duration: 180 },     // 33-39s
  cta: { start: 1170, end: 1350, duration: 180 },        // 39-45s
} as const;

export type SceneName = keyof typeof SCENES;
