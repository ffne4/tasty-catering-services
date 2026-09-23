/* =====================================================
   FIREBASE CONFIG — replace these values with your live Firebase project config
   ===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBduS4b7mvex4am1hr-PqZ3jF4HF72LyJE",
  authDomain: "tasty-catering-3b5ce.firebaseapp.com",
  projectId: "tasty-catering-3b5ce",
  storageBucket: "tasty-catering-3b5ce.firebasestorage.app",
  messagingSenderId: "246940059204",
  appId: "1:246940059204:web:1d9dacbe5d099428531e11"
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(value => value && !value.includes('PASTE_'));
const firebaseReady = typeof firebase !== 'undefined' && hasFirebaseConfig;

if (firebaseReady) {
  firebase.initializeApp(firebaseConfig);
} else {
  console.warn('[Tasty Catering] Firebase is not configured yet. Add your project config in assets/js/firebase-config.js to enable Firestore/Auth uploads.');
}

const db = firebaseReady ? firebase.firestore() : null;
const storage = firebaseReady ? firebase.storage() : null;
const auth = firebaseReady ? firebase.auth() : null;