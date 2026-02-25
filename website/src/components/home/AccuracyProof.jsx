'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './AccuracyProof.module.css';

export default function AccuracyProof() {
    const t = useTranslations('home');
    const { locale } = useParams();

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('proofLabel')}</span>
                    <h2>{t('proofTitle')}</h2>
                    <div className="divider"></div>
                </div>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber}>500+</span>
                        <span className={styles.statLabel}>{t('proofTotal')}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statNumber} ${styles.gold}`}>450+</span>
                        <span className={styles.statLabel}>{t('proofCorrect')}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statNumber} ${styles.gold}`}>90%</span>
                        <span className={styles.statLabel}>{t('proofAccuracy')}</span>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill}></div>
                        </div>
                    </div>
                </div>
                <div className={styles.cta}>
                    <Link href={`/${locale}/testimonials`} className="btn btn-secondary">
                        {t('proofViewAll')} →
                    </Link>
                </div>
            </div>
        </section>
    );
}
