import { interpolate, spring, Easing } from 'remotion';
import { VIDEO } from './theme';

// Shared easing curve - matches the existing [0.25, 0.1, 0.25, 1] from framer-motion
const ease: Easing = (t) => {
  // Cubic bezier approximation of [0.25, 0.1, 0.25, 1]
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Fade in with upward movement (matches existing fadeInUp)
export function fadeInUp(
  frame: number,
  startFrame: number,
  durationFrames = 15
) {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  const easedProgress = ease(progress);

  return {
    opacity: easedProgress,
    transform: `translateY(${interpolate(easedProgress, [0, 1], [24, 0])}px)`,
  };
}

// Simple fade in (matches existing fadeIn)
export function fadeIn(
  frame: number,
  startFrame: number,
  durationFrames = 12
) {
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  return { opacity };
}

// Scale in with spring physics (matches existing scaleIn)
export function scaleIn(
  frame: number,
  startFrame: number,
  fps = VIDEO.fps
) {
  // Don't render before start frame
  if (frame < startFrame) {
    return { opacity: 0, transform: 'scale(0.96)' };
  }

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 20, // Higher damping = less overshoot
      stiffness: 180,
      mass: 1,
    },
  });

  // Clamp progress to prevent overshoot twitch
  const clampedProgress = Math.min(progress, 1);
  const scale = interpolate(clampedProgress, [0, 1], [0.96, 1]);

  return {
    opacity: clampedProgress,
    transform: `scale(${scale})`,
  };
}

// Slide in from left (matches existing slideInLeft)
export function slideInLeft(
  frame: number,
  startFrame: number,
  durationFrames = 15
) {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  const easedProgress = ease(progress);

  return {
    opacity: easedProgress,
    transform: `translateX(${interpolate(easedProgress, [0, 1], [-32, 0])}px)`,
  };
}

// Slide in from right (matches existing slideInRight)
export function slideInRight(
  frame: number,
  startFrame: number,
  durationFrames = 15
) {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  const easedProgress = ease(progress);

  return {
    opacity: easedProgress,
    transform: `translateX(${interpolate(easedProgress, [0, 1], [32, 0])}px)`,
  };
}

// Staggered animation helper
export function stagger(
  frame: number,
  startFrame: number,
  index: number,
  staggerDelay = 5 // frames between items
) {
  return fadeInUp(frame, startFrame + index * staggerDelay);
}

// Bounce in animation (for CTA emphasis)
export function bounceIn(
  frame: number,
  startFrame: number,
  fps = VIDEO.fps
) {
  // Don't render before start frame
  if (frame < startFrame) {
    return { opacity: 0, transform: 'scale(0)' };
  }

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 15, // Slightly higher damping for controlled bounce
      stiffness: 250,
      mass: 1,
    },
  });

  // Allow slight overshoot for bounce effect but cap it
  const clampedProgress = Math.min(progress, 1.05);

  return {
    opacity: Math.min(progress, 1),
    transform: `scale(${clampedProgress})`,
  };
}

// Pulse animation for attention
export function pulse(
  frame: number,
  startFrame: number,
  cycleDuration = 45 // frames per pulse cycle
) {
  // Don't pulse before start frame
  if (frame < startFrame) {
    return {};
  }

  const elapsed = frame - startFrame;
  const cycleProgress = (elapsed % cycleDuration) / cycleDuration;
  const pulseValue = Math.sin(cycleProgress * Math.PI * 2) * 0.5 + 0.5;

  return {
    transform: `scale(${1 + pulseValue * 0.015})`, // Subtler pulse
    boxShadow: `0 0 ${15 + pulseValue * 15}px rgba(0, 91, 150, ${0.2 + pulseValue * 0.15})`,
  };
}

// Typewriter effect helper
export function typewriter(
  frame: number,
  startFrame: number,
  text: string,
  charsPerFrame = 0.5
) {
  const elapsed = Math.max(0, frame - startFrame);
  const numChars = Math.min(Math.floor(elapsed * charsPerFrame), text.length);
  return text.substring(0, numChars);
}

// Fade out helper
export function fadeOut(
  frame: number,
  startFrame: number,
  durationFrames = 10
) {
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  return { opacity };
}

// Cross-fade transition between scenes
export function crossFade(
  frame: number,
  sceneEnd: number,
  fadeDuration = 15
) {
  const fadeStart = sceneEnd - fadeDuration;

  if (frame < fadeStart) {
    return { opacity: 1 };
  }

  const opacity = interpolate(
    frame,
    [fadeStart, sceneEnd],
    [1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  return { opacity };
}

// Orbit animation for particles around a center point
export function orbit(
  frame: number,
  startFrame: number,
  index: number,
  radius: number,
  speed = 0.02
) {
  const elapsed = frame - startFrame;
  const angle = (index * (Math.PI * 2 / 8)) + elapsed * speed;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

// Glow pulse for processing animation
export function glowPulse(
  frame: number,
  startFrame: number,
  cycleDuration = 30
) {
  const cycleProgress = ((frame - startFrame) % cycleDuration) / cycleDuration;
  const intensity = Math.sin(cycleProgress * Math.PI * 2) * 0.5 + 0.5;

  return {
    filter: `drop-shadow(0 0 ${10 + intensity * 20}px rgba(0, 91, 150, ${0.5 + intensity * 0.3}))`,
  };
}
