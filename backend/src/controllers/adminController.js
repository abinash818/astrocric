const db = require('../config/database');
const cricketApiService = require('../services/cricketApiService');
const jwt = require('jsonwebtoken');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);

        // Check if user is admin
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1 AND is_admin = true',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Sync matches from Cricket API
const syncMatches = async (req, res) => {
    try {
        console.log('🔄 Starting match sync from Cricket API...');

        // Fetch current and upcoming matches
        const currentMatches = await cricketApiService.getCurrentMatches();
        const upcomingMatches = await cricketApiService.getUpcomingMatches();

        // Combine and deduplicate (Put currentMatches LAST so they overwrite upcoming if duplicates exist)
        const allMatches = [...upcomingMatches, ...currentMatches];
        const uniqueMatches = Array.from(
            new Map(allMatches.map(match => [match.id, match])).values()
        );

        let syncedCount = 0;
        let updatedCount = 0;

        for (const apiMatch of uniqueMatches) {
            const matchData = cricketApiService.transformMatchData(apiMatch);

            // Check if match exists
            const existing = await db.query(
                'SELECT id FROM matches WHERE api_match_id = $1',
                [matchData.api_match_id]
            );

            if (existing.rows.length > 0) {
                // Update existing match
                await db.query(
                    `UPDATE matches 
                     SET team1 = $1, team2 = $2, team1_flag_url = $3, team2_flag_url = $4,
                         match_date = $5, match_type = $6, venue = $7, status = $8,
                         result = $9, team1_score = $10, team2_score = $11, synced_at = NOW()
                     WHERE api_match_id = $12`,
                    [
                        matchData.team1, matchData.team2, matchData.team1_flag_url,
                        matchData.team2_flag_url, matchData.match_date, matchData.match_type,
                        matchData.venue, matchData.status, matchData.result,
                        matchData.team1_score, matchData.team2_score,
                        matchData.api_match_id
                    ]
                );
                updatedCount++;
            } else {
                // Insert new match
                await db.query(
                    `INSERT INTO matches 
                     (api_match_id, team1, team2, team1_flag_url, team2_flag_url,
                      match_date, match_type, venue, status, result, team1_score, team2_score, synced_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
                    [
                        matchData.api_match_id, matchData.team1, matchData.team2,
                        matchData.team1_flag_url, matchData.team2_flag_url,
                        matchData.match_date, matchData.match_type, matchData.venue,
                        matchData.status, matchData.result,
                        matchData.team1_score, matchData.team2_score
                    ]
                );
                syncedCount++;
            }
        }

        console.log(`✅ Match sync complete: ${syncedCount} new, ${updatedCount} updated`);

        res.json({
            success: true,
            message: 'Matches synced successfully',
            stats: {
                new: syncedCount,
                updated: updatedCount,
                total: uniqueMatches.length
            }
        });
    } catch (error) {
        console.error('Match sync error:', error);
        res.status(500).json({ error: 'Failed to sync matches' });
    }
};

// Create prediction
const createPrediction = async (req, res) => {
    try {
        const {
            matchId,
            title,
            previewText,
            fullPrediction,
            predictedWinner,
            confidencePercentage,
            price,
            player_prediction_price,
            combo_price,
            key_players,
            isPublished
        } = req.body;

        // Validate required fields
        if (!matchId || !title || !fullPrediction || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if match exists
        const matchResult = await db.query(
            'SELECT id FROM matches WHERE id = $1',
            [matchId]
        );

        if (matchResult.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Create prediction
        const result = await db.query(
            `INSERT INTO predictions 
       (match_id, title, preview_text, full_prediction, predicted_winner,
        confidence_percentage, price, player_prediction_price, combo_price, key_players, is_published, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
            [
                matchId, title, previewText, fullPrediction, predictedWinner,
                confidencePercentage, price, player_prediction_price, combo_price,
                key_players ? JSON.stringify(key_players) : null,
                isPublished || false, req.user.id
            ]
        );

        res.json({
            success: true,
            prediction: result.rows[0]
        });
    } catch (error) {
        console.error('Create prediction error:', error);

        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'Prediction already exists for this match' });
        }

        res.status(500).json({ error: 'Failed to create prediction' });
    }
};

// Update prediction
const updatePrediction = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            previewText,
            fullPrediction,
            predictedWinner,
            confidencePercentage,
            price,
            player_prediction_price,
            combo_price,
            key_players,
            isPublished
        } = req.body;

        const result = await db.query(
            `UPDATE predictions 
       SET title = COALESCE($1, title),
           preview_text = COALESCE($2, preview_text),
           full_prediction = COALESCE($3, full_prediction),
           predicted_winner = COALESCE($4, predicted_winner),
           confidence_percentage = COALESCE($5, confidence_percentage),
           price = COALESCE($6, price),
           player_prediction_price = COALESCE($7, player_prediction_price),
           combo_price = COALESCE($8, combo_price),
           key_players = COALESCE($9, key_players),
           is_published = COALESCE($10, is_published),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
            [
                title, previewText, fullPrediction, predictedWinner,
                confidencePercentage, price, player_prediction_price, combo_price,
                key_players ? JSON.stringify(key_players) : null,
                isPublished, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prediction not found' });
        }

        res.json({
            success: true,
            prediction: result.rows[0]
        });
    } catch (error) {
        console.error('Update prediction error:', error);
        res.status(500).json({ error: 'Failed to update prediction' });
    }
};

// Delete prediction
const deletePrediction = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM predictions WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prediction not found' });
        }

        res.json({
            success: true,
            message: 'Prediction deleted successfully'
        });
    } catch (error) {
        console.error('Delete prediction error:', error);
        res.status(500).json({ error: 'Failed to delete prediction' });
    }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM predictions WHERE is_published = true) as total_predictions,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM purchases WHERE payment_status = 'success') as total_purchases,
        (SELECT COALESCE(SUM(amount), 0) FROM purchases WHERE payment_status = 'success') as total_revenue,
        (SELECT COUNT(*) FROM matches WHERE status = 'upcoming') as upcoming_matches
    `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// Get match squad
const getMatchSquad = async (req, res) => {
    try {
        const { id } = req.params; // Internal match ID

        // Get api_match_id
        const matchResult = await db.query(
            'SELECT api_match_id FROM matches WHERE id = $1',
            [id]
        );

        if (matchResult.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const apiMatchId = matchResult.rows[0].api_match_id;
        const squad = await cricketApiService.getMatchSquad(apiMatchId);

        res.json({
            success: true,
            squad
        });
    } catch (error) {
        console.error('Get match squad error:', error);
        res.status(500).json({ error: 'Failed to fetch match squad' });
    }
};

// Get series list
const getSeriesList = async (req, res) => {
    try {
        const { offset, search } = req.query;
        const result = await cricketApiService.getSeriesList(offset || 0, search || '');
        res.json(result);
    } catch (error) {
        console.error('Get series list error:', error);
        res.status(500).json({ error: 'Failed to fetch series list' });
    }
};

// Sync matches for a specific series
const syncSeriesMatches = async (req, res) => {
    try {
        const { id } = req.params; // Series ID
        console.log(`🔄 Syncing matches for series: ${id}`);

        const seriesData = await cricketApiService.getSeriesInfo(id);

        if (!seriesData || !seriesData.matchList) {
            return res.status(404).json({ error: 'Series not found or no matches available' });
        }

        let syncedCount = 0;
        let updatedCount = 0;

        for (const apiMatch of seriesData.matchList) {
            const matchData = cricketApiService.transformMatchData(apiMatch);

            // Check if match exists
            const existing = await db.query(
                'SELECT id FROM matches WHERE api_match_id = $1',
                [matchData.api_match_id]
            );

            if (existing.rows.length > 0) {
                // Update existing match
                await db.query(
                    `UPDATE matches 
                     SET team1 = $1, team2 = $2, team1_flag_url = $3, team2_flag_url = $4,
                         match_date = $5, match_type = $6, venue = $7, status = $8,
                         result = $9, team1_score = $10, team2_score = $11, synced_at = NOW()
                     WHERE api_match_id = $12`,
                    [
                        matchData.team1, matchData.team2, matchData.team1_flag_url,
                        matchData.team2_flag_url, matchData.match_date, matchData.match_type,
                        matchData.venue, matchData.status, matchData.result,
                        matchData.team1_score, matchData.team2_score,
                        matchData.api_match_id
                    ]
                );
                updatedCount++;
            } else {
                // Insert new match
                await db.query(
                    `INSERT INTO matches 
                     (api_match_id, team1, team2, team1_flag_url, team2_flag_url,
                      match_date, match_type, venue, status, result, team1_score, team2_score, synced_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
                    [
                        matchData.api_match_id, matchData.team1, matchData.team2,
                        matchData.team1_flag_url, matchData.team2_flag_url,
                        matchData.match_date, matchData.match_type, matchData.venue,
                        matchData.status, matchData.result,
                        matchData.team1_score, matchData.team2_score
                    ]
                );
                syncedCount++;
            }
        }

        res.json({
            success: true,
            message: `Series matches synced: ${syncedCount} new, ${updatedCount} updated`,
            stats: {
                new: syncedCount,
                updated: updatedCount,
                total: seriesData.matchList.length
            }
        });
    } catch (error) {
        console.error('Series sync error:', error);
        res.status(500).json({ error: 'Failed to sync series matches' });
    }
};

// Get list of matches available in the API for sync
const getAvailableMatches = async (req, res) => {
    try {
        console.log('🔄 Fetching available matches from API for selective sync');
        const apiMatches = await cricketApiService.getCurrentMatches();

        if (!apiMatches || !Array.isArray(apiMatches)) {
            return res.json({ success: true, matches: [] });
        }

        // Get already synced matches from DB to show status
        const syncedMatchesResult = await db.query('SELECT api_match_id FROM matches');
        const syncedIds = new Set(syncedMatchesResult.rows.map(r => r.api_match_id));

        const availableMatches = apiMatches.map(match => ({
            ...match,
            isSynced: syncedIds.has(match.id)
        }));

        res.json({
            success: true,
            matches: availableMatches
        });
    } catch (error) {
        console.error('Available matches error:', error);
        res.status(500).json({ error: 'Failed to fetch available matches' });
    }
};

// Sync a single match by API ID
const syncSingleMatch = async (req, res) => {
    try {
        const { apiMatchId } = req.params;
        console.log(`🔄 Syncing single match: ${apiMatchId}`);

        // Fetch details from API
        const apiMatch = await cricketApiService.getMatchDetails(apiMatchId);

        if (!apiMatch) {
            return res.status(404).json({ error: 'Match not found in API' });
        }

        const matchData = cricketApiService.transformMatchData(apiMatch);

        // Check if match exists
        const existing = await db.query(
            'SELECT id FROM matches WHERE api_match_id = $1',
            [matchData.api_match_id]
        );

        if (existing.rows.length > 0) {
            // Update
            await db.query(
                `UPDATE matches 
                 SET team1 = $1, team2 = $2, team1_flag_url = $3, team2_flag_url = $4,
                     match_date = $5, match_type = $6, venue = $7, status = $8,
                     result = $9, team1_score = $10, team2_score = $11, synced_at = NOW()
                 WHERE api_match_id = $12`,
                [
                    matchData.team1, matchData.team2, matchData.team1_flag_url,
                    matchData.team2_flag_url, matchData.match_date, matchData.match_type,
                    matchData.venue, matchData.status, matchData.result,
                    matchData.team1_score, matchData.team2_score,
                    matchData.api_match_id
                ]
            );
        } else {
            // Insert
            await db.query(
                `INSERT INTO matches 
                 (api_match_id, team1, team2, team1_flag_url, team2_flag_url,
                  match_date, match_type, venue, status, result, team1_score, team2_score, synced_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
                [
                    matchData.api_match_id, matchData.team1, matchData.team2,
                    matchData.team1_flag_url, matchData.team2_flag_url,
                    matchData.match_date, matchData.match_type, matchData.venue,
                    matchData.status, matchData.result,
                    matchData.team1_score, matchData.team2_score
                ]
            );
        }

        res.json({
            success: true,
            message: 'Match synced successfully'
        });
    } catch (error) {
        console.error('Single match sync error:', error);
        res.status(500).json({ error: 'Failed to sync match' });
    }
};

module.exports = {
    adminAuth,
    syncMatches,
    getSeriesList,
    syncSeriesMatches,
    getAvailableMatches,
    syncSingleMatch,
    createPrediction,
    updatePrediction,
    deletePrediction,
    getDashboardStats,
    getMatchSquad
};
