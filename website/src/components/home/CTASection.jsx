'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './CTASection.module.css';
import { WHATSAPP_URL } from '@/lib/constants';

export default function CTASection() {
    const t = useTranslations('home');
    const { locale } = useParams();

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.glow}></div>
                <h2 className={styles.title}>{t('ctaTitle')}</h2>
                <p className={styles.desc}>{t('ctaDesc')}</p>
                <div className={styles.actions}>
                    <Link href={`/${locale}/predictions`} className="btn btn-primary btn-lg">
                        {t('ctaButton')}
                    </Link>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
                        {t('ctaWhatsApp')}
                    </a>
                </div>
            </div>
        </section>
    );
}
