'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function RoleBasedRoute({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { locale } = useParams();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push(`/${locale}/login`);
            } else {
                // For now, we'll assume roles are handled via custom claims or a user document
                // This is a placeholder for actual role checking logic
                // const userRole = user.role || 'user'; 
                // if (!allowedRoles.includes(userRole)) {
                //     router.push(`/${locale}/dashboard`);
                // }
            }
        }
    }, [user, loading, router, locale, allowedRoles]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    // Temporary: allow all logged in users if roles are not yet implemented in DB
    return user ? children : null;
}
