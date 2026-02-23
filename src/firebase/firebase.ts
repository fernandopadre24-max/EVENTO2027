import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Singleton initialization for Firebase.
 * Robust check to handle Next.js hot-reloading and build process.
 * Verifies if config is present to avoid app/no-options error on Vercel.
 */
const isConfigValid = firebaseConfig && firebaseConfig.projectId && firebaseConfig.projectId !== "";

const app: FirebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(isConfigValid ? firebaseConfig : {
      apiKey: "placeholder",
      authDomain: "placeholder",
      projectId: "placeholder-id",
      storageBucket: "placeholder",
      messagingSenderId: "placeholder",
      appId: "placeholder"
    });

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app as firebaseApp, auth, firestore, storage };