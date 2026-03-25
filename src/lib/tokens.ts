/**
 * Design tokens — spacing, colors, typography.
 * Use these constants throughout UI components to keep the design consistent.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const colors = {
  // Brand
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  accent: '#F59E0B',

  // Surfaces
  background: '#F7F7FA',
  surface: '#FFFFFF',
  border: '#E5E7EB',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Platform brand tints (advisory only)
  doordash: '#FF3008',
  ubereats: '#06C167',
  grubhub: '#F63440',
} as const;

export const typography = {
  fontSizeXs: 11,
  fontSizeSm: 13,
  fontSizeMd: 15,
  fontSizeLg: 18,
  fontSizeXl: 22,
  fontSizeDisplay: 28,

  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemibold: '600' as const,
  fontWeightBold: '700' as const,

  lineHeightBase: 1.5,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
