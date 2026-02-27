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
    fetchSignInMethodsForEmail,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { syncAuth, getUserProfile } from '@/lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [backendToken, setBackendToken] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async (token) => {
        const profile = await getUserProfile(token || backendToken);
        if (profile) {
            setWalletBalance(profile.walletBalance);
            return profile;
        }
    };

    const syncWithBackend = async (firebaseUser) => {
        if (!firebaseUser) return;

        try {
            const syncData = {
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                uid: firebaseUser.uid,
                photoURL: firebaseUser.photoURL
            };

            const response = await syncAuth(syncData);
            if (response && response.token) {
                setBackendToken(response.token);
                setWalletBalance(response.user.walletBalance);
                localStorage.setItem('backendToken', response.token);
            }
        } catch (error) {
            console.error('Backend sync failed:', error);
        }
    };

    useEffect(() => {
        // Recover token from localStorage
        const savedToken = localStorage.getItem('backendToken');
        if (savedToken) setBackendToken(savedToken);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                await syncWithBackend(user);
            } else {
                setUser(null);
                setBackendToken(null);
                setWalletBalance(0);
                localStorage.removeItem('backendToken');
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
            if (error.code === 'auth/account-exists-with-different-credential') {
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
            backendToken,
            walletBalance,
            loading,
            refreshProfile,
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
