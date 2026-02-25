'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    linkWithCredential,
    EmailAuthProvider,
    fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signupWithEmail = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const loginWithEmail = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            // Handle account linking if email already exists
            if (error.code === 'auth/account-exists-with-different-credential') {
                const email = error.customData.email;
                const pendingCred = GoogleAuthProvider.credentialFromError(error);

                // Fetch sign-in methods for this email
                const methods = await fetchSignInMethodsForEmail(auth, email);

                // If they have password method, we can prompt them to link
                // For now, we'll throw the error so the UI can handle the prompt
                throw error;
            }
            throw error;
        }
    };

    const logout = () => {
        return signOut(auth);
    };

    const resetPassword = (email) => {
        return sendPasswordResetEmail(auth, email);
    };

    const linkAccounts = async (credential) => {
        if (auth.currentUser) {
            return linkWithCredential(auth.currentUser, credential);
        }
        throw new Error('No user logged in to link accounts');
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signupWithEmail,
            loginWithEmail,
            loginWithGoogle,
            logout,
            resetPassword,
            linkAccounts
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
