'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './LiveScoresClient.module.css';

import { getLiveMatches, getUpcomingMatches, getFinishedMatches, getMatchScorecard } from '@/lib/api';

export default function LiveScoresClient() {
    const t = useTranslations('liveScores');
    const { locale } = useParams();
    const [liveMatches, setLiveMatches] = useState([]);
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [finishedMatches, setFinishedMatches] = useState([]);
    const [activeTab, setActiveTab] = useState('live');
    const [loading, setLoading] = useState(true);
    const [scorecards, setScorecards] = useState({});

    useEffect(() => {
        fetchAllMatches();
        const interval = setInterval(fetchAllMatches, 60000);
        return () => clearInterval(interval);
    }, []);

    async function fetchAllMatches() {
        setLoading(true);
        try {
            const [live, upcoming, finished] = await Promise.all([
                getLiveMatches(),
                getUpcomingMatches(1, 20),
                getFinishedMatches(1, 20),
            ]);
            setLiveMatches(live?.matches || []);
            setUpcomingMatches(upcoming?.matches || []);
            setFinishedMatches(finished?.matches || []);

            // Fetch scorecards for live matches
            if (live?.matches?.length) {
                const cards = {};
                for (const match of live.matches) {
                    try {
                        const sc = await getMatchScorecard(match.id);
                        if (sc) cards[match.id] = sc;
                    } catch (e) { /* ignore */ }
                }
                setScorecards(cards);
            }
        } catch (e) {
            console.error('Failed to fetch matches:', e);
        }
        setLoading(false);
    }

    // fetchLive is now covered by fetchAllMatches in the interval
    async function fetchLive() {
        await fetchAllMatches();
    }

    const tabs = [
        { key: 'live', label: t('tabLive'), count: liveMatches.length },
        { key: 'upcoming', label: t('tabUpcoming'), count: upcomingMatches.length },
        { key: 'finished', label: t('tabFinished'), count: finishedMatches.length },
    ];

    function formatStatus(status) {
        if (!status) return '';
        // If status contains GMT time, convert to IST
        if (status.toUpperCase().includes('GMT')) {
            try {
                // Typical format: "Match starts at Feb 22, 10:00 GMT" or "Feb 22, 10:00 GMT"
                // More robust regex to match month, day, optional year, and time
                const dateMatch = status.match(/([a-zA-Z]+\s+\d+(?:,\s*\d{4})?,\s*\d+:\d+)\s*GMT/i);
                if (dateMatch) {
                    const datePart = dateMatch[1];
                    // If year is missing, let's assume current year (2026 for this case) or let Date handle it
                    const date = new Date(datePart + ' UTC');
                    if (!isNaN(date)) {
                        const istTime = date.toLocaleTimeString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
                            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                        });
                        const istDate = date.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
                            day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata'
                        });

                        const istString = `${istDate}, ${istTime} (IST)`;
                        return status.replace(dateMatch[0], istString);
                    }
                }
            } catch (e) {
                console.error('Failed to parse status date:', e);
            }
        }
        return status;
    }

    function renderScore(score) {
        if (!score) return null;
        if (typeof score === 'object') {
            return `${score.r}/${score.w} (${score.o})`;
        }
        return score;
    }

    function getScoreForTeam(match, teamName, fallbackScore) {
        const scorecard = scorecards[match.id];
        if (scorecard && scorecard.score) {
            const teamScore = scorecard.score.find(s => s.inning && s.inning.toLowerCase().includes(teamName.toLowerCase()));
            if (teamScore) {
                return renderScore(teamScore);
            }
        }
        return fallbackScore ? renderScore(fallbackScore) : null;
    }

    const currentMatches = activeTab === 'live' ? liveMatches : activeTab === 'upcoming' ? upcomingMatches : finishedMatches;

    return (
        <section className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('label')}</span>
                    <h1>{t('title')}</h1>
                    <p className={styles.subtitle}>{t('subtitle')}</p>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.key === 'live' && <span className={styles.liveDot}></span>}
                            {tab.label}
                            <span className={styles.tabCount}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Match List */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>{locale === 'ta' ? 'ஏற்றுகிறது...' : 'Loading matches...'}</p>
                    </div>
                ) : currentMatches.length === 0 ? (
                    <div className={styles.empty}>
                        <p>{activeTab === 'live'
                            ? (locale === 'ta' ? 'நேரடி போட்டிகள் இல்லை' : 'No live matches right now')
                            : activeTab === 'upcoming'
                                ? (locale === 'ta' ? 'வரவிருக்கும் போட்டிகள் இல்லை' : 'No upcoming matches')
                                : (locale === 'ta' ? 'முடிந்த போட்டிகள் இல்லை' : 'No finished matches')
                        }</p>
                    </div>
                ) : (
                    <div className={styles.matchList}>
                        {currentMatches.map(match => (
                            <div key={match.id} className={styles.matchCard}>
                                <div className={styles.matchHeader}>
                                    <span className={styles.matchType}>{match.match_type || 'Cricket'}</span>
                                    {match.status === 'live' && <span className={styles.liveBadge}>● LIVE</span>}
                                    {match.status === 'upcoming' && (
                                        <span className={styles.dateBadge}>
                                            {new Date(match.match_date).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
                                            })}
                                        </span>
                                    )}
                                    {match.status === 'finished' && (
                                        <div className={styles.finishedHeader}>
                                            <span className={styles.dateBadge}>
                                                {new Date(match.match_date).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
                                                })}
                                            </span>
                                            <span className={styles.finishedBadge}>Finished</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.teams}>
                                    <div className={styles.team}>
                                        {match.team1_flag_url && <img src={match.team1_flag_url} alt="" className={styles.flag} />}
                                        <span className={styles.teamName}>{match.team1}</span>
                                        {getScoreForTeam(match, match.team1, match.team1_score) && (
                                            <span className={styles.score}>{getScoreForTeam(match, match.team1, match.team1_score)}</span>
                                        )}
                                    </div>
                                    <span className={styles.vs}>VS</span>
                                    <div className={styles.team}>
                                        {match.team2_flag_url && <img src={match.team2_flag_url} alt="" className={styles.flag} />}
                                        <span className={styles.teamName}>{match.team2}</span>
                                        {getScoreForTeam(match, match.team2, match.team2_score) && (
                                            <span className={styles.score}>{getScoreForTeam(match, match.team2, match.team2_score)}</span>
                                        )}
                                    </div>
                                </div>

                                {match.venue && <p className={styles.venue}>📍 {match.venue}</p>}
                                {match.result && <p className={styles.result}>{formatStatus(match.result)}</p>}
                                {scorecards[match.id]?.status && (
                                    <p className={styles.liveStatus}>{formatStatus(scorecards[match.id].status)}</p>
                                )}

                                {match.status === 'live' && scorecards[match.id]?.scorecard && (
                                    <div className={styles.liveDetails}>
                                        {/* Get the most recent inning */}
                                        {(() => {
                                            const sc = scorecards[match.id].scorecard;
                                            const lastInning = sc[sc.length - 1];
                                            const activeBatsmen = lastInning?.batting?.filter(b => b.dismissal === 'not out') || [];
                                            const lastBowler = lastInning?.bowling?.[lastInning.bowling.length - 1];

                                            return (
                                                <>
                                                    {activeBatsmen.length > 0 && (
                                                        <div className={styles.detailRow}>
                                                            <span className={styles.detailLabel}>{locale === 'ta' ? 'பேட்டிங்' : 'Batting'}:</span>
                                                            <div className={styles.players}>
                                                                {activeBatsmen.slice(0, 2).map((b, i) => (
                                                                    <span key={i} className={styles.playerInfo}>
                                                                        {b.batsman?.name} <strong>{b.runs}({b.balls})</strong>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {lastBowler && (
                                                        <div className={styles.detailRow}>
                                                            <span className={styles.detailLabel}>{locale === 'ta' ? 'பந்துவீச்சு' : 'Bowling'}:</span>
                                                            <span className={styles.playerInfo}>
                                                                {lastBowler.bowler?.name} <strong>{lastBowler.w}-{lastBowler.r} ({lastBowler.o})</strong>
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {match.has_prediction && (
                                    <Link href={`/${locale}/analysis`} className={styles.predictionLink}>
                                        ✦ {locale === 'ta' ? 'ஆய்வு கிடைக்கும்' : 'Analysis Available'} →
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>

    );
}
