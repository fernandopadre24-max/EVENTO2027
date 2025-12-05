
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const APP_BG_COLOR_KEY = 'bandmate_app_bg_color_hsl';

// Using HSL strings directly as they are used by the CSS variables.
export const DEFAULT_BG_COLOR_LIGHT = '188 80% 93%';
export const DEFAULT_BG_COLOR_DARK = '210 20% 10%';

const getInitialBackgroundColor = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const storedColor = localStorage.getItem(APP_BG_COLOR_KEY);
      if (storedColor) {
        return storedColor;
      }
      // Check system theme preference for initial default
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return DEFAULT_BG_COLOR_DARK;
      }
    } catch (error) {
       console.warn("Could not read theme from localStorage", error);
    }
  }
  return DEFAULT_BG_COLOR_LIGHT; 
};


interface AppThemeContextType {
  backgroundColor: string; // Stored as HSL string "H S% L%"
  setBackgroundColor: (newColor: string) => void;
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [backgroundColor, setBackgroundColorState] = useState<string>(getInitialBackgroundColor());

  useEffect(() => {
    // This effect runs on client and ensures the value from localStorage is used on first render.
    const storedColor = localStorage.getItem(APP_BG_COLOR_KEY);
    const isDarkMode = document.documentElement.classList.contains('dark');
    const defaultColor = isDarkMode ? DEFAULT_BG_COLOR_DARK : DEFAULT_BG_COLOR_LIGHT;
    
    setBackgroundColorState(storedColor || defaultColor);
  }, []);

  useEffect(() => {
    // This effect applies the color to the CSS variable whenever it changes.
    if (typeof document !== 'undefined') {
       document.documentElement.style.setProperty('--background-raw', backgroundColor);
    }
  }, [backgroundColor]);

  const setBackgroundColor = (newColor: string) => {
    try {
      if(newColor === '') { // Reset to default
        localStorage.removeItem(APP_BG_COLOR_KEY);
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
