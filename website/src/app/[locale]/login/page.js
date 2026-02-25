'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Auth.module.css';

export default function LoginPage() {
    const t = useTranslations('auth');
    const { locale } = useParams();
    const router = useRouter();
    const { loginWithEmail, loginWithGoogle } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await loginWithEmail(email, password);
            router.push(`/${locale}/dashboard`);
        } catch (err) {
            setError(err.code === 'auth/wrong-password' ? t('errors.wrongPassword') :
                err.code === 'auth/user-not-found' ? t('errors.userNotFound') :
                    t('errors.general'));
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await loginWithGoogle();
            router.push(`/${locale}/dashboard`);
        } catch (err) {
            if (err.code === 'auth/account-exists-with-different-credential') {
                setError(t('linkingDesc'));
            } else {
                setError(t('errors.general'));
            }
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <h1>{t('loginTitle')}</h1>
                <p className={styles.authSubtitle}>{t('noAccount')} <Link href={`/${locale}/signup`}>{t('signupBtn')}</Link></p>

                {error && <div className={styles.errorBadge}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    <div className={styles.inputGroup}>
                        <label>{t('emailLabel')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('emailPlaceholder')}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>{t('passwordLabel')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('passwordPlaceholder')}
                            required
                        />
                    </div>

                    <div className={styles.authActions}>
                        <Link href={`/${locale}/reset-password`} className={styles.forgotLink}>
                            {t('forgotPassword')}
                        </Link>
                    </div>

                    <button type="submit" className={styles.mainBtn} disabled={loading}>
                        {loading ? '...' : t('loginBtn')}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>{t('or')}</span>
                </div>

                <button onClick={handleGoogleLogin} className={styles.googleBtn}>
                    <img src="/images/google-icon.svg" alt="" />
                    {t('googleLogin')}
                </button>
            </div>
        </div>
    );
}
