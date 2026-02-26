// backend/firebaseAdmin.js
// Firebase Admin SDK for server-side operations

const admin = require('firebase-admin');

// For development: Use test mode
// For production: Download service account key from Firebase Console
const initializeFirebase = () => {
  try {
    // Initialize with default credentials (test mode)
    // This works for local development with Firestore in test mode
    // admin.initializeApp({
    //   projectId: 'study-buddy-f80fe', // REPLACE with your Firebase project ID
    // });
    const serviceAccount = require('./firebase-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }
};

// Get Firestore database instance
const getDb = () => {
  return admin.firestore();
};

// Helper function to get server timestamp
const getTimestamp = () => {
  return admin.firestore.FieldValue.serverTimestamp();
};

module.exports = {
  initializeFirebase,
  getDb,
  getTimestamp,
  admin
};

/* 
IMPORTANT: Replace 'your-project-id' with your actual Firebase project ID
You can find it in Firebase Console > Project Settings > Project ID

For production, you should use a service account key:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save as firebase-key.json in backend folder
4. Use this code instead:

const serviceAccount = require('./firebase-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
*/