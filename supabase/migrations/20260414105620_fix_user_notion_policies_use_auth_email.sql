/*
  # Fix user_notion RLS policies: replace auth.users subquery with auth.email()

  ## Problem
  The user policies on user_notion used:
    (SELECT email FROM auth.users WHERE id = auth.uid())
  
  The `authenticated` role does NOT have SELECT privilege on `auth.users`,
  so this subquery causes "permission denied for table users" on every
  INSERT / UPDATE / DELETE / SELECT by regular users.

  ## Solution
  Replace all occurrences of the auth.users subquery with the built-in
  Supabase helper function `auth.email()`, which returns the current
  authenticated user's email without requiring direct table access.

  ## Changes
  - Dropped & recreated: 4 regular-user policies on user_notion
    (SELECT, INSERT, UPDATE, DELETE)
  - No schema or data changes
*/

DROP POLICY IF EXISTS "Users can select own notion settings" ON public.user_notion;
DROP POLICY IF EXISTS "Users can insert own notion settings" ON public.user_notion;
DROP POLICY IF EXISTS "Users can update own notion settings" ON public.user_notion;
DROP POLICY IF EXISTS "Users can delete own notion settings" ON public.user_notion;

CREATE POLICY "Users can select own notion settings"
  ON public.user_notion
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

CREATE POLICY "Users can insert own notion settings"
  ON public.user_notion
  FOR INSERT
  TO authenticated
  WITH CHECK (email = auth.email());

CREATE POLICY "Users can update own notion settings"
  ON public.user_notion
  FOR UPDATE
  TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

CREATE POLICY "Users can delete own notion settings"
  ON public.user_notion
  FOR DELETE
  TO authenticated
  USING (email = auth.email());
