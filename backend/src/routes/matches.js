const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');

// Get upcoming matches
router.get('/upcoming', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT m.*, 
        CASE WHEN p.id IS NOT NULL THEN true ELSE false END as has_prediction
       FROM matches m
       LEFT JOIN predictions p ON m.id = p.match_id AND p.is_published = true
       WHERE m.status = 'upcoming'
       ORDER BY m.match_date ASC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await db.query(
            "SELECT COUNT(*) FROM matches WHERE status = 'upcoming'"
        );

        res.json({
            matches: result.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Get upcoming matches error:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Get live matches
router.get('/live', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT m.*, 
        CASE WHEN p.id IS NOT NULL THEN true ELSE false END as has_prediction
       FROM matches m
       LEFT JOIN predictions p ON m.id = p.match_id AND p.is_published = true
       WHERE m.status = 'live'
       ORDER BY m.match_date DESC`
        );

        res.json({ matches: result.rows });
    } catch (error) {
        console.error('Get live matches error:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Get finished matches
router.get('/finished', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT m.* FROM matches m
       WHERE m.status = 'finished'
       AND EXISTS (SELECT 1 FROM predictions p WHERE p.match_id = m.id AND p.is_published = true)
       ORDER BY m.match_date DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await db.query(
            `SELECT COUNT(*) FROM matches m
       WHERE m.status = 'finished'
       AND EXISTS (SELECT 1 FROM predictions p WHERE p.match_id = m.id AND p.is_published = true)`
        );

        res.json({
            matches: result.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Get finished matches error:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Get match by ID
router.get('/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;

        const result = await db.query(
            'SELECT * FROM matches WHERE id = $1',
            [matchId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get match error:', error);
        res.status(500).json({ error: 'Failed to fetch match' });
    }
});

// Get match scorecard
router.get('/:matchId/scorecard', async (req, res) => {
    try {
        const { matchId } = req.params;

        // Get API match ID from DB
        const matchResult = await db.query(
            'SELECT api_match_id FROM matches WHERE id = $1',
            [matchId]
        );

        if (matchResult.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const apiMatchId = matchResult.rows[0].api_match_id;
        const cricketApiService = require('../services/cricketApiService');

        const scorecard = await cricketApiService.getMatchScore(apiMatchId);

        if (!scorecard) {
            return res.status(404).json({ error: 'Scorecard not available' });
        }

        res.json(scorecard);
    } catch (error) {
        console.error('Get match scorecard error:', error);
        res.status(500).json({ error: 'Failed to fetch scorecard' });
    }
});

module.exports = router;
