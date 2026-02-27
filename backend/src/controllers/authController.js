const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Sync Firebase User with local database
const syncFirebaseUser = async (req, res) => {
    try {
        const { email, name, phone, uid, photoURL } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // 1. Check if user exists in our DB
        console.log(`[AuthSync] Checking existence for ${email}`);
        let userResult = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        let user;
        if (userResult.rows.length === 0) {
            // 2. Create new user if not exists
            console.log(`[AuthSync] Creating new user for ${email}`);
            const newUser = await db.query(
                `INSERT INTO users (email, name, phone, last_login) 
                 VALUES ($1, $2, $3, NOW()) 
                 RETURNING *`,
                [email, name || email.split('@')[0], phone || null]
            );
            user = newUser.rows[0];
            console.log('[AuthSync] New user created:', email);
        } else {
            // 3. Update existing user
            user = userResult.rows[0];
            console.log(`[AuthSync] Updating existing user ${user.id}`);
            await db.query(
                'UPDATE users SET last_login = NOW(), name = COALESCE($1, name) WHERE id = $2',
                [name, user.id]
            );
        }

        // 4. Generate Backend JWT
        console.log(`[AuthSync] Generating token for user ${user.id}`);
        if (!process.env.JWT_SECRET) {
            console.error('[AuthSync] CRITICAL: JWT_SECRET is not defined in environment variables');
            throw new Error('JWT_SECRET missing');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        console.log('[AuthSync] Success, returning token and user data');
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                walletBalance: parseFloat(user.wallet_balance || 0),
                isAdmin: user.is_admin
            }
        });
    } catch (error) {
        console.error('[AuthSync] EXCEPTION:', error);
        res.status(500).json({
            error: 'Authentication synchronization failed',
            details: error.message
        });
    }
};

module.exports = {
    syncFirebaseUser
};
