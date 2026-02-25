'use client';

import { useTranslations } from 'next-intl';
import styles from './HowItWorks.module.css';

export default function HowItWorks() {
    const t = useTranslations('home');

    const steps = [
        { num: '01', icon: '🪐', title: t('howStep1'), desc: t('howStep1Desc') },
        { num: '02', icon: '📊', title: t('howStep2'), desc: t('howStep2Desc') },
        { num: '03', icon: '🏆', title: t('howStep3'), desc: t('howStep3Desc') },
    ];

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('howLabel')}</span>
                    <h2>{t('howTitle')}</h2>
                    <div className="divider"></div>
                </div>
                <div className={styles.steps}>
                    {steps.map((step, i) => (
                        <div key={i} className={styles.step}>
                            <div className={styles.stepNumber}>{step.num}</div>
                            <div className={styles.stepIcon}>{step.icon}</div>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDesc}>{step.desc}</p>
                            {i < steps.length - 1 && <div className={styles.connector}></div>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
