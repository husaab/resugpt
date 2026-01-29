import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Background } from '../components/Background';
import { MockCard } from '../components/MockCard';
import { MockButton } from '../components/MockButton';
import { CheckIcon, XIcon } from '../components/Icons';
import { THEME } from '../lib/theme';
import { fadeInUp, stagger, scaleIn } from '../lib/animations';

// Pricing data matching the real pricing
const PRICING_DATA = [
  {
    name: 'Free',
    price: 'Free',
    period: 'forever',
    description: 'Get started with the basics',
    features: [
      { name: '3 resume credits', included: true },
      { name: '3 cover letter credits', included: true },
      { name: 'Saved resumes', included: true },
      { name: 'Priority support', included: false },
      { name: 'Advanced templates', included: false },
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$4.99',
    period: '/month',
    description: 'For serious job seekers',
    features: [
      { name: '50 credits/month', included: true },
      { name: 'Unlimited cover letters', included: true },
      { name: 'Saved resumes', included: true },
      { name: 'Priority support', included: false },
      { name: 'Advanced templates', included: false },
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '$13.99',
    period: '/month',
    description: 'Maximum power, no limits',
    features: [
      { name: 'Unlimited credits', included: true },
      { name: 'Unlimited cover letters', included: true },
      { name: 'Saved resumes', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced templates', included: true },
    ],
    cta: 'Go Premium',
    highlighted: false,
  },
];

// Feature row
const FeatureRow: React.FC<{
  name: string;
  included: boolean;
  startFrame: number;
  index: number;
}> = ({ name, included, startFrame, index }) => {
  const frame = useCurrentFrame();
  const style = stagger(frame, startFrame, index, 3);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        ...style,
      }}
    >
      {included ? (
        <CheckIcon size={18} color={THEME.colors.success} />
      ) : (
        <XIcon size={18} color={THEME.colors.textTertiary} />
      )}
      <span
        style={{
          fontFamily: THEME.fonts.sans,
          fontSize: 13,
          color: included ? THEME.colors.textPrimary : THEME.colors.textTertiary,
          textDecoration: included ? 'none' : 'line-through',
        }}
      >
        {name}
      </span>
    </div>
  );
};

// Pricing card component
const PricingCard: React.FC<{
  tier: (typeof PRICING_DATA)[0];
  startFrame: number;
  index: number;
}> = ({ tier, startFrame, index }) => {
  const frame = useCurrentFrame();
  const cardDelay = startFrame + index * 10;
  const cardStyle = scaleIn(frame, cardDelay);

  return (
    <div
      style={{
        position: 'relative',
        ...cardStyle,
      }}
    >
      {/* Most Popular badge */}
      {tier.highlighted && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: THEME.colors.accentColor,
            color: THEME.colors.textInverse,
            padding: '4px 12px',
            borderRadius: THEME.radii.full,
            fontFamily: THEME.fonts.sans,
            fontSize: 11,
            fontWeight: 600,
            zIndex: 10,
            ...fadeInUp(frame, cardDelay + 15),
          }}
        >
          Most Popular
        </div>
      )}

      <MockCard
        highlighted={tier.highlighted}
        animated={false}
        style={{
          padding: 24,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: THEME.fonts.sans,
              fontSize: 22,
              fontWeight: 700,
              color: THEME.colors.textPrimary,
              marginBottom: 4,
            }}
          >
            {tier.name}
          </div>
          <div
            style={{
              fontFamily: THEME.fonts.sans,
              fontSize: 13,
              color: THEME.colors.textSecondary,
            }}
          >
            {tier.description}
          </div>
        </div>

        {/* Price */}
        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              fontFamily: THEME.fonts.sans,
              fontSize: 36,
              fontWeight: 700,
              color: THEME.colors.textPrimary,
            }}
          >
            {tier.price}
          </span>
          <span
            style={{
              fontFamily: THEME.fonts.sans,
              fontSize: 14,
              color: THEME.colors.textTertiary,
            }}
          >
            {tier.period}
          </span>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {tier.features.map((feature, i) => (
            <FeatureRow
              key={feature.name}
              name={feature.name}
              included={feature.included}
              startFrame={cardDelay + 20}
              index={i}
            />
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 20 }}>
          <MockButton
            variant={tier.highlighted ? 'primary' : 'secondary'}
            size="md"
            startFrame={cardDelay + 40}
            style={{ width: '100%' }}
          >
            {tier.cta}
          </MockButton>
        </div>
      </MockCard>
    </div>
  );
};

export const PricingScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Background variant="gradient" animated />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
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
          Simple, Transparent Pricing
        </div>

        <div
          style={{
            fontFamily: THEME.fonts.sans,
            fontSize: 18,
            color: THEME.colors.textSecondary,
            marginBottom: 40,
            ...fadeInUp(frame, 10),
          }}
        >
          Start free, upgrade when you're ready
        </div>

        {/* Pricing cards */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
          }}
        >
          {PRICING_DATA.map((tier, i) => (
            <div key={tier.name} style={{ width: 280 }}>
              <PricingCard tier={tier} startFrame={20} index={i} />
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
