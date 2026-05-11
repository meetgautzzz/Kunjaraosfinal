-- Track proposal usage per user (replaces AI credit system for gating).
CREATE TABLE IF NOT EXISTS public.user_usage (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan           TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
  proposals_used INT  NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_usage' AND policyname = 'users_read_own_usage'
  ) THEN
    CREATE POLICY "users_read_own_usage" ON public.user_usage
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_usage' AND policyname = 'users_update_own_usage'
  ) THEN
    CREATE POLICY "users_update_own_usage" ON public.user_usage
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_usage' AND policyname = 'users_insert_own_usage'
  ) THEN
    CREATE POLICY "users_insert_own_usage" ON public.user_usage
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
