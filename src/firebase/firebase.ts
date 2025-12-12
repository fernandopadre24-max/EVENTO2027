
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// This file is kept for compatibility but the initialization logic is now centralized in provider.tsx
// to ensure it runs correctly in both client and server environments within Next.js.
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app as firebaseApp, auth, firestore, storage };
