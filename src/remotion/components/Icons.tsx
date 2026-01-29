import React from 'react';
import { THEME } from '../lib/theme';

interface IconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

// Lightning bolt icon (from generate button)
export const LightningIcon: React.FC<IconProps> = ({
  size = 24,
  color = THEME.colors.accentColor,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// Upload cloud icon
export const UploadIcon: React.FC<IconProps> = ({
  size = 24,
  color = THEME.colors.textTertiary,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

// Check icon
export const CheckIcon: React.FC<IconProps> = ({
  size = 24,
  color = THEME.colors.success,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

// X/Close icon
export const XIcon: React.FC<IconProps> = ({
  size = 24,
  color = THEME.colors.textTertiary,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Document icon
export const DocumentIcon: React.FC<IconProps> = ({
  size = 24,
  color = THEME.colors.textSecondary,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// PDF icon
export const PdfIcon: React.FC<IconProps> = ({
  size = 24,
  color = THEME.colors.error,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={style}
  >
    <rect x="3" y="2" width="18" height="20" rx="2" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
    <text x="12" y="14" textAnchor="middle" fontSize="6" fontWeight="700" fill={color}>
      PDF
    </text>
  </svg>
);

// Lock icon
export const LockIcon: React.FC<IconProps> = ({
  size = 24,
  color = THEME.colors.textSecondary,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

// Edit/Pencil icon
export const EditIcon: React.FC<IconProps> = ({
  size = 24,
  color = THEME.colors.textSecondary,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// Star icon
export const StarIcon: React.FC<IconProps> = ({
  size = 24,
  color = THEME.colors.warning,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
