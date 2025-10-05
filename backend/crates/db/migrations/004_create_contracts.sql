-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    address VARCHAR(66) PRIMARY KEY,
    code_hash VARCHAR(66) NOT NULL,
    deployer VARCHAR(66) NOT NULL,
    deploy_block BIGINT REFERENCES blocks(number),
    deploy_tx_hash VARCHAR(66),
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create contract verifications table
CREATE TABLE IF NOT EXISTS contract_verifications (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(66) NOT NULL REFERENCES contracts(address) ON DELETE CASCADE,
    wasm_hash VARCHAR(66) NOT NULL,
    metadata JSONB NOT NULL,
    source_files JSONB NOT NULL,
    compiler_version VARCHAR(50),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'building', 'success', 'failed')),
    error_message TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_deployer ON contracts(deployer);
CREATE INDEX idx_contracts_verified ON contracts(verified);
CREATE INDEX idx_verifications_status ON contract_verifications(status);
CREATE INDEX idx_verifications_contract ON contract_verifications(contract_address);
