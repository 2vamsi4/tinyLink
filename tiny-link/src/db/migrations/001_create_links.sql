CREATE TABLE IF NOT EXISTS links (
  code VARCHAR(8) PRIMARY KEY,
  target_url TEXT NOT NULL,
  clicks BIGINT NOT NULL DEFAULT 0,
  last_clicked TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_links_target_url ON links (target_url);
