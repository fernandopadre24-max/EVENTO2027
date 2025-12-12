
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, getApps, initializeApp, getApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize Firebase App (Singleton Pattern)
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Interfaces
export interface FirebaseServices {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

export interface FirebaseContextState {
  services: FirebaseServices;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// The one and only provider
export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth, 
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsUserLoading(false);
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const contextValue = useMemo((): FirebaseContextState => ({
    services: { app, firestore, auth, storage },
    user,
    isUserLoading,
    userError,
  }), [user, isUserLoading, userError]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};


// Hooks
const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = (): Auth => useFirebase().services.auth;
export const useFirestore = (): Firestore => useFirebase().services.firestore;
export const useFirebaseApp = (): FirebaseApp => useFirebase().services.app;
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

// Memoization Helper
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}
