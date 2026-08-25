import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

const lightColors = {
  // Backgrounds
  bg: '#FFF7E9',         // Daylight beige
  bgLight: '#FFFFFF',    // White for layers
  surface: '#FFFFFF',
  surfaceSubtle: 'rgba(76, 40, 6, 0.03)',
  surfaceBorder: 'rgba(76, 40, 6, 0.15)', // Reduced border opacity
  surfaceBorderActive: 'rgba(76, 40, 6, 0.35)',
  
  // Text
  textPrimary: '#4C2806', // Daylight dark brown
  textSecondary: 'rgba(76, 40, 6, 0.75)',
  textMuted: 'rgba(76, 40, 6, 0.45)',
  
  // Status/Accent colors
  primary: '#F66F00', // Daylight orange
  primaryGlow: 'rgba(246, 111, 0, 0.2)',
  
  success: '#34A853',
  successGlow: 'rgba(52, 168, 83, 0.2)',
  
  warning: '#FCCC3C', // Daylight yellow
  warningGlow: 'rgba(252, 204, 60, 0.25)',
  
  danger: '#D32F2F', 
  dangerGlow: 'rgba(211, 47, 47, 0.25)',
  
  freeze: '#4DA2FF', 
  freezeGlow: 'rgba(77, 162, 255, 0.3)',
  
  milestone: '#FCCC3C',
  milestoneGlow: 'rgba(252, 204, 60, 0.3)',

  // Gradients
  cardGradient: ['#FFFFFF', '#FFFFFF'],
  cardGlowBuild: ['rgba(246, 111, 0, 0.1)', 'rgba(246, 111, 0, 0)'],
  cardGlowQuit: ['rgba(252, 204, 60, 0.1)', 'rgba(252, 204, 60, 0)'],
  streakFlame: ['#FCCC3C', '#F66F00'],
  freezeGradient: ['#4DA2FF', '#4DA2FF'],
};

const darkColors = {
  // Backgrounds
  bg: '#1A0E02',         // Very dark brown
  bgLight: '#2A1604',    
  surface: '#2A1604',
  surfaceSubtle: 'rgba(255, 247, 233, 0.05)',
  surfaceBorder: 'rgba(255, 247, 233, 0.15)',
  surfaceBorderActive: 'rgba(255, 247, 233, 0.35)',
  
  // Text
  textPrimary: '#FFF7E9', // Daylight beige
  textSecondary: 'rgba(255, 247, 233, 0.75)',
  textMuted: 'rgba(255, 247, 233, 0.45)',
  
  // Status/Accent colors
  primary: '#F66F00', 
  primaryGlow: 'rgba(246, 111, 0, 0.3)',
  
  success: '#34A853',
  successGlow: 'rgba(52, 168, 83, 0.3)',
  
  warning: '#FCCC3C', 
  warningGlow: 'rgba(252, 204, 60, 0.3)',
  
  danger: '#EF5350', 
  dangerGlow: 'rgba(239, 83, 80, 0.3)',
  
  freeze: '#64B5F6', 
  freezeGlow: 'rgba(100, 181, 246, 0.3)',
  
  milestone: '#FCCC3C',
  milestoneGlow: 'rgba(252, 204, 60, 0.4)',

  // Gradients
  cardGradient: ['#2A1604', '#2A1604'],
  cardGlowBuild: ['rgba(246, 111, 0, 0.15)', 'rgba(246, 111, 0, 0)'],
  cardGlowQuit: ['rgba(252, 204, 60, 0.15)', 'rgba(252, 204, 60, 0)'],
  streakFlame: ['#FCCC3C', '#F66F00'],
  freezeGradient: ['#64B5F6', '#64B5F6'],
};

export const THEME = {
  // `colors` will be injected dynamically, this is just a fallback structure
  colors: lightColors, 

  habitColorPresets: [
    { name: 'Orange', hex: '#F66F00' },
    { name: 'Yellow', hex: '#FCCC3C' },
    { name: 'Forest', hex: '#34A853' },
    { name: 'Sky', hex: '#4DA2FF' },
    { name: 'Brown', hex: '#4C2806' },
    { name: 'Red', hex: '#D32F2F' },
    { name: 'Teal', hex: '#008080' },
    { name: 'Slate', hex: '#708090' },
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
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  typography: {
    hero: { fontSize: 36, fontFamily: 'Georgia', letterSpacing: -1 },
    title1: { fontSize: 24, fontFamily: 'Georgia', letterSpacing: -0.5 },
    title2: { fontSize: 20, fontFamily: 'Georgia', letterSpacing: -0.3 },
    title3: { fontSize: 17, fontFamily: 'Helvetica', fontWeight: 'bold' },
    body: { fontSize: 15, fontFamily: 'Helvetica', lineHeight: 22 },
    bodyBold: { fontSize: 15, fontFamily: 'Helvetica', fontWeight: 'bold' },
    caption: { fontSize: 13, fontFamily: 'Helvetica' },
    small: { fontSize: 11, fontFamily: 'Courier', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '600' },
  }
};

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  THEME: THEME,
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';

  const currentColors = isDark ? darkColors : lightColors;
  
  // Inject colors into THEME so standard imports can still get metrics (spacing, radius, typography)
  // Components should use the hook for reactive colors.
  const currentTheme = {
    ...THEME,
    colors: currentColors,
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: currentColors, THEME: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
