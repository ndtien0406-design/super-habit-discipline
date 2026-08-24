export const THEME = {
  colors: {
    bg: '#0A0D14',
    bgLight: '#0F141E',
    surface: '#141A26',
    surfaceSubtle: '#1A2234',
    surfaceBorder: '#232E44',
    surfaceBorderActive: '#3B82F6',
    
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    
    // Status colors
    primary: '#6366F1',
    primaryGlow: 'rgba(99, 102, 241, 0.3)',
    
    success: '#10B981',
    successGlow: 'rgba(16, 185, 129, 0.25)',
    
    warning: '#F59E0B',
    warningGlow: 'rgba(245, 158, 11, 0.25)',
    
    danger: '#EF4444',
    dangerGlow: 'rgba(239, 68, 68, 0.25)',
    
    freeze: '#06B6D4',
    freezeGlow: 'rgba(6, 182, 212, 0.3)',
    
    milestone: '#A855F7',
    milestoneGlow: 'rgba(168, 85, 247, 0.3)',

    // Gradients
    cardGradient: ['#171F2E', '#101520'],
    cardGlowBuild: ['#10B98120', '#10B98105'],
    cardGlowQuit: ['#F59E0B20', '#F59E0B05'],
    streakFlame: ['#FF7A00', '#FF0055'],
    freezeGradient: ['#06B6D4', '#3B82F6'],
  },

  habitColorPresets: [
    { name: 'Indigo Fire', hex: '#6366F1' },
    { name: 'Emerald Focus', hex: '#10B981' },
    { name: 'Amber Grit', hex: '#F59E0B' },
    { name: 'Crimson Will', hex: '#EF4444' },
    { name: 'Cyber Purple', hex: '#8B5CF6' },
    { name: 'Glacier Cyan', hex: '#06B6D4' },
    { name: 'Neon Rose', hex: '#EC4899' },
    { name: 'Teal Discipline', hex: '#14B8A6' },
  ],

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },

  typography: {
    hero: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
    title1: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
    title2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
    title3: { fontSize: 17, fontWeight: '600' },
    body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
    bodyBold: { fontSize: 15, fontWeight: '600' },
    caption: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
    small: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  }
};
