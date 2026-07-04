// ─── Design Tokens ───────────────────────────────────────────────────────────
// Single source of truth. No hardcoded hex or magic numbers in screens.

// ─── Spacing (4pt grid) ──────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  screen: 20,
} as const;

export type SpacingKey = keyof typeof spacing;

// ─── Border Radii ─────────────────────────────────────────────────────────────
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radii;

// ─── Typography Scale ─────────────────────────────────────────────────────────
// fontFamily strings match the exact keys passed to useFonts()
export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  h2: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
} as const;

export type TypographyVariant = keyof typeof typography;

// ─── Shadows (cross-platform) ─────────────────────────────────────────────────
// iOS reads shadow*, Android reads elevation. Both keys co-exist safely.
export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export type ShadowKey = keyof typeof shadows;

// ─── Color Palettes ───────────────────────────────────────────────────────────
const lightColors = {
  // Backgrounds
  bg: '#FFFFFF',
  surface: '#F7F8FA',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  // Borders
  border: '#E9ECF2',
  borderStrong: '#D8DEE9',

  // Brand
  primary: '#6D5AE6',
  primaryPressed: '#5B48D6',
  primarySoft: '#EEEBFB',
  onPrimary: '#FFFFFF',

  // Semantic
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  error: '#EF4444',
  errorSoft: '#FEE2E2',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  shimmerBase: '#E9ECF2',
  shimmerHighlight: '#F7F8FA',
} as const;

const darkColors = {
  // Backgrounds
  bg: '#0B0F1A',
  surface: '#121826',
  surfaceElevated: '#1A2234',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',

  // Borders
  border: '#232B3D',
  borderStrong: '#313B52',

  // Brand
  primary: '#8B7BF0',
  primaryPressed: '#7A68E8',
  primarySoft: '#221E3D',
  onPrimary: '#FFFFFF',

  // Semantic
  success: '#34D399',
  successSoft: '#064E3B',
  warning: '#FBBF24',
  warningSoft: '#451A03',
  error: '#F87171',
  errorSoft: '#450A0A',
  info: '#60A5FA',
  infoSoft: '#1E3A5F',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  shimmerBase: '#1A2234',
  shimmerHighlight: '#232B3D',
} as const;

export type ColorKey = keyof typeof lightColors;

// ─── Theme Objects ────────────────────────────────────────────────────────────
export const lightTheme = {
  dark: false,
  colors: lightColors,
  spacing,
  radii,
  typography,
  shadows,
} as const;

export const darkTheme = {
  dark: true,
  colors: darkColors,
  spacing,
  radii,
  typography,
  shadows,
} as const;

export type Theme = typeof lightTheme | typeof darkTheme;
