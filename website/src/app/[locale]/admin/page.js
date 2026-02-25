'use client';

import { useAuth } from '@/context/AuthContext';
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';
import styles from '../dashboard/Dashboard.module.css';

export default function AdminPage() {
    const { user } = useAuth();

    return (
        <RoleBasedRoute allowedRoles={['admin']}>
            <div className={styles.dashboardPage}>
                <div className={styles.container}>
                    <div className={styles.profileCard}>
                        <h1>Admin Panel</h1>
                        <p className={styles.email}>Logged in as: {user?.email}</p>
                        <p style={{ marginTop: '1rem', color: 'var(--accent-gold)' }}>
                            This area is restricted to administrators.
                        </p>
                    </div>

                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <h3>Total Users</h3>
                            <p className={styles.statValue}>0</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Total Revenue</h3>
                            <p className={styles.statValue}>₹ 0.00</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Active Predictions</h3>
                            <p className={styles.statValue}>0</p>
                        </div>
                    </div>
                </div>
            </div>
        </RoleBasedRoute>
    );
}
