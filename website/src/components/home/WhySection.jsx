'use client';

import { useTranslations } from 'next-intl';
import styles from './WhySection.module.css';

export default function WhySection() {
    const t = useTranslations('home');

    const cards = [
        {
            icon: '⏱',
            title: t('whyExperience'),
            desc: t('whyExperienceDesc'),
        },
        {
            icon: '🎯',
            title: t('whyAccuracy'),
            desc: t('whyAccuracyDesc'),
        },
        {
            icon: '✦',
            title: t('whyMethod'),
            desc: t('whyMethodDesc'),
        },
    ];

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('whyLabel')}</span>
                    <h2>{t('whyTitle')}</h2>
                    <div className="divider"></div>
                </div>
                <div className={styles.grid}>
                    {cards.map((card, i) => (
                        <div key={i} className={styles.card}>
                            <div className={styles.icon}>{card.icon}</div>
                            <h3 className={styles.cardTitle}>{card.title}</h3>
                            <p className={styles.cardDesc}>{card.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
