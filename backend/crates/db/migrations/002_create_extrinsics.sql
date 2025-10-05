-- Create extrinsics (transactions) table
CREATE TABLE IF NOT EXISTS extrinsics (
    id BIGSERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL REFERENCES blocks(number) ON DELETE CASCADE,
    index INT NOT NULL,
    hash VARCHAR(66) NOT NULL UNIQUE,
    signer VARCHAR(66),
    pallet VARCHAR(100) NOT NULL,
    call VARCHAR(100) NOT NULL,
    args JSONB,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(block_number, index)
);

CREATE INDEX idx_extrinsics_hash ON extrinsics(hash);
CREATE INDEX idx_extrinsics_block_number ON extrinsics(block_number DESC);
CREATE INDEX idx_extrinsics_signer ON extrinsics(signer);
CREATE INDEX idx_extrinsics_pallet_call ON extrinsics(pallet, call);
