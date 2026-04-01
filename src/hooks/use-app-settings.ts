
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const DEFAULT_APP_NAME = 'BandMate';
const LOCAL_KEY = 'app_display_name';

export function useAppSettings() {
  const firestore = useFirestore();
  const { user } = useUser();

  // Initialize from localStorage for instant load (no flicker)
  const [appName, setAppNameState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_KEY) || DEFAULT_APP_NAME;
    }
    return DEFAULT_APP_NAME;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load from Firestore on mount
  useEffect(() => {
    if (!firestore || !user) return;

    const settingsRef = doc(firestore, 'userSettings', user.uid);
    getDoc(settingsRef)
      .then((snap) => {
        if (snap.exists()) {
          const name = snap.data()?.appName as string | undefined;
          if (name) {
            setAppNameState(name);
            localStorage.setItem(LOCAL_KEY, name);
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [firestore, user]);

  const saveAppName = async (newName: string): Promise<void> => {
    if (!firestore || !user) return;
    const trimmed = newName.trim() || DEFAULT_APP_NAME;
    setIsSaving(true);
    try {
      const settingsRef = doc(firestore, 'userSettings', user.uid);
      await setDoc(settingsRef, { appName: trimmed }, { merge: true });
      setAppNameState(trimmed);
      localStorage.setItem(LOCAL_KEY, trimmed);
    } finally {
      setIsSaving(false);
    }
  };

  return { appName, saveAppName, isLoading, isSaving };
}
