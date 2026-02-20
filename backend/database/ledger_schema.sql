-- Bank-Level Ledger Schema
-- Implements Double-Entry Accounting and Payment State Machine

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Accounts Table (The Chart of Accounts)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id INTEGER REFERENCES users(id), -- Nullable for System Accounts
    name VARCHAR(100) NOT NULL, -- e.g., "User 123 Wallet", "Platform Escrow"
    type VARCHAR(50) NOT NULL CHECK (type IN ('USER_WALLET', 'PLATFORM_ESCROW', 'SETTLEMENT_PENDING', 'REVENUE', 'EXPENSE')),
    nature VARCHAR(20) NOT NULL CHECK (nature IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    currency VARCHAR(3) DEFAULT 'INR',
    balance BIGINT NOT NULL DEFAULT 0, -- Stored in Paise (Integer)
    version BIGINT NOT NULL DEFAULT 1, -- For Optimistic Locking
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

-- 2. Journal Entries (Transaction Header)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(100) UNIQUE NOT NULL, -- Idempotency Key
    sequence_number BIGSERIAL, -- Global Ordering
    reference_type VARCHAR(50), -- e.g., 'PAYMENT_ORDER', 'REFUND'
    reference_id VARCHAR(100), -- Link to external entity
    description TEXT,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_ref ON journal_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tx ON journal_entries(transaction_id);

-- 3. Journal Lines (Double-Entry Rows)
CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
    amount BIGINT NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_id);

-- 4. Payment Orders (State Machine)
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_transaction_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    amount BIGINT NOT NULL CHECK (amount > 0), -- Paise
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL CHECK (status IN ('CREATED', 'AUTHORIZED', 'CAPTURED', 'SETTLED', 'FAILED', 'REFUNDED', 'EXPIRED')),
    gateway_id VARCHAR(100), -- PhonePe / Gateway TXN ID
    gateway_signature TEXT,
    ledger_journal_id UUID REFERENCES journal_entries(id), -- Link to Settlement Journal
    error_message TEXT,
    expires_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_merchant_txn ON payment_orders(merchant_transaction_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON payment_orders;
CREATE TRIGGER update_payment_orders_updated_at
BEFORE UPDATE ON payment_orders
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
