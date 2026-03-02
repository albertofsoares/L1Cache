// Firebase modular (via CDN) — sem build
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { FIREBASE_CONFIG } from "./config.js";

export const fbApp = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(fbApp);
export const db = getFirestore(fbApp);

export const Auth = {
  onAuthStateChanged: (cb) => onAuthStateChanged(auth, cb),
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  },
  async signOut() {
    return signOut(auth);
  },
};

export const Fs = {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, query, where, orderBy, getDocs, limit, writeBatch
};
