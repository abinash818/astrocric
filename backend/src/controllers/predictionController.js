const db = require('../config/database');

// Get prediction for a match
const getPredictionByMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user?.id;

        // Get prediction
        const predResult = await db.query(
            `SELECT p.*, m.team1, m.team2, m.match_date, m.status as match_status
       FROM predictions p
       JOIN matches m ON p.match_id = m.id
       WHERE p.match_id = $1 AND p.is_published = true`,
            [matchId]
        );

        if (predResult.rows.length === 0) {
            return res.status(404).json({ error: 'No prediction available for this match' });
        }

        const prediction = predResult.rows[0];

        // Check if user has purchased this prediction
        let isPurchased = false;
        if (userId) {
            const purchaseResult = await db.query(
                'SELECT id FROM purchases WHERE user_id = $1 AND prediction_id = $2 AND payment_status = $3',
                [userId, prediction.id, 'success']
            );
            isPurchased = purchaseResult.rows.length > 0;
        }

        // Return appropriate data based on purchase status
        if (isPurchased) {
            res.json({
                id: prediction.id,
                matchId: prediction.match_id,
                title: prediction.title,
                fullPrediction: prediction.full_prediction,
                predictedWinner: prediction.predicted_winner,
                confidencePercentage: prediction.confidence_percentage,
                price: parseFloat(prediction.price),
                isPurchased: true,
                match: {
                    team1: prediction.team1,
                    team2: prediction.team2,
                    matchDate: prediction.match_date,
                    status: prediction.match_status
                }
            });
        } else {
            // Show only preview
            res.json({
                id: prediction.id,
                matchId: prediction.match_id,
                title: prediction.title,
                previewText: prediction.preview_text,
                confidencePercentage: prediction.confidence_percentage,
                price: parseFloat(prediction.price),
                isPurchased: false,
                fullPrediction: null,
                match: {
                    team1: prediction.team1,
                    team2: prediction.team2,
                    matchDate: prediction.match_date,
                    status: prediction.match_status
                }
            });
        }
    } catch (error) {
        console.error('Get prediction error:', error);
        res.status(500).json({ error: 'Failed to fetch prediction' });
    }
};

// Get all purchased predictions for a user
const getPurchasedPredictions = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            `SELECT 
        p.id, p.title, p.full_prediction, p.predicted_winner, 
        p.confidence_percentage, p.price,
        m.team1, m.team2, m.match_date, m.status as match_status,
        pu.created_at as purchased_at
       FROM purchases pu
       JOIN predictions p ON pu.prediction_id = p.id
       JOIN matches m ON p.match_id = m.id
       WHERE pu.user_id = $1 AND pu.payment_status = 'success'
       ORDER BY pu.created_at DESC`,
            [userId]
        );

        const predictions = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            fullPrediction: row.full_prediction,
            predictedWinner: row.predicted_winner,
            confidencePercentage: row.confidence_percentage,
            price: parseFloat(row.price),
            purchasedAt: row.purchased_at,
            match: {
                team1: row.team1,
                team2: row.team2,
                matchDate: row.match_date,
                status: row.match_status
            }
        }));

        res.json({ predictions });
    } catch (error) {
        console.error('Get purchased predictions error:', error);
        res.status(500).json({ error: 'Failed to fetch purchased predictions' });
    }
};

module.exports = {
    getPredictionByMatch,
    getPurchasedPredictions
};
