// frontend/src/firebase.js
// Firebase configuration for client-side

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// REPLACE these values with your actual Firebase config
// You can find this in Firebase Console > Project Settings > Your apps
const firebaseConfig = {
   apiKey: "AIzaSyAnJpA2Kn94CdR7q8I4PyusvAHM6Utwujk",
  authDomain: "study-buddy-f80fe.firebaseapp.com",
  projectId: "study-buddy-f80fe",
  storageBucket: "study-buddy-f80fe.firebasestorage.app",
  messagingSenderId: "272790152364",
  appId: "1:272790152364:web:e52f1d056dd2498fbf2b09",
  measurementId: "G-MJHEM1FB5R"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

/*
HOW TO GET YOUR FIREBASE CONFIG:
1. Go to Firebase Console
2. Click gear icon (Settings) → Project Settings
3. Scroll down to "Your apps"
4. Click the web icon </> 
5. If you haven't registered an app, click "Add app"
6. Copy the firebaseConfig object
7. Paste it above (replacing the example values)
*/