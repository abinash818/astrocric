const { pool } = require('../config/database');

/**
 * Bank-Level Ledger Service
 * Implements Double-Entry Accounting with Acid Transactions
 */
class LedgerService {

    /**
     * Create a new Account (Wallet, Escrow, etc.)
     * @param {Object} params
     * @param {string} params.name - Account Name
     * @param {string} params.type - USER_WALLET, PLATFORM_ESCROW, etc.
     * @param {string} params.nature - ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
     * @param {number} [params.ownerId] - User ID (Optional)
     * @param {string} [params.currency='INR']
     * @returns {Promise<Object>} Created Account
     */
    async createAccount({ name, type, nature, ownerId = null, currency = 'INR' }) {
        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO accounts (name, type, nature, owner_id, currency)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const values = [name, type, nature, ownerId, currency];
            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    /**
     * Get Account by ID
     */
    async getAccount(accountId) {
        const result = await pool.query('SELECT * FROM accounts WHERE id = $1', [accountId]);
        return result.rows[0];
    }

    /**
     * Get User's Wallet Account
     */
    async getUserWallet(userId) {
        const result = await pool.query(
            "SELECT * FROM accounts WHERE owner_id = $1 AND type = 'USER_WALLET' LIMIT 1",
            [userId]
        );
        return result.rows[0];
    }

    /**
     * Post a Double-Entry Transaction (ACID)
     * @param {Object} entry
     * @param {string} entry.transactionId - Idempotency Key
     * @param {string} entry.description
     * @param {string} entry.referenceType
     * @param {string} entry.referenceId
     * @param {Array<{accountId: string, type: 'DEBIT'|'CREDIT', amount: number}>} entry.lines
     */
    async postTransaction({ transactionId, description, referenceType, referenceId, lines }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            console.log(`[Ledger] Posting TX: ${transactionId} - ${description}`);

            // 1. Collect Account IDs & Validate Basics
            const accountIds = new Set();
            let totalDebit = 0;
            let totalCredit = 0;

            for (const line of lines) {
                if (!line.amount || line.amount <= 0) throw new Error(`Invalid amount: ${line.amount}`);
                if (!['DEBIT', 'CREDIT'].includes(line.type)) throw new Error(`Invalid type: ${line.type}`);

                if (line.type === 'DEBIT') totalDebit += Number(line.amount);
                else totalCredit += Number(line.amount);

                accountIds.add(line.accountId);
            }

            if (totalDebit !== totalCredit) {
                throw new Error(`Unbalanced Transaction: Debit ${totalDebit} != Credit ${totalCredit}`);
            }

            // 2. Lock & Fetch Accounts (Pessimistic Locking)
            // Sort IDs to prevent Deadlocks
            const sortedIds = Array.from(accountIds).sort();
            const accountsRes = await client.query(
                `SELECT id, nature, balance FROM accounts WHERE id = ANY($1::uuid[]) FOR UPDATE`,
                [sortedIds]
            );

            if (accountsRes.rows.length !== sortedIds.length) {
                throw new Error('Some accounts not found or could not be locked');
            }

            const accounts = new Map();
            accountsRes.rows.forEach(acc => accounts.set(acc.id, acc));

            // 3. Create Journal Entry Header
            const journalRes = await client.query(
                `INSERT INTO journal_entries 
                (transaction_id, description, reference_type, reference_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id`,
                [transactionId, description, referenceType, referenceId]
            );
            const journalId = journalRes.rows[0].id;

            // 4. Process Lines & Update Balances
            for (const line of lines) {
                const account = accounts.get(line.accountId);

                // Insert Line
                await client.query(
                    `INSERT INTO journal_lines (journal_entry_id, account_id, type, amount)
                     VALUES ($1, $2, $3, $4)`,
                    [journalId, line.accountId, line.type, line.amount]
                );

                // Calculate Balance Change
                let balanceChange = 0;
                const isDebit = line.type === 'DEBIT';

                if (['ASSET', 'EXPENSE'].includes(account.nature)) {
                    balanceChange = isDebit ? line.amount : -line.amount;
                } else {
                    balanceChange = isDebit ? -line.amount : line.amount; // Liability/Equity/Revenue
                }

                // Update Account
                await client.query(
                    `UPDATE accounts 
                     SET balance = balance + $1, version = version + 1, updated_at = NOW()
                     WHERE id = $2`,
                    [balanceChange, line.accountId]
                );
            }

            await client.query('COMMIT');
            console.log(`[Ledger] TX Committed: ${journalId}`);
            return { journalId, transactionId, status: 'COMMITTED' };

        } catch (e) {
            await client.query('ROLLBACK');
            console.error('[Ledger] Transaction Failed:', e.message);
            // Handle duplicate transactionId (Idempotency)
            if (e.code === '23505' && e.constraint?.includes('transaction_id')) {
                console.warn('[Ledger] Idempotent hit for:', transactionId);
                throw new Error(`Transaction already processed: ${transactionId}`);
            }
            throw e;
        } finally {
            client.release();
        }
    }
}

module.exports = new LedgerService();
