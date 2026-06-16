import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, TwitterAuthProvider } from 'firebase/auth';

// Firebase configuration - uses Vite environment variables (import.meta.env)
// Set these in your .env file with the VITE_ prefix
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "trashmarket.fun",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trashmarket-fun",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "trashmarket-fun.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Resilient init: without a valid VITE_FIREBASE_API_KEY, getAuth() throws
// "auth/invalid-api-key" synchronously — which would blank the entire page
// (this is what was breaking the game pages). Guard each service so the app
// (and the games) always render; Firebase-backed features (leaderboards,
// Twitter login) simply stay inert until the VITE_FIREBASE_* vars are set.
function safeInit<T>(fn: () => T, label: string): T | null {
  try {
    return fn();
  } catch (e) {
    console.warn(`[firebase] ${label} unavailable:`, (e as Error)?.message);
    return null;
  }
}

export const db = safeInit(() => getFirestore(app), 'firestore') as ReturnType<typeof getFirestore>;
export const storage = safeInit(() => getStorage(app), 'storage') as ReturnType<typeof getStorage>;
export const auth = safeInit(() => getAuth(app), 'auth') as ReturnType<typeof getAuth>;
export const twitterProvider = safeInit(() => new TwitterAuthProvider(), 'twitter') as TwitterAuthProvider;

export default app;
