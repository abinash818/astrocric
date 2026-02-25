import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    browserLocalPersistence,
    setPersistence
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDLavevOJKNTuVnpco6uCn3FIgNiKdgASg",
    authDomain: "astrocricket-826c2.firebaseapp.com",
    projectId: "astrocricket-826c2",
    storageBucket: "astrocricket-826c2.firebasestorage.app",
    messagingSenderId: "491926924357",
    appId: "1:491926924357:web:3a4f8109201c73d2d0072c",
    measurementId: "G-YS8WE319M6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence
setPersistence(auth, browserLocalPersistence);

// Providers
const googleProvider = new GoogleAuthProvider();

// Analytics
let analytics = null;
if (typeof window !== 'undefined') {
    isSupported().then(yes => {
        if (yes) analytics = getAnalytics(app);
    });
}

export { auth, googleProvider, analytics };
export default app;
