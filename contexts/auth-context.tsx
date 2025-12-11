"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    User as FirebaseUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById, createUser, updateUser } from '@/lib/firestore';
import { User, UserRole } from '@/lib/types';
import { updateUserEmailServer } from '@/app/actions/update-user';

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserEmail: (newEmail: string, currentPassword: string) => Promise<void>;
    updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isStaff: boolean;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load user data from Firestore
    const loadUserData = useCallback(async (firebaseUser: FirebaseUser) => {
        try {
            const userData = await getUserById(firebaseUser.uid);
            if (userData) {
                setUser(userData);
            } else {
                // User exists in Auth but not in Firestore - create a default profile
                const newUser = await createUser(firebaseUser.uid, {
                    email: firebaseUser.email || '',
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    role: 'staff', // Default role for new users
                });
                setUser(newUser);
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            setError('Failed to load user profile');
        }
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            setFirebaseUser(firebaseUser);

            if (firebaseUser) {
                await loadUserData(firebaseUser);
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [loadUserData]);

    // Login function
    const login = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error('Login error:', err);
            let errorMessage = 'Failed to log in';

            switch (err.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid email or password';
                    break;
                default:
                    errorMessage = err.message || 'Failed to log in';
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Signup function
    const signup = async (email: string, password: string, name: string, role: UserRole = 'staff') => {
        try {
            setError(null);
            setLoading(true);

            const result = await createUserWithEmailAndPassword(auth, email, password);

            // Create user document in Firestore
            await createUser(result.user.uid, {
                email,
                name,
                role,
            });
        } catch (err: any) {
            console.error('Signup error:', err);
            let errorMessage = 'Failed to create account';

            switch (err.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                default:
                    errorMessage = err.message || 'Failed to create account';
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            setError(null);
            await signOut(auth);
            setUser(null);
            setFirebaseUser(null);
        } catch (err: any) {
            console.error('Logout error:', err);
            setError('Failed to log out');
            throw err;
        }
    };

    // Reset password function
    const resetPassword = async (email: string) => {
        try {
            setError(null);
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            console.error('Password reset error:', err);
            let errorMessage = 'Failed to send password reset email';

            switch (err.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                default:
                    errorMessage = err.message || 'Failed to send password reset email';
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Update user email
    const updateUserEmail = async (newEmail: string, currentPassword: string) => {
        try {
            setError(null);
            if (!firebaseUser || !user) {
                throw new Error('No user logged in');
            }

            // Reauthenticate user to verify password
            const credential = EmailAuthProvider.credential(
                firebaseUser.email!,
                currentPassword
            );
            await reauthenticateWithCredential(firebaseUser, credential);

            // Update email using server action (bypasses verification)
            const result = await updateUserEmailServer(firebaseUser.uid, newEmail);

            if (!result.success) {
                throw new Error(result.error || 'Failed to update email');
            }

            // Reload user data
            await loadUserData(firebaseUser);
        } catch (err: any) {
            console.error('Email update error:', err);
            let errorMessage = 'Failed to update email';

            switch (err.code) {
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already in use';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = 'Please log out and log in again before changing your email';
                    break;
                default:
                    errorMessage = err.message || 'Failed to update email';
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Update user password
    const updateUserPassword = async (currentPassword: string, newPassword: string) => {
        try {
            setError(null);
            if (!firebaseUser) {
                throw new Error('No user logged in');
            }

            // Reauthenticate user before updating password
            const credential = EmailAuthProvider.credential(
                firebaseUser.email!,
                currentPassword
            );
            await reauthenticateWithCredential(firebaseUser, credential);

            // Update password in Firebase Auth
            await updatePassword(firebaseUser, newPassword);
        } catch (err: any) {
            console.error('Password update error:', err);
            let errorMessage = 'Failed to update password';

            switch (err.code) {
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect current password';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'New password should be at least 6 characters';
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = 'Please log out and log in again before changing your password';
                    break;
                default:
                    errorMessage = err.message || 'Failed to update password';
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Clear error
    const clearError = () => setError(null);

    // Computed properties for role checks
    const isSuperAdmin = user?.role === 'superAdmin';
    const isAdmin = user?.role === 'admin';
    const isStaff = user?.role === 'staff';

    const value: AuthContextType = {
        user,
        firebaseUser,
        loading,
        error,
        login,
        signup,
        logout,
        resetPassword,
        updateUserEmail,
        updateUserPassword,
        isSuperAdmin,
        isAdmin,
        isStaff,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Hook to get current user info for activity logging
export function useCurrentUser() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
}
