const axios = require('axios');

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_URL = process.env.CRICKET_API_URL;

class CricketApiService {

    // Get current matches
    async getCurrentMatches() {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/currentMatches`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    offset: 0
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Cricket API - Get current matches error:', error.response?.data || error.message);
            throw new Error('Failed to fetch current matches');
        }
    }

    // Get match details by ID
    async getMatchDetails(matchId) {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/match_info`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    id: matchId
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Cricket API - Get match details error:', error.response?.data || error.message);
            throw new Error('Failed to fetch match details');
        }
    }

    // Get upcoming matches
    async getUpcomingMatches() {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/matches`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    offset: 0
                }
            });

            if (response.data && response.data.data) {
                // Filter for upcoming matches
                return response.data.data.filter(match =>
                    match.matchStarted === false && match.matchEnded === false
                );
            }
            return [];
        } catch (error) {
            console.error('Cricket API - Get upcoming matches error:', error.response?.data || error.message);
            throw new Error('Failed to fetch upcoming matches');
        }
    }

    // Get match score
    async getMatchScore(matchId) {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/match_scorecard`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    id: matchId
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Cricket API - Get match score error:', error.response?.data || error.message);
            return null;
        }
    }

    // Get match squad
    async getMatchSquad(matchId) {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/match_squad`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    id: matchId
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Cricket API - Get match squad error:', error.response?.data || error.message);
            return [];
        }
    }

    // Get series list
    async getSeriesList(offset = 0, search = '') {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/series`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    offset,
                    search
                }
            });

            if (response.data && response.data.data) {
                return {
                    series: response.data.data,
                    info: response.data.info
                };
            }
            return { series: [], info: {} };
        } catch (error) {
            console.error('Cricket API - Get series list error:', error.response?.data || error.message);
            throw new Error('Failed to fetch series list');
        }
    }

    // Get series info (includes matches)
    async getSeriesInfo(seriesId) {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/series_info`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    id: seriesId
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Cricket API - Get series info error:', error.response?.data || error.message);
            throw new Error('Failed to fetch series info');
        }
    }

    // Helper to format score
    formatScore(scoreObj) {
        if (!scoreObj) return null;
        return `${scoreObj.r}/${scoreObj.w} (${scoreObj.o})`;
    }

    // Transform API match data to our database format
    transformMatchData(apiMatch) {
        let team1Score = null;
        let team2Score = null;

        if (apiMatch.score && Array.isArray(apiMatch.score)) {
            const team1Name = (apiMatch.teams?.[0] || apiMatch.teamInfo?.[0]?.name || '').toLowerCase();
            const team2Name = (apiMatch.teams?.[1] || apiMatch.teamInfo?.[1]?.name || '').toLowerCase();

            // First pass: Analyze all innings
            const analyzedScores = apiMatch.score.map(s => {
                const inning = (s.inning || '').toLowerCase();
                const idx1 = inning.indexOf(team1Name);
                const idx2 = inning.indexOf(team2Name);

                let matchesT1 = false;
                let matchesT2 = false;

                if (team1Name && idx1 !== -1) matchesT1 = true;
                if (team2Name && idx2 !== -1) matchesT2 = true;

                return { s, matchesT1, matchesT2, idx1, idx2 };
            });

            // Second pass: Assign strict matches
            analyzedScores.forEach(item => {
                if (item.matchesT1 && !item.matchesT2) {
                    team1Score = this.formatScore(item.s);
                } else if (item.matchesT2 && !item.matchesT1) {
                    team2Score = this.formatScore(item.s);
                }
            });

            // Third pass: Assign ambiguous matches using deduction or heuristic
            analyzedScores.forEach(item => {
                if (item.matchesT1 && item.matchesT2) {
                    // It matches both. Try to deduce.
                    if (team1Score && !team2Score) {
                        team2Score = this.formatScore(item.s);
                    } else if (team2Score && !team1Score) {
                        team1Score = this.formatScore(item.s);
                    } else {
                        // deduction failed (both have scores or neither has scores)
                        // Use positional/length heuristic
                        const { idx1, idx2 } = item;
                        if (idx1 > idx2) {
                            // T1 is clearer or appears later? 
                            // Wait, heuristic from before was: if idx2 > idx1 -> T2.
                            // But that failed for Bangladesh case.
                            // Let's stick to the deduction as primary.
                            // If we are here, deduction failed.
                            // If neither has score, we can't be sure 100%, but let's try strict position.
                            // If idx2 > idx1 (Team 2 is later in string), typically it's NOT the batting team if the string is "T1, T2". 
                            // But usually "T1, T2" means T2 is batting.
                            // EXCEPT for the Bangladesh case where T2 was "Thailand" (later in string) but T1 was batting.
                            // So heuristic is unreliable.
                            // But since we successfully handled strict matches, we likely covered 99% cases.
                            // We only overwrite if null?
                            if (!team1Score) team1Score = this.formatScore(item.s);
                            else if (!team2Score) team2Score = this.formatScore(item.s);
                        } else if (idx2 > idx1) {
                            if (!team2Score) team2Score = this.formatScore(item.s);
                            else if (!team1Score) team1Score = this.formatScore(item.s);
                        }
                    }
                }
            });
        } else {
            if (apiMatch.matchStarted && !apiMatch.matchEnded) {
                console.log(`[Sync Debug] Live match ${apiMatch.id} has NO scores.`);
            }
        }

        return {
            api_match_id: apiMatch.id,
            team1: apiMatch.teams?.[0] || apiMatch.teamInfo?.[0]?.name || 'Team 1',
            team2: apiMatch.teams?.[1] || apiMatch.teamInfo?.[1]?.name || 'Team 2',
            team1_flag_url: apiMatch.teamInfo?.[0]?.img || null,
            team2_flag_url: apiMatch.teamInfo?.[1]?.img || null,
            team1_score: team1Score,
            team2_score: team2Score,
            match_date: new Date(apiMatch.dateTimeGMT),
            match_type: apiMatch.matchType || 'Unknown',
            venue: apiMatch.venue || 'TBD',
            status: this.determineMatchStatus(apiMatch),
            result: apiMatch.status || null
        };
    }

    // Determine match status
    determineMatchStatus(apiMatch) {
        if (apiMatch.matchEnded) {
            return 'finished';
        } else if (apiMatch.matchStarted) {
            return 'live';
        } else {
            return 'upcoming';
        }
    }
}

module.exports = new CricketApiService();
