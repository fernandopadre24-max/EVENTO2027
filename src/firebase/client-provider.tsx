'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The FirebaseProvider now handles initialization internally.
  // This component's only job is to render the provider on the client.
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
