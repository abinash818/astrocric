'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './PredictionTypes.module.css';

export default function PredictionTypes() {
    const t = useTranslations('home');
    const { locale } = useParams();

    const types = [
        {
            title: t('typeMatch'),
            desc: t('typeMatchDesc'),
            icon: '🏏',
            price: '₹49',
            popular: false,
        },
        {
            title: t('typePlayer'),
            desc: t('typePlayerDesc'),
            icon: '⭐',
            price: '₹79',
            popular: true,
        },
        {
            title: t('typeBundle'),
            desc: t('typeBundleDesc'),
            icon: '🎯',
            price: '₹99',
            popular: false,
        },
    ];

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('typesLabel')}</span>
                    <h2>{t('typesTitle')}</h2>
                    <div className="divider"></div>
                </div>
                <div className={styles.grid}>
                    {types.map((type, i) => (
                        <div key={i} className={`${styles.card} ${type.popular ? styles.popular : ''}`}>
                            {type.popular && (
                                <div className={styles.popularBadge}>
                                    {locale === 'ta' ? 'பிரபலமான' : 'Most Popular'}
                                </div>
                            )}
                            <div className={styles.cardIcon}>{type.icon}</div>
                            <h3 className={styles.cardTitle}>{type.title}</h3>
                            <p className={styles.cardDesc}>{type.desc}</p>
                            <div className={styles.price}>
                                <span className={styles.priceAmount}>{type.price}</span>
                                <span className={styles.pricePer}>/ {locale === 'ta' ? 'போட்டி' : 'match'}</span>
                            </div>
                            <Link href={`/${locale}/predictions`} className={styles.cardBtn}>
                                {t('heroCTA')}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
