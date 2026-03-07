ALTER TABLE tapping_sessions
  ADD COLUMN IF NOT EXISTS session_type text DEFAULT 'traditional',
  ADD COLUMN IF NOT EXISTS peak_suds integer,
  ADD COLUMN IF NOT EXISTS support_contacted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_integration_used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_tearless_trauma boolean DEFAULT false;