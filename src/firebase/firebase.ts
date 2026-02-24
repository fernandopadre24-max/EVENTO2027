import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Singleton initialization for Firebase.
 * Robust check to handle Next.js build process and Vercel environment.
 */
const isConfigValid = !!(
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.startsWith("AIza") &&
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "placeholder-id"
);

// Fallback config for static build processes where env vars might be missing
const fallbackConfig = {
  apiKey: "dummy-api-key-for-build",
  authDomain: "dummy.firebaseapp.com",
  projectId: "dummy-project-id",
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