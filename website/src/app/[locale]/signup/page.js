'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/Auth.module.css';

export default function SignupPage() {
    const t = useTranslations('auth');
    const { locale } = useParams();
    const router = useRouter();
    const { signupWithEmail, loginWithGoogle } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError(t('errors.mismatch'));
        }

        setLoading(true);
        try {
            await signupWithEmail(email, password);
            router.push(`/${locale}/dashboard`);
        } catch (err) {
            setError(err.code === 'auth/email-already-in-use' ? t('errors.emailInUse') :
                err.code === 'auth/weak-password' ? t('errors.weakPassword') :
                    t('errors.general'));
        }
        setLoading(false);
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <h1>{t('signupTitle')}</h1>
                <p className={styles.authSubtitle}>{t('haveAccount')} <Link href={`/${locale}/login`}>{t('loginBtn')}</Link></p>

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
                    <div className={styles.inputGroup}>
                        <label>{t('confirmPasswordLabel')}</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('confirmPasswordPlaceholder')}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.mainBtn} disabled={loading}>
                        {loading ? '...' : t('signupBtn')}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>{t('or')}</span>
                </div>

                <button onClick={() => loginWithGoogle().then(() => router.push(`/${locale}/dashboard`))} className={styles.googleBtn}>
                    <img src="/images/google-icon.svg" alt="" />
                    {t('googleLogin')}
                </button>
            </div>
        </div>
    );
}
