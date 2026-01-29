import React from 'react';
import { useCurrentFrame, interpolate, spring } from 'remotion';
import { THEME, VIDEO } from '../lib/theme';

interface AnimatedCheckProps {
  startFrame: number;
  size?: number;
  color?: string;
}

export const AnimatedCheck: React.FC<AnimatedCheckProps> = ({
  startFrame,
  size = 24,
  color = THEME.colors.success,
}) => {
  const frame = useCurrentFrame();

  // Circle scale animation
  const circleScale = spring({
    frame: frame - startFrame,
    fps: VIDEO.fps,
    config: { damping: 12, stiffness: 200 },
  });

  // Checkmark draw animation (delayed)
  const checkProgress = interpolate(
    frame,
    [startFrame + 8, startFrame + 18],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Path length for the checkmark stroke animation
  const pathLength = 24;
  const strokeDashoffset = pathLength * (1 - checkProgress);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        transform: `scale(${circleScale})`,
        opacity: Math.min(circleScale, 1),
      }}
    >
      {/* Background circle */}
      <circle
        cx="12"
        cy="12"
        r="11"
        fill={`${color}20`}
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Checkmark */}
      <path
        d="M7 12l3 3 7-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset,
        }}
      />
    </svg>
  );
};
