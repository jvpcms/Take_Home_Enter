CREATE TABLE extraction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  file_hash TEXT NOT NULL,
  extraction_key TEXT NOT NULL,
  extracted_data TEXT NOT NULL
);

CREATE INDEX idx_extraction_cache_composite_search ON extraction_cache (session_id, file_hash, extraction_key);