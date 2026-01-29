import React from 'react';
import { useCurrentFrame } from 'remotion';
import { typewriter } from '../lib/animations';
import { THEME } from '../lib/theme';

interface TypewriterTextProps {
  text: string;
  startFrame: number;
  speed?: number;
  style?: React.CSSProperties;
  showCursor?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame,
  speed = 0.5,
  style,
  showCursor = true,
}) => {
  const frame = useCurrentFrame();
  const displayedText = typewriter(frame, startFrame, text, speed);
  const isTyping = displayedText.length < text.length && frame >= startFrame;

  return (
    <span
      style={{
        fontFamily: THEME.fonts.sans,
        ...style,
      }}
    >
      {displayedText}
      {showCursor && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            backgroundColor: isTyping ? THEME.colors.accentColor : 'transparent',
            marginLeft: 2,
            animation: 'blink 1s step-end infinite',
            verticalAlign: 'text-bottom',
          }}
        />
      )}
    </span>
  );
};
