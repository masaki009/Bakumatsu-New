/*
  # Add created_at column to users table

  The public.users table was missing a created_at column
  that the TypeScript UserProfile interface expects.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;
