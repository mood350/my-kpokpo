/**
 * Palette MyKpokpo — alignée sur frontend_web/globals.css
 * Light : crème chaud + or              · Dark : noir + or pâle
 */

export const Colors = {
  light: {
    bgBase:           '#FAFAF8',
    bgSurface:        '#FFFFFF',
    bgElevated:       '#F4F3F0',
    border:           '#E8E6E1',
    accent:           '#A8823E',
    accentMuted:      'rgba(168,130,62,0.10)',
    accentHover:      'rgba(168,130,62,0.18)',
    text:             '#1A1A1A',
    textSecondary:    '#6B6B6B',
    textMuted:        '#ADADAD',
    success:          '#2D7A5A',
    warning:          '#B87B1A',
    danger:           '#B83035',
    successMuted:     'rgba(45,122,90,0.10)',
    warningMuted:     'rgba(184,123,26,0.10)',
    dangerMuted:      'rgba(184,48,53,0.10)',
  },
  dark: {
    bgBase:           '#0F0F0F',
    bgSurface:        '#161616',
    bgElevated:       '#1E1E1E',
    border:           '#2A2A2A',
    accent:           '#C8A96E',
    accentMuted:      'rgba(200,169,110,0.12)',
    accentHover:      'rgba(200,169,110,0.20)',
    text:             '#F2F2F2',
    textSecondary:    '#7A7A7A',
    textMuted:        '#4A4A4A',
    success:          '#3D9970',
    warning:          '#E8A838',
    danger:           '#D64045',
    successMuted:     'rgba(61,153,112,0.12)',
    warningMuted:     'rgba(232,168,56,0.12)',
    dangerMuted:      'rgba(214,64,69,0.12)',
  },
} as const

export type ColorScheme = keyof typeof Colors
export type ColorKey    = keyof typeof Colors.light

export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  pill: 999,
} as const

/**
 * Noms exposés par les paquets @expo-google-fonts/fraunces et /dm-sans.
 * Fraunces est notre display italique (titres), DM Sans le corps.
 */
export const Fonts = {
  displayItalic: 'Fraunces_400Regular_Italic',
  displayBold:   'Fraunces_500Medium_Italic',
  body:          'DMSans_400Regular',
  bodyMedium:    'DMSans_500Medium',
  bodySemibold:  'DMSans_600SemiBold',
  bodyBold:      'DMSans_700Bold',
} as const
