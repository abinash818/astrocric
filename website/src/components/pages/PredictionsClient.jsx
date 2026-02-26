'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './PredictionsClient.module.css';

import { getUpcomingMatches, getFinishedMatches } from '@/lib/api';

export default function PredictionsClient() {
    const t = useTranslations('predictions');
    const { locale } = useParams();
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [finishedMatches, setFinishedMatches] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [upcoming, finished] = await Promise.all([
                    getUpcomingMatches(1, 20),
                    getFinishedMatches(1, 20),
                ]);
                setUpcomingMatches(upcoming?.matches || []);
                setFinishedMatches(finished?.matches || []);
            } catch (e) {
                console.error('Failed to fetch:', e);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    const currentMatches = activeTab === 'upcoming' ? upcomingMatches : finishedMatches;

    return (
        <section className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('label')}</span>
                    <h1>{t('title')}</h1>
                    <p className={styles.subtitle}>{t('subtitle')}</p>
                </div>

                <div className={styles.disclaimer}>
                    ⚠️ {locale === 'ta'
                        ? 'கணிப்புகள் பொழுதுபோக்கு நோக்கத்திற்காக மட்டுமே. பந்தயம் கூடாது.'
                        : 'Predictions are for entertainment purposes only. No betting.'}
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${activeTab === 'upcoming' ? styles.tabActive : ''}`} onClick={() => setActiveTab('upcoming')}>
                        {t('tabUpcoming')} ({upcomingMatches.length})
                    </button>
                    <button className={`${styles.tab} ${activeTab === 'results' ? styles.tabActive : ''}`} onClick={() => setActiveTab('results')}>
                        {t('tabResults')} ({finishedMatches.length})
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>{locale === 'ta' ? 'ஏற்றுகிறது...' : 'Loading predictions...'}</p>
                    </div>
                ) : currentMatches.length === 0 ? (
                    <div className={styles.empty}>
                        <p>{activeTab === 'upcoming'
                            ? (locale === 'ta' ? 'வரவிருக்கும் போட்டிகள் இல்லை' : 'No upcoming matches with predictions')
                            : (locale === 'ta' ? 'முடிவுகள் இல்லை' : 'No results yet')
                        }</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {currentMatches.map(match => (
                            <div key={match.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.matchType}>{match.match_type || 'Cricket'}</span>
                                    <span className={styles.date}>
                                        {new Date(match.match_date).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
                                        })}
                                    </span>
                                </div>

                                <div className={styles.teams}>
                                    <div className={styles.team}>
                                        {match.team1_flag_url && <img src={match.team1_flag_url} alt="" className={styles.flag} />}
                                        <span>{match.team1}</span>
                                    </div>
                                    <span className={styles.vs}>VS</span>
                                    <div className={styles.team}>
                                        {match.team2_flag_url && <img src={match.team2_flag_url} alt="" className={styles.flag} />}
                                        <span>{match.team2}</span>
                                    </div>
                                </div>

                                {match.venue && <p className={styles.venue}>📍 {match.venue}</p>}

                                {match.has_prediction ? (
                                    <div className={styles.predictionAvailable}>
                                        <span className={styles.predictionBadge}>✦ {locale === 'ta' ? 'கணிப்பு உள்ளது' : 'Prediction Available'}</span>
                                        <button className={styles.buyBtn}>
                                            {locale === 'ta' ? 'கணிப்பு வாங்கு' : 'Buy Prediction'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.noPrediction}>
                                        {locale === 'ta' ? 'கணிப்பு விரைவில்' : 'Prediction Coming Soon'}
                                    </div>
                                )}

                                {match.result && (
                                    <div className={styles.resultBanner}>
                                        ✓ {match.result}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
