const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../config/database');
const otpService = require('../services/otpService');

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many OTP requests, please try again later'
});

// Send OTP
router.post('/send-otp', otpLimiter, async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || !phone.match(/^\+?[1-9]\d{1,14}$/)) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }

        const otp = otpService.generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Save OTP to database
        await db.query(
            'INSERT INTO otps (phone, otp, expires_at) VALUES ($1, $2, $3)',
            [phone, otp, expiresAt]
        );

        // Send OTP via MSG91
        await otpService.sendOTP(phone, otp);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            expiresIn: 300
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ error: 'Phone and OTP required' });
        }

        // Get latest OTP for this phone
        const otpResult = await db.query(
            'SELECT * FROM otps WHERE phone = $1 AND otp = $2 AND verified = false ORDER BY created_at DESC LIMIT 1',
            [phone, otp]
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        const otpRecord = otpResult.rows[0];

        // Check expiration
        if (new Date() > new Date(otpRecord.expires_at)) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        // Mark OTP as verified
        await db.query(
            'UPDATE otps SET verified = true WHERE id = $1',
            [otpRecord.id]
        );

        // Get or create user
        let userResult = await db.query(
            'SELECT * FROM users WHERE phone = $1',
            [phone]
        );

        let user;
        if (userResult.rows.length === 0) {
            // Create new user
            const newUser = await db.query(
                'INSERT INTO users (phone, last_login) VALUES ($1, NOW()) RETURNING *',
                [phone]
            );
            user = newUser.rows[0];
        } else {
            // Update last login
            await db.query(
                'UPDATE users SET last_login = NOW() WHERE id = $1',
                [userResult.rows[0].id]
            );
            user = userResult.rows[0];
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                email: user.email,
                walletBalance: parseFloat(user.wallet_balance)
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Admin login
router.post('/admin/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Phone required' });
        }

        // Get admin user
        const result = await db.query(
            'SELECT * FROM users WHERE phone = $1 AND is_admin = true',
            [phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials or not an admin' });
        }

        const user = result.rows[0];

        // For development, allow login without password
        // In production, implement proper password authentication
        if (process.env.NODE_ENV === 'production' && !password) {
            return res.status(400).json({ error: 'Password required' });
        }

        // Generate admin JWT token
        const token = jwt.sign(
            { id: user.id, phone: user.phone, isAdmin: true },
            process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                isAdmin: true
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get user profile
router.get('/profile', require('../middleware/auth'), async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, phone, name, email, wallet_balance FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            walletBalance: parseFloat(user.wallet_balance)
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

module.exports = router;
