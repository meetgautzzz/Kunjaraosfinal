-- proposal_examples — anonymised approved proposals used as few-shot examples
-- at generation time. Promoted automatically when a proposal is APPROVED/SHARED/SAVED.
-- No user_id — data is anonymised before storage (original_brief strips client PII).

CREATE TABLE IF NOT EXISTS proposal_examples (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT        NOT NULL,
  budget_bucket   TEXT        NOT NULL, -- "under_5L" | "5L_to_15L" | "15L_to_50L" | "over_50L"
  location        TEXT        NOT NULL DEFAULT '',
  original_brief  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  generated_output JSONB      NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proposal_examples_lookup_idx
  ON proposal_examples (event_type, budget_bucket);

-- Service role only — no user-facing RLS needed (no user_id column).
ALTER TABLE proposal_examples ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by server-side admin client).
CREATE POLICY "service_role_all" ON proposal_examples
  FOR ALL USING (true) WITH CHECK (true);
