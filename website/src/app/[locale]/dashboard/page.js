'use client';

import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
    const t = useTranslations('auth');
    const { user, logout } = useAuth();

    return (
        <ProtectedRoute>
            <div className={styles.dashboardPage}>
                <div className={styles.container}>
                    <div className={styles.profileCard}>
                        <div className={styles.avatar}>
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || 'User'} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className={styles.userInfo}>
                            <h1>{user?.displayName || (user?.email?.split('@')[0])}</h1>
                            <p className={styles.email}>{user?.email}</p>
                        </div>
                        <button onClick={logout} className={styles.logoutBtn}>
                            {t('logout')}
                        </button>
                    </div>

                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <h3>Wallet Balance</h3>
                            <p className={styles.statValue}>₹ 0.00</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Predictions</h3>
                            <p className={styles.statValue}>0</p>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Success Rate</h3>
                            <p className={styles.statValue}>0%</p>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
