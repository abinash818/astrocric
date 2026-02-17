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

        // Combine and deduplicate
        const allMatches = [...currentMatches, ...upcomingMatches];
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
               result = $9, synced_at = NOW()
           WHERE api_match_id = $10`,
                    [
                        matchData.team1, matchData.team2, matchData.team1_flag_url,
                        matchData.team2_flag_url, matchData.match_date, matchData.match_type,
                        matchData.venue, matchData.status, matchData.result,
                        matchData.api_match_id
                    ]
                );
                updatedCount++;
            } else {
                // Insert new match
                await db.query(
                    `INSERT INTO matches 
           (api_match_id, team1, team2, team1_flag_url, team2_flag_url,
            match_date, match_type, venue, status, result, synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
                    [
                        matchData.api_match_id, matchData.team1, matchData.team2,
                        matchData.team1_flag_url, matchData.team2_flag_url,
                        matchData.match_date, matchData.match_type, matchData.venue,
                        matchData.status, matchData.result
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
        confidence_percentage, price, is_published, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [
                matchId, title, previewText, fullPrediction, predictedWinner,
                confidencePercentage, price, isPublished || false, req.user.id
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
           is_published = COALESCE($7, is_published),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
            [title, previewText, fullPrediction, predictedWinner, confidencePercentage, price, isPublished, id]
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

module.exports = {
    adminAuth,
    syncMatches,
    createPrediction,
    updatePrediction,
    deletePrediction,
    getDashboardStats
};
