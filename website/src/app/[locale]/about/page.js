import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'எங்களைப் பற்றி' : 'About Us',
        description: locale === 'ta'
            ? 'S&B ஆஸ்ட்ரோ — 10+ ஆண்டுகள் வேத ஜோதிட அனுபவத்துடன் கிரிக்கெட் கணிப்புகள்'
            : 'S&B Astro — 10+ years of Vedic astrology experience in cricket match predictions.',
    };
}

export default function AboutPage() {
    return <AboutContent />;
}

function AboutContent() {
    const t = useTranslations('about');

    return (
        <section className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('label')}</span>
                    <h1>{t('title')}</h1>
                    <div className="divider"></div>
                </div>

                <div className={styles.content}>
                    <div className={styles.story}>
                        <div className={styles.avatar}>✦</div>
                        <h2>{t('storyTitle')}</h2>
                        <p>{t('storyP1')}</p>
                        <p>{t('storyP2')}</p>
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.stat}><span className={styles.statNum}>10+</span><span className={styles.statLabel}>{t('yearsExp')}</span></div>
                        <div className={styles.stat}><span className={styles.statNum}>90%</span><span className={styles.statLabel}>{t('accuracy')}</span></div>
                        <div className={styles.stat}><span className={styles.statNum}>5K+</span><span className={styles.statLabel}>{t('users')}</span></div>
                        <div className={styles.stat}><span className={styles.statNum}>500+</span><span className={styles.statLabel}>{t('predictions')}</span></div>
                    </div>

                    <div className={styles.mission}>
                        <h2>{t('missionTitle')}</h2>
                        <p>{t('missionDesc')}</p>
                    </div>

                    <div className={styles.values}>
                        <h2>{t('valuesTitle')}</h2>
                        <div className={styles.valuesGrid}>
                            <div className={styles.valueCard}>
                                <span className={styles.valueIcon}>🔬</span>
                                <h3>{t('value1Title')}</h3>
                                <p>{t('value1Desc')}</p>
                            </div>
                            <div className={styles.valueCard}>
                                <span className={styles.valueIcon}>🎯</span>
                                <h3>{t('value2Title')}</h3>
                                <p>{t('value2Desc')}</p>
                            </div>
                            <div className={styles.valueCard}>
                                <span className={styles.valueIcon}>🤝</span>
                                <h3>{t('value3Title')}</h3>
                                <p>{t('value3Desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
