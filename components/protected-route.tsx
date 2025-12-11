"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
    requireSuperAdmin?: boolean;
}

export function ProtectedRoute({
    children,
    allowedRoles,
    requireSuperAdmin = false,
}: ProtectedRouteProps) {
    const { user, loading, firebaseUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // Not authenticated - redirect to login
            if (!firebaseUser) {
                router.push('/login');
                return;
            }

            // User data not loaded yet
            if (!user) {
                return;
            }

            // Check for super admin requirement
            if (requireSuperAdmin && user.role !== 'superAdmin') {
                router.push('/dashboard');
                return;
            }

            // Check for allowed roles
            if (allowedRoles && !allowedRoles.includes(user.role)) {
                router.push('/dashboard');
                return;
            }
        }
    }, [loading, firebaseUser, user, router, allowedRoles, requireSuperAdmin]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!firebaseUser) {
        return null;
    }

    // Waiting for user data
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading user data...</p>
                </div>
            </div>
        );
    }

    // Check permissions
    if (requireSuperAdmin && user.role !== 'superAdmin') {
        return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}

// Higher-order component for super admin only pages
export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requireSuperAdmin>
            {children}
        </ProtectedRoute>
    );
}

// Higher-order component for staff pages (both staff and superAdmin)
export function StaffRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['staff', 'superAdmin']}>
            {children}
        </ProtectedRoute>
    );
}
