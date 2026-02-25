'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/Auth.module.css';

export default function ResetPasswordPage() {
    const t = useTranslations('auth');
    const { locale } = useParams();
    const { resetPassword } = useAuth();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            await resetPassword(email);
            setMessage(t('success.resetSent'));
        } catch (err) {
            setError(t('errors.general'));
        }
        setLoading(false);
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <h1>{t('resetPasswordTitle')}</h1>

                {error && <div className={styles.errorBadge}>{error}</div>}
                {message && <div style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}

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

                    <button type="submit" className={styles.mainBtn} disabled={loading}>
                        {loading ? '...' : t('resetPasswordBtn')}
                    </button>
                </form>

                <div className={styles.authActions} style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                    <Link href={`/${locale}/login`} className={styles.forgotLink}>
                        ← {t('backToLogin')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
