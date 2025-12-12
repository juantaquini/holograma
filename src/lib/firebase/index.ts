import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "holograma-829a7.firebaseapp.com",
  projectId: "holograma-829a7",
  storageBucket: "holograma-829a7.firebasestorage.app",
  messagingSenderId: "857743046292",
  appId: "1:857743046292:web:834d5b7fd0b7a0fe1ba681",
  measurementId: "G-9QBSYCQ40H",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
