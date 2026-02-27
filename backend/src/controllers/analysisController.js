const db = require('../config/database');

// Get analysis for a match
const getAnalysisByMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user?.id;

        // Get analysis
        const analysisResult = await db.query(
            `SELECT p.*, m.team1, m.team2, m.match_date, m.status as match_status
       FROM predictions p
       JOIN matches m ON p.match_id = m.id
       WHERE p.match_id = $1 AND p.is_published = true`,
            [matchId]
        );

        if (analysisResult.rows.length === 0) {
            return res.status(404).json({ error: 'No analysis available for this match' });
        }

        const analysis = analysisResult.rows[0];

        // Check if user has purchased this analysis
        let isPurchased = false;
        if (userId) {
            const purchaseResult = await db.query(
                'SELECT id FROM purchases WHERE user_id = $1 AND prediction_id = $2 AND payment_status = $3',
                [userId, analysis.id, 'success']
            );
            isPurchased = purchaseResult.rows.length > 0;
        }

        // Return appropriate data based on purchase status
        if (isPurchased) {
            res.json({
                id: analysis.id,
                matchId: analysis.match_id,
                title: analysis.title,
                fullAnalysis: analysis.full_prediction,
                analysisResult: analysis.predicted_winner,
                confidencePercentage: analysis.confidence_percentage,
                price: parseFloat(analysis.price),
                playerAnalysisPrice: parseFloat(analysis.player_analysis_price),
                comboPrice: parseFloat(analysis.combo_price),
                keyPlayers: analysis.key_players,
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
                id: analysis.id,
                matchId: analysis.match_id,
                title: analysis.title,
                previewText: analysis.preview_text,
                confidencePercentage: analysis.confidence_percentage,
                price: parseFloat(analysis.price),
                playerAnalysisPrice: parseFloat(analysis.player_analysis_price),
                comboPrice: parseFloat(analysis.combo_price),
                isPurchased: false,
                fullAnalysis: null,
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
        p.confidence_percentage, p.price, p.player_analysis_price, p.combo_price, p.key_players,
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
            fullAnalysis: row.full_prediction,
            analysisResult: row.predicted_winner,
            confidencePercentage: row.confidence_percentage,
            price: parseFloat(row.price),
            playerAnalysisPrice: parseFloat(row.player_prediction_price),
            comboPrice: parseFloat(row.combo_price),
            keyPlayers: row.key_players,
            purchasedAt: row.purchased_at,
            match: {
                team1: row.team1,
                team2: row.team2,
                matchDate: row.match_date,
                status: row.match_status
            }
        }));

        res.json({ analyses: predictions });
    } catch (error) {
        console.error('Get purchased predictions error:', error);
        res.status(500).json({ error: 'Failed to fetch purchased predictions' });
    }
};

module.exports = {
    getAnalysisByMatch,
    getPurchasedAnalyses: getPurchasedPredictions
};
