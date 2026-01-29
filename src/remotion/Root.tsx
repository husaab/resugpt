import React from 'react';
import { Composition } from 'remotion';
import { LinkedInVideo } from './compositions/LinkedInVideo';
import { WideVideo } from './compositions/WideVideo';
import { LinkedInPromotionalVideo, PROMO_DURATION_IN_FRAMES } from './compositions/LinkedInPromotionalVideo';
import { VIDEO } from './lib/theme';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Square format for LinkedIn feed (45s with pricing) */}
      <Composition
        id="LinkedInVideo"
        component={LinkedInVideo}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />

      {/* Wide format for LinkedIn video ads (45s with pricing) */}
      <Composition
        id="WideVideo"
        component={WideVideo}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.wideWidth}
        height={VIDEO.wideHeight}
      />

      {/* Promotional video - no pricing, special CTA (39s) */}
      <Composition
        id="LinkedInPromotionalVideo"
        component={LinkedInPromotionalVideo}
        durationInFrames={PROMO_DURATION_IN_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};
