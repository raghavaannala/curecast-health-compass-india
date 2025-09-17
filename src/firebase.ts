import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, setPersistence, browserSessionPersistence, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRyThimfUW98IQoZeD8vJI0RsummvMwts",
  authDomain: "farm-o-kart.firebaseapp.com",
  projectId: "farm-o-kart",
  storageBucket: "farm-o-kart.appspot.com",
  messagingSenderId: "706763360435",
  appId: "1:706763360435:web:bf6f8eb94402076ce008c6",
  measurementId: "G-ZWCLCF9R3P"
};

// Initialize Firebase with error handling
let app: FirebaseApp;
let analytics: Analytics | null = null;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

try {
  console.log("Initializing Firebase app...");
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");
  
  // Initialize Firestore
  try {
    console.log("Initializing Firestore...");
    db = getFirestore(app);
    console.log("Firestore initialized successfully");
  } catch (firestoreError) {
    console.error("Error initializing Firestore:", firestoreError);
    // Create a fallback db object to prevent app crashes
    db = {} as Firestore;
  }
  
  // Initialize Auth
  try {
    console.log("Initializing Firebase Auth...");
    auth = getAuth(app);
    console.log("Firebase Auth initialized successfully");
    
    // Set auth persistence to session only (will be cleared when browser is closed)
    setPersistence(auth, browserSessionPersistence)
      .then(() => {
        console.log("Firebase auth persistence set to browserSession");
      })
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
        // Continue without persistence setting
      });
  } catch (authError) {
    console.error("Error initializing Firebase Auth:", authError);
    // Create a fallback auth object to prevent app crashes
    auth = {} as Auth;
  }

  // Initialize Storage
  try {
    console.log("Initializing Firebase Storage...");
    storage = getStorage(app);
    console.log("Firebase Storage initialized successfully");
  } catch (storageError) {
    console.error("Error initializing Firebase Storage:", storageError);
    // Create a fallback storage object to prevent app crashes
    storage = {} as FirebaseStorage;
  }

  // Initialize Analytics conditionally
  try {
    console.log("Checking Analytics support...");
    isSupported().then(supported => {
      if (supported) {
        console.log("Analytics is supported, initializing...");
        analytics = getAnalytics(app);
        console.log("Analytics initialized successfully");
      } else {
        console.log("Analytics is not supported in this environment");
        analytics = null;
      }
    }).catch(error => {
      console.error("Error checking analytics support:", error);
      analytics = null;
    });
  } catch (analyticsError) {
    console.error("Error initializing Analytics:", analyticsError);
    analytics = null;
  }
} catch (firebaseError) {
  console.error("Critical error initializing Firebase:", firebaseError);
  // Create fallback objects to prevent app crashes
  app = {} as FirebaseApp;
  db = {} as Firestore;
  auth = {} as Auth;
  storage = {} as FirebaseStorage;
  analytics = null;
  
  // Update the debug message if it exists
  const debugMsg = document.getElementById('debug-message');
  if (debugMsg) {
    debugMsg.textContent = `Firebase initialization error: ${firebaseError instanceof Error ? firebaseError.message : 'Unknown error'}`;
    debugMsg.style.backgroundColor = '#f44336';
  }
}

// Helper function to check if Firebase is properly initialized
export const isFirebaseInitialized = () => {
  return app && typeof app !== 'undefined' && Object.keys(app).length > 0;
};

export { app, analytics, db, auth, storage };