// Firebase Configuration (modular SDK v12, loaded as an ES module)
//
// This module initializes Firebase and publishes the pieces app.js needs on
// `window.fb`. app.js stays a classic script so the inline onclick= handlers
// in index.html keep working.
//
// Module scripts are deferred, so this always finishes before DOMContentLoaded.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    writeBatch,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js';

// ---------------------------------------------------------------------------
// Firebase Console > Project settings > General > Your apps > SDK setup ("Config")
// These values are not secrets - access is controlled by Security Rules.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyB_saPJX6SkvCEzD4oEDwnJlYrUL-HObDo",
  authDomain: "prompt-gallery-661e6.firebaseapp.com",
  projectId: "prompt-gallery-661e6",
  storageBucket: "prompt-gallery-661e6.firebasestorage.app",
  messagingSenderId: "407308667206",
  appId: "1:407308667206:web:477752aadc7119fd07fd47",
  measurementId: "G-3QJ2QWT3ZP"
};

// Firestore collection holding the gallery items, and the Storage folder for
// uploaded images.
const COLLECTION = 'prompts';
const IMAGE_FOLDER = 'prompt-images';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

window.fb = {
    COLLECTION,
    IMAGE_FOLDER,
    auth,
    db,
    storage,
    // Auth
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    // Firestore
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    writeBatch,
    Timestamp,
    // Storage
    storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
};

console.log('✅ Firebase initialized:', firebaseConfig.projectId);
