import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyBvHkaeMREtVSBpubmi-YdPbHVmLwh_-3M",
  authDomain: "aura-player-90645.firebaseapp.com",
  projectId: "aura-player-90645",
  storageBucket: "aura-player-90645.firebasestorage.app",
  messagingSenderId: "188073017515",
  appId: "1:188073017515:web:ab1186b767235687b677ee",
  measurementId: "G-R3FFRS6K6Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
