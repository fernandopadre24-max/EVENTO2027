import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Singleton initialization for Firebase.
 * Robust check to handle Next.js build process and Vercel environment.
 * Provides a fallback config to prevent 'app/no-options' errors during static generation.
 */
const isConfigValid = !!(firebaseConfig && firebaseConfig.projectId && firebaseConfig.projectId !== "placeholder-id");

const fallbackConfig = {
  apiKey: "dummy-key",
  authDomain: "dummy.firebaseapp.com",
  projectId: "dummy-id",
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:dummy"
};

const app: FirebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(isConfigValid ? firebaseConfig : fallbackConfig);

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app as firebaseApp, auth, firestore, storage };