'use client';

import { useTranslations } from 'next-intl';
import styles from './TestimonialsPreview.module.css';

const SAMPLE_TESTIMONIALS = [
    { name: 'Rajesh K.', text: 'Amazing accuracy! I have been following S&B Astro for 6 months and the predictions are consistently right.', rating: 5 },
    { name: 'Priya M.', text: 'First time trying astrology prediction and was blown away. The Key Player prediction was spot on!', rating: 5 },
    { name: 'Suresh V.', text: 'Best prediction site in India. The Vedic method really works. Totally worth the price.', rating: 4 },
    { name: 'Anitha R.', text: 'Very professional and transparent. They show their track record openly. Highly recommended!', rating: 5 },
];

export default function TestimonialsPreview() {
    const t = useTranslations('home');

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('testimonialsLabel')}</span>
                    <h2>{t('testimonialsTitle')}</h2>
                    <div className="divider"></div>
                </div>
                <div className={styles.grid}>
                    {SAMPLE_TESTIMONIALS.map((item, i) => (
                        <div key={i} className={styles.card}>
                            <div className={styles.stars}>
                                {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                            </div>
                            <p className={styles.text}>&ldquo;{item.text}&rdquo;</p>
                            <div className={styles.author}>
                                <div className={styles.avatar}>{item.name[0]}</div>
                                <span className={styles.name}>{item.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
