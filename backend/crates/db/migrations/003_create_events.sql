-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL REFERENCES blocks(number) ON DELETE CASCADE,
    extrinsic_id BIGINT REFERENCES extrinsics(id) ON DELETE SET NULL,
    index INT NOT NULL,
    pallet VARCHAR(100) NOT NULL,
    method VARCHAR(100) NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(block_number, index)
);

CREATE INDEX idx_events_block_number ON events(block_number DESC);
CREATE INDEX idx_events_extrinsic_id ON events(extrinsic_id);
CREATE INDEX idx_events_pallet_method ON events(pallet, method);
