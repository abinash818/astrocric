'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './DownloadSection.module.css';

export default function DownloadSection() {
    const t = useTranslations('home');
    const { locale } = useParams();

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <span className="section-label">{t('downloadLabel')}</span>
                    <h2 className={styles.title}>{t('downloadTitle')}</h2>
                    <p className={styles.desc}>{t('downloadDesc')}</p>
                    <div className={styles.buttons}>
                        <Link href={`/${locale}/download`} className={styles.storeBtn}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.707l2.108 1.221a1 1 0 010 1.558l-2.108 1.221L15.333 12l2.365-2.364v-.001zM5.864 3.458L16.8 9.791l-2.302 2.302-8.634-8.635z" /></svg>
                            {t('downloadAndroid')}
                        </Link>
                        <button className={styles.storeBtn} disabled>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.31-1.32-3.15-2.55C4.22 17 2.97 12.46 4.7 9.3c.87-1.56 2.43-2.55 4.13-2.58 1.29-.02 2.52.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                            {t('downloadIOS')}
                        </button>
                    </div>
                </div>
                <div className={styles.mockup}>
                    <div className={styles.phone}>
                        <div className={styles.phoneScreen}>
                            <div className={styles.appPreview}>
                                <div className={styles.appHeader}>
                                    <span className={styles.appLogo}>✦ S&B Astro</span>
                                </div>
                                <div className={styles.appCard}>
                                    <div className={styles.appMatch}>IND vs AUS</div>
                                    <div className={styles.appAnalysis}>Analysis: India</div>
                                    <div className={styles.appConfidence}>87% Confidence</div>
                                </div>
                                <div className={styles.appCard}>
                                    <div className={styles.appMatch}>ENG vs SA</div>
                                    <div className={styles.appStatus}>Upcoming</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
