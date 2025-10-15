
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const APP_BG_COLOR_KEY = 'bandmate_app_bg_color';

export const DEFAULT_BG_COLOR_LIGHT = '#f0f7f7';
export const DEFAULT_BG_COLOR_DARK = '#1a202c';


// Function to convert hex to HSL string format "H S% L%"
const hexToHslString = (hex: string): string | null => {
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return null;
  }

  let r: number, g: number, b: number;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
};


const getInitialBackgroundColor = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const storedColor = localStorage.getItem(APP_BG_COLOR_KEY);
      if (storedColor) {
        return storedColor;
      }
    } catch (error) {
       console.warn("Could not read theme from localStorage", error);
    }
  }
  // Check system theme preference for initial default
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return DEFAULT_BG_COLOR_DARK;
  }
  return DEFAULT_BG_COLOR_LIGHT; 
};

const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}


interface AppThemeContextType {
  backgroundColor: string; // Stored as hex
  setBackgroundColor: (newColor: string) => void;
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [backgroundColor, setBackgroundColorState] = useState<string>(getInitialBackgroundColor());

  useEffect(() => {
    try {
      const storedColor = localStorage.getItem(APP_BG_COLOR_KEY);
      if (storedColor && storedColor !== backgroundColor) {
        setBackgroundColorState(storedColor);
      }
    } catch (error) {
      console.warn("Could not read app background color from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
       const hslColor = hexToHslString(backgroundColor);
       if(hslColor) {
         document.documentElement.style.setProperty('--background', hslColor);
       }
    }
  }, [backgroundColor]);

  const setBackgroundColor = (newColor: string) => {
    try {
      if(newColor === '') {
        localStorage.removeItem(APP_BG_COLOR_KEY);
        // Re-evaluate default based on current theme
        const isDarkMode = document.documentElement.classList.contains('dark');
        setBackgroundColorState(isDarkMode ? DEFAULT_BG_COLOR_DARK : DEFAULT_BG_COLOR_LIGHT);
      } else {
        localStorage.setItem(APP_BG_COLOR_KEY, newColor);
        setBackgroundColorState(newColor);
      }
    } catch (error) {
      console.warn("Could not save app background color to localStorage:", error);
    }
  };

  return (
    <AppThemeContext.Provider value={{ backgroundColor, setBackgroundColor }}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
}
