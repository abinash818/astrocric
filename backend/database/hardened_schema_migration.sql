-- Migration: Hardened Fintech Schema
-- Adds new states, UTR support, and Disputes table

-- 1. Update accounts table types
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check CHECK (type IN ('USER_WALLET', 'PLATFORM_ESCROW', 'SETTLEMENT_PENDING', 'REVENUE', 'EXPENSE', 'GATEWAY_RECEIVABLE'));

-- 2. Update payment_orders table with new columns and states
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS utr_number VARCHAR(50);
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128); -- SHA256

ALTER TABLE payment_orders DROP CONSTRAINT IF EXISTS payment_orders_status_check;
ALTER TABLE payment_orders ADD CONSTRAINT payment_orders_status_check CHECK (status IN ('CREATED', 'INITIATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'SUCCESS', 'FAILED', 'REFUNDED', 'EXPIRED', 'SETTLING', 'SETTLED', 'REFUND_INITIATED', 'DISPUTED'));

-- 3. Create Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_order_id UUID REFERENCES payment_orders(id),
    user_id INTEGER REFERENCES users(id),
    utr_number VARCHAR(50),
    screenshot_url TEXT,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'REJECTED')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_utr ON disputes(utr_number);

DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON disputes
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
