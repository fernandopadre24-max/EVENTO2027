
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Inicialização segura do Firebase para ambientes de build (Vercel/CI).
 * Garante que o app sempre receba uma configuração válida para evitar o erro app/no-options.
 */
const isConfigValid = !!(
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "placeholder-id"
);

// Configuração de fallback para evitar erros fatais durante o build estático
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
