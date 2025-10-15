
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const APP_TITLE_KEY = 'bandmate_app_title';
const DEFAULT_TITLE = 'BandMate';

interface AppTitleContextType {
  title: string;
  setTitle: (newTitle: string) => void;
}

const AppTitleContext = createContext<AppTitleContextType | undefined>(undefined);

export function AppTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState<string>(DEFAULT_TITLE);

  useEffect(() => {
    try {
      const storedTitle = localStorage.getItem(APP_TITLE_KEY);
      if (storedTitle) {
        setTitleState(storedTitle);
      }
    } catch (error) {
      console.warn("Could not read app title from localStorage:", error);
    }
  }, []);

  const setTitle = (newTitle: string) => {
    try {
      localStorage.setItem(APP_TITLE_KEY, newTitle);
      setTitleState(newTitle);
    } catch (error) {
      console.warn("Could not save app title to localStorage:", error);
    }
  };

  return (
    <AppTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </AppTitleContext.Provider>
  );
}

export function useAppTitle() {
  const context = useContext(AppTitleContext);
  if (context === undefined) {
    throw new Error('useAppTitle must be used within an AppTitleProvider');
  }
  return context;
}
