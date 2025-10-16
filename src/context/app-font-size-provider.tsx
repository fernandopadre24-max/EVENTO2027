
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const APP_FONT_SIZE_KEY = 'bandmate_app_font_size';
export const DEFAULT_FONT_SIZE = 100; // in percent

const getInitialFontSize = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const storedSize = localStorage.getItem(APP_FONT_SIZE_KEY);
      if (storedSize) {
        return parseInt(storedSize, 10);
      }
    } catch (error) {
       console.warn("Could not read font size from localStorage", error);
    }
  }
  return DEFAULT_FONT_SIZE;
};

interface AppFontSizeContextType {
  fontSize: number; // in percent
  setFontSize: (newSize: number) => void;
}

const AppFontSizeContext = createContext<AppFontSizeContextType | undefined>(undefined);

export function AppFontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<number>(getInitialFontSize());

  useEffect(() => {
    if (typeof document !== 'undefined') {
       document.documentElement.style.fontSize = `${fontSize}%`;
    }
  }, [fontSize]);

  const setFontSize = (newSize: number) => {
    try {
      if (newSize) {
        localStorage.setItem(APP_FONT_SIZE_KEY, newSize.toString());
        setFontSizeState(newSize);
      } else {
        // This case can be used to reset
        localStorage.removeItem(APP_FONT_SIZE_KEY);
        setFontSizeState(DEFAULT_FONT_SIZE);
      }
    } catch (error) {
      console.warn("Could not save font size to localStorage:", error);
    }
  };

  return (
    <AppFontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </AppFontSizeContext.Provider>
  );
}

export function useAppFontSize() {
  const context = useContext(AppFontSizeContext);
  if (context === undefined) {
    throw new Error('useAppFontSize must be used within an AppFontSizeProvider');
  }
  return context;
}
