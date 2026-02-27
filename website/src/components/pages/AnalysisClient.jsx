'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './AnalysisClient.module.css';
import { useAuth } from '@/context/AuthContext';
import { getUpcomingMatches, getFinishedMatches, unlockAnalysis } from '@/lib/api';

export default function AnalysisClient() {
    const t = useTranslations('predictions');
    const { locale } = useParams();
    const router = useRouter();
    const { user, backendToken, walletBalance, refreshProfile } = useAuth();

    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [finishedMatches, setFinishedMatches] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [unlockingMatch, setUnlockingMatch] = useState(null);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [error, setError] = useState('');

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

    const handleUnlockInitiate = (match) => {
        if (!user) {
            router.push(`/${locale}/login`);
            return;
        }
        setUnlockingMatch(match);
        setError('');
    };

    const handleConfirmUnlock = async () => {
        if (!unlockingMatch || !backendToken) return;

        setIsUnlocking(true);
        setError('');

        try {
            const response = await unlockAnalysis(unlockingMatch.id, backendToken);
            if (response && response.success) {
                // Refresh profile to update wallet balance
                await refreshProfile();
                // Close modal and maybe show success or redirect
                setUnlockingMatch(null);
                // In a production app, we'd probably redirect to a dedicated analysis view 
                // or update the local state to show the prediction content.
                // For now, let's just refresh the dashboard or matches.
                alert(response.message || 'Unlocked successfully!');
                window.location.reload(); // Quick way to refresh states
            } else if (response && response.error) {
                setError(response.error === 'Insufficient Astro Coins' ? t('insufficientBalance') : response.error);
            } else {
                setError(t('errors.general'));
            }
        } catch (err) {
            console.error('Unlock failed:', err);
            setError(t('errors.general'));
        } finally {
            setIsUnlocking(false);
        }
    };

    const currentMatches = activeTab === 'upcoming' ? upcomingMatches : finishedMatches;

    return (
        <section className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerMain}>
                        <div>
                            <span className="section-label">{t('label')}</span>
                            <h1>{t('title')}</h1>
                        </div>
                        {user && (
                            <div className={styles.walletBadge}>
                                <span className={styles.coinIcon}>🪙</span>
                                <span className={styles.balanceText}>{walletBalance} Astro Coins</span>
                            </div>
                        )}
                    </div>
                    <p className={styles.subtitle}>{t('subtitle')}</p>
                </div>

                <div className={styles.disclaimer}>
                    ⚠️ {t('disclaimerBanner')}
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
                        <p>{locale === 'ta' ? 'ஏற்றுகிறது...' : 'Loading...'}</p>
                    </div>
                ) : currentMatches.length === 0 ? (
                    <div className={styles.empty}>
                        <p>{activeTab === 'upcoming'
                            ? (locale === 'ta' ? 'வரவிருக்கும் ஆய்வுகள் இல்லை' : 'No upcoming matches with analysis')
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

                                {match.has_analysis ? (
                                    <div className={styles.predictionAvailable}>
                                        <div className={styles.priceTag}>
                                            <span className={styles.coinValue}>🪙 {match.analysis_price || 49}</span>
                                        </div>
                                        <button
                                            className={styles.buyBtn}
                                            onClick={() => handleUnlockInitiate(match)}
                                        >
                                            {t('buyAnalysis')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.noPrediction}>
                                        {locale === 'ta' ? 'ஆய்வு விரைவில்' : 'Analysis Coming Soon'}
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

            {/* Unlock Modal */}
            {unlockingMatch && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>{t('buyAnalysis')}</h3>
                        <div className={styles.modalContent}>
                            <p>{unlockingMatch.team1} vs {unlockingMatch.team2}</p>
                            <div className={styles.unlockDetails}>
                                <div className={styles.detailRow}>
                                    <span>{locale === 'ta' ? 'விலை' : 'Price'}:</span>
                                    <strong>🪙 {unlockingMatch.analysis_price || 49}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>{locale === 'ta' ? 'உங்கள் இருப்பு' : 'Your Balance'}:</span>
                                    <span className={walletBalance < (unlockingMatch.analysis_price || 49) ? styles.lowBalance : ''}>
                                        🪙 {walletBalance}
                                    </span>
                                </div>
                            </div>

                            {error && <div className={styles.errorText}>{error}</div>}

                            {walletBalance < (unlockingMatch.analysis_price || 49) ? (
                                <div className={styles.rechargePrompt}>
                                    <p>{t('insufficientBalance')}</p>
                                    <button
                                        className={styles.rechargeBtn}
                                        onClick={() => router.push(`/${locale}/dashboard`)}
                                    >
                                        {t('rechargeWallet')}
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.modalActions}>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() => setUnlockingMatch(null)}
                                        disabled={isUnlocking}
                                    >
                                        {locale === 'ta' ? 'ரத்து' : 'Cancel'}
                                    </button>
                                    <button
                                        className={styles.confirmBtn}
                                        onClick={handleConfirmUnlock}
                                        disabled={isUnlocking}
                                    >
                                        {isUnlocking ? '...' : (locale === 'ta' ? 'உறுதி செய்' : 'Confirm Unlock')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
