'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './HeroSection.module.css';

export default function HeroSection() {
    const t = useTranslations('home');
    const { locale } = useParams();

    return (
        <section className={styles.hero}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.badge}>
                        <span className={styles.badgeDot}></span>
                        {locale === 'ta' ? 'வேத ஜோதிட ஆய்வுகள்' : 'Vedic Astrology Analysis'}
                    </div>
                    <h1 className={styles.title}>
                        {locale === 'ta'
                            ? <>{t('heroTitle').split('வேத')[0]}<span className={styles.titleGold}>வேத ஜோதிடத்துடன்</span></>
                            : <>Unlock Match Insights with <span className={styles.titleGold}>Vedic Astrology</span></>
                        }
                    </h1>
                    <p className={styles.subtitle}>{t('heroSubtitle')}</p>
                    <div className={styles.actions}>
                        <Link href={`/${locale}/predictions`} className="btn btn-primary btn-lg">
                            {t('heroCTA')}
                        </Link>
                        <Link href={`/${locale}/download`} className="btn btn-secondary btn-lg">
                            {t('heroDownload')}
                        </Link>
                    </div>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>10+</span>
                            <span className={styles.statLabel}>{locale === 'ta' ? 'ஆண்டுகள்' : 'Years'}</span>
                        </div>
                        <div className={styles.statDivider}></div>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>90%</span>
                            <span className={styles.statLabel}>{locale === 'ta' ? 'துல்லியம்' : 'Accuracy'}</span>
                        </div>
                        <div className={styles.statDivider}></div>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>5K+</span>
                            <span className={styles.statLabel}>{locale === 'ta' ? 'பயனர்கள்' : 'Users'}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.visual}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardBadge}>✦ ANALYSIS</span>
                        </div>
                        <div className={styles.matchPreview}>
                            <div className={styles.team}>
                                <div className={styles.teamFlag}>🏏</div>
                                <span>IND</span>
                            </div>
                            <div className={styles.vs}>VS</div>
                            <div className={styles.team}>
                                <div className={styles.teamFlag}>🏏</div>
                                <span>AUS</span>
                            </div>
                        </div>
                        <div className={styles.cardResult}>
                            <span className={styles.winnerLabel}>{locale === 'ta' ? 'ஆய்வு' : 'Analysis Winner'}</span>
                            <span className={styles.winnerTeam}>INDIA ✓</span>
                        </div>
                        <div className={styles.confidence}>
                            <div className={styles.confidenceBar}>
                                <div className={styles.confidenceFill}></div>
                            </div>
                            <span>87% {locale === 'ta' ? 'நம்பிக்கை' : 'Confidence'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
