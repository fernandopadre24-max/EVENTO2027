
'use client';

import React, { type ReactNode, useMemo } from 'react';
import { FirebaseProvider, type FirebaseServices } from '@/firebase/provider';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// A single function to initialize Firebase
function getFirebaseServices(): FirebaseServices {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
  };
}


export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Initialize Firebase services only once, right here.
  const services = useMemo(() => getFirebaseServices(), []);

  return (
    <FirebaseProvider services={services}>
      {children}
    </FirebaseProvider>
  );
}
