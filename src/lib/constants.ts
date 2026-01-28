// Design tokens for consistent spacing and sizing

export const spacing = {
  // Section padding - generous whitespace
  section: 'py-20 md:py-28 lg:py-32',
  sectionTop: 'pt-20 md:pt-28 lg:pt-32',
  sectionBottom: 'pb-20 md:pb-28 lg:pb-32',

  // Container padding
  container: 'px-4 sm:px-6 lg:px-8',

  // Card padding
  card: 'p-6 md:p-8',
  cardLarge: 'p-8 md:p-10 lg:p-12',

  // Element gaps
  elementGap: 'space-y-4 md:space-y-6',
  gridGap: 'gap-6 md:gap-8',
  gridGapLarge: 'gap-8 md:gap-10 lg:gap-12',
}

export const typography = {
  // Display/Hero text
  hero: 'text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1]',

  // Page titles
  h1: 'text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight',

  // Section titles
  h2: 'text-3xl sm:text-4xl font-semibold tracking-tight leading-tight',

  // Card/component titles
  h3: 'text-xl md:text-2xl font-semibold leading-snug',

  // Subtitles
  subtitle: 'text-lg md:text-xl leading-relaxed',

  // Body text
  body: 'text-base leading-relaxed',

  // Small text
  small: 'text-sm leading-normal',

  // Caption/label text
  caption: 'text-xs font-medium uppercase tracking-wider',
}

export const visual = {
  // Border radius
  radius: {
    sm: 'rounded-lg',      // 8px
    md: 'rounded-xl',      // 12px
    lg: 'rounded-2xl',     // 16px
    xl: 'rounded-3xl',     // 24px
    full: 'rounded-full',
  },

  // Box shadows - very subtle for minimalist look
  shadow: {
    none: 'shadow-none',
    sm: 'shadow-sm',
    card: 'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
    hover: 'shadow-[0_4px_12px_rgba(0,0,0,0.06)]',
    elevated: 'shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
  },

  // Focus ring styles
  focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-body)]',
}

export const containers = {
  // Max widths
  maxWidth: {
    sm: 'max-w-xl',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl',
  },

  // Centered container
  centered: 'mx-auto',
}
