'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'green' | 'rose' | 'amber' | 'violet';

interface ThemeContextType {
  mode: ThemeMode;
  accentColor: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<AccentColor>('blue');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
    const savedColor = localStorage.getItem('theme-accent') as AccentColor | null;

    if (savedMode) setModeState(savedMode);
    if (savedColor) setAccentColorState(savedColor);

    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (theme: 'light' | 'dark') => {
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }

      root.style.colorScheme = theme;
    };

    // Handle dark mode
    const updateTheme = () => {
      if (mode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(isDark ? 'dark' : 'light');
      } else if (mode === 'dark') {
        applyTheme('dark');
      } else {
        applyTheme('light');
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  useEffect(() => {
    // Handle accent color
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove('theme-blue', 'theme-green', 'theme-rose', 'theme-amber', 'theme-violet');

    // Add the selected theme class (skip for blue as it's the default)
    if (accentColor !== 'blue') {
      root.classList.add(`theme-${accentColor}`);
    }
  }, [accentColor]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem('theme-accent', color);
  };

  return (
    <ThemeContext.Provider value={{ mode, accentColor, setMode, setAccentColor, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
