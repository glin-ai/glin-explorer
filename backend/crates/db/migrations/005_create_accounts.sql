-- Create accounts table (for cached balances)
CREATE TABLE IF NOT EXISTS accounts (
    address VARCHAR(66) PRIMARY KEY,
    balance VARCHAR(100) NOT NULL DEFAULT '0', -- u128 as string
    nonce BIGINT NOT NULL DEFAULT 0,
    last_updated_block BIGINT,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_updated ON accounts(last_updated_at DESC);
